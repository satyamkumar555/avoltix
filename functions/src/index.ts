import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();
const ORDER_PREFIX = "AVX";
// Keep in sync with admin shipping settings once those exist (paise).
const FREE_SHIPPING_FROM = 99900;
const SHIPPING_FEE = 6000;

type Input = { requestId?: unknown; lines?: unknown; address?: unknown };
const bad = (m: string) => new HttpsError("invalid-argument", m);
const text = (v: unknown, min: number, max: number, label: string): string => {
  if (typeof v !== "string" || v.trim().length < min || v.length > max) throw bad(`Invalid ${label}.`);
  return v.trim();
};

/**
 * Trusted order creation. The client only sends SKUs, quantities and an address.
 * Prices, stock and totals are read and calculated here inside one transaction.
 * The order id is derived from the requestId, so retries never create duplicates.
 */
export const placeOrder = onCall({ region: "asia-south1" }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Please sign in to place an order.");
  const d = (req.data ?? {}) as Input;

  const requestId = text(d.requestId, 8, 64, "request id");
  if (!/^[\w-]+$/.test(requestId)) throw bad("Invalid request id.");
  if (!Array.isArray(d.lines) || d.lines.length < 1 || d.lines.length > 50) throw bad("Cart must have 1 to 50 items.");
  const merged = new Map<string, number>();
  for (const l of d.lines as { sku?: unknown; qty?: unknown }[]) {
    const sku = text(l.sku, 3, 64, "SKU");
    if (typeof l.qty !== "number" || !Number.isInteger(l.qty) || l.qty < 1 || l.qty > 100000) throw bad("Invalid quantity.");
    merged.set(sku, (merged.get(sku) ?? 0) + l.qty);
  }
  const a = (d.address ?? {}) as Record<string, unknown>;
  const address = {
    name: text(a.name, 2, 100, "name"), phone: text(a.phone, 10, 10, "phone"), line1: text(a.line1, 5, 200, "address"),
    city: text(a.city, 2, 80, "city"), state: text(a.state, 2, 80, "state"), pincode: text(a.pincode, 6, 6, "pincode"),
  };
  if (!/^\d{10}$/.test(address.phone) || !/^\d{6}$/.test(address.pincode)) throw bad("Invalid phone or pincode.");

  const orderId = `${uid}_${requestId}`;
  const orderRef = db.doc(`orders/${orderId}`);
  const counterRef = db.doc("counters/orders");

  return db.runTransaction(async (tx) => {
    const existing = await tx.get(orderRef);
    if (existing.exists) return { id: orderId, number: existing.get("number") as string };

    const entries = [...merged.entries()];
    const snaps = await Promise.all(entries.map(([sku]) => tx.get(db.doc(`products/${sku}`))));
    const counter = await tx.get(counterRef);

    const lines: { id: string; sku: string; name: string; qty: number; unit: number }[] = [];
    snaps.forEach((s, i) => {
      const [sku, qty] = entries[i]!;
      if (!s.exists || s.get("status") !== "published") throw new HttpsError("failed-precondition", `Product ${sku} is no longer available.`);
      const name = s.get("name") as string;
      const avail = (s.get("stock") as number) - ((s.get("reserved") as number) ?? 0);
      if (qty < ((s.get("minOrderQty") as number) ?? 1)) throw new HttpsError("failed-precondition", `Minimum order quantity for ${name} is ${s.get("minOrderQty")}.`);
      if (qty > avail) throw new HttpsError("failed-precondition", `Only ${Math.max(0, avail)} left of ${name}.`);
      lines.push({ id: sku, sku, name, qty, unit: s.get("price") as number });
    });

    const subtotal = lines.reduce((t, l) => t + l.qty * l.unit, 0);
    const shipping = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
    const n = ((counter.get("n") as number | undefined) ?? 0) + 1;
    const number = `${ORDER_PREFIX}-${new Date().getFullYear()}-${String(n).padStart(6, "0")}`;

    tx.set(counterRef, { n });
    tx.set(orderRef, {
      number, customerId: uid, customerEmail: req.auth?.token.email ?? "", address, lines, subtotal, shipping, total: subtotal + shipping,
      status: "Pending", paymentStatus: "unpaid", createdAt: FieldValue.serverTimestamp(),
      statusHistory: [{ status: "Pending", at: Timestamp.now() }],
    });
    for (const l of lines) {
      tx.update(db.doc(`products/${l.sku}`), { stock: FieldValue.increment(-l.qty), updatedAt: FieldValue.serverTimestamp() });
      tx.set(db.collection("inventoryMovements").doc(), { sku: l.sku, delta: -l.qty, reason: "order", orderId, at: FieldValue.serverTimestamp() });
    }
    return { id: orderId, number };
  });
});
