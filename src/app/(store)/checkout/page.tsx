"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { formatINR } from "@/lib/money";
import { firebaseReady } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth";
import { shippingFor, useStore } from "@/lib/store";

const addr = z.object({
  name: z.string().min(2, "Enter your name"), phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
  line1: z.string().min(5, "Enter your address"), city: z.string().min(2, "Enter city"), state: z.string().min(2, "Enter state"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
});

export default function Checkout() {
  const { cart, products, placeOrder } = useStore();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [err, setErr] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const requestId = useRef(typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()));
  const subtotal = cart.reduce((s, l) => s + l.qty * (products.find((p) => p.sku === l.id)?.price ?? 0), 0);
  const ship = shippingFor(subtotal);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (busy) return;
    const parsed = addr.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) { setErr(parsed.error.issues.map((i) => i.message)); return; }
    setBusy(true); setErr([]);
    const res = await placeOrder(parsed.data, requestId.current);
    if (typeof res === "string") { setErr([res]); setBusy(false); return; }
    router.push("/orders?placed=" + res.number);
  }
  if (loading) return <p className="sec note">Loading…</p>;
  if (firebaseReady && !user) return <section className="sec"><h2>Sign in to place your order</h2><Link className="btn" href="/login">Sign in or register</Link></section>;
  if (!cart.length) return <section className="sec"><h2>Nothing to check out</h2><Link className="btn" href="/products">Browse products</Link></section>;
  return (
    <section className="sec"><h2>Checkout</h2>
      <p className="note">Online payment is not enabled. This places an <strong>unpaid order request</strong>; our team will confirm it and contact you.</p>
      <form className="form" onSubmit={submit}>
        <input name="name" placeholder="Full name" /><input name="phone" placeholder="Phone (10 digits)" /><input name="line1" placeholder="Address" />
        <input name="city" placeholder="City" /><input name="state" placeholder="State" /><input name="pincode" placeholder="Pincode" />
        {err.length > 0 && <ul role="alert" className="st out_of_stock">{err.map((m) => <li key={m}>{m}</li>)}</ul>}
        <p>Estimated total: <strong>{formatINR(subtotal + ship)}</strong> ({ship ? `incl. shipping ${formatINR(ship)}` : "free shipping"}). Final amount is confirmed by the server.</p>
        <button className="btn" disabled={busy}>{busy ? "Placing…" : "Place order request"}</button>
      </form>
    </section>
  );
}
