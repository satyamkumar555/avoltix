"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where, writeBatch, type DocumentData, type Unsubscribe } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { deleteObject, ref } from "firebase/storage";
import { db, fns, storage, firebaseReady as live } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth";
import { CATEGORIES, SEED_PRODUCTS, type DemoProduct } from "@/lib/data/seed";
import type { Category } from "@/lib/categories";
import { brand } from "@/lib/config/brand";

export type Address = { name: string; phone: string; line1: string; city: string; state: string; pincode: string };
export type OrderLine = { id: string; sku: string; name: string; qty: number; unit: number };
export type Order = { id: string; number: string; customerId?: string; createdAt: string; lines: OrderLine[]; address: Address; subtotal: number; shipping: number; total: number; status: string; paymentStatus: "unpaid" };
export type RequestItem = { name: string; qty: number; note?: string };
/** A customer's component list request ("inquiry" in the database). */
export type Inquiry = { id: string; createdAt: string; uid?: string; name: string; email: string; phone: string; institution: string; contactMethod: string; items: RequestItem[]; message: string; status: string };
export type Banner = { id: string; title: string; imageUrl: string; link: string; order: number; active: boolean };
export type Announcement = { text: string; link: string; enabled: boolean };
/** Homepage layout, controlled from the admin panel. */
export type HomeSettings = { categoryColumns: number; productColumns: number };
export const DEFAULT_HOME: HomeSettings = { categoryColumns: 4, productColumns: 4 };
const clampInt = (v: unknown, lo: number, hi: number, d: number) => { const n = Number(v); return Number.isInteger(n) && n >= lo && n <= hi ? n : d; };
type Data = { products: DemoProduct[]; categories: Category[]; cart: { id: string; qty: number }[]; wish: string[]; orders: Order[]; inquiries: Inquiry[]; banners: Banner[]; announcement: Announcement | null; settings: HomeSettings };

const KEY = "avoltix_v2";
const initial: Data = { products: live ? [] : SEED_PRODUCTS, categories: live ? [] : CATEGORIES, cart: [], wish: [], orders: [], inquiries: [], banners: [], announcement: null, settings: DEFAULT_HOME };
export const available = (p: DemoProduct) => Math.max(0, p.stock - p.reserved);
/** Display estimate only. The Cloud Function recomputes the real shipping and total. */
export const shippingFor = (subtotal: number) => (subtotal === 0 || subtotal >= 99900 ? 0 : 6000);
const iso = (v: unknown): string => (v && typeof v === "object" && "toDate" in v ? (v as { toDate: () => Date }).toDate().toISOString() : typeof v === "string" ? v : "");
const clean = <T,>(o: T): T => JSON.parse(JSON.stringify(o)) as T;
const toOrder = (id: string, x: DocumentData): Order => ({ id, number: x.number, customerId: x.customerId, createdAt: iso(x.createdAt), lines: x.lines ?? [], address: x.address, subtotal: x.subtotal, shipping: x.shipping, total: x.total, status: x.status, paymentStatus: "unpaid" });

const toInq = (id: string, x: DocumentData): Inquiry => ({ id, uid: x.uid, createdAt: iso(x.createdAt), name: x.name, email: x.email, phone: x.phone, institution: x.institution ?? "", contactMethod: x.contactMethod ?? "", items: x.items ?? [], message: x.message ?? "", status: x.status });
/** Best-effort removal of an uploaded image when its product or banner is deleted. */
async function dropFile(url?: string) { if (live && url?.startsWith("https://")) { try { await deleteObject(ref(storage(), url)); } catch { /* ignore */ } } }

type Ctx = Data & {
  ready: boolean; error: string;
  addToCart: (id: string, qty?: number) => void; setQty: (id: string, qty: number) => void; removeFromCart: (id: string) => void; toggleWish: (id: string) => void;
  placeOrder: (a: Address, requestId: string) => Promise<{ number: string } | string>;
  addInquiry: (i: Omit<Inquiry, "id" | "createdAt" | "status" | "uid">) => Promise<void>;
  upsertProduct: (p: DemoProduct) => Promise<void>; setStock: (sku: string, n: number) => Promise<void>;
  upsertCategory: (c: Category) => Promise<void>;
  deleteProduct: (sku: string) => Promise<void>; deleteCategory: (id: string) => Promise<void>;
  reorderBanners: (ids: string[]) => Promise<void>; setHomeSettings: (h: HomeSettings) => Promise<void>;
  upsertBanner: (b: Banner) => Promise<void>; deleteBanner: (id: string) => Promise<void>; setAnnouncement: (a: Announcement) => Promise<void>;
  setOrderStatus: (id: string, s: string) => Promise<void>; setInquiryStatus: (id: string, s: string) => Promise<void>;
};
const C = createContext<Ctx | null>(null);
export const useStore = () => { const c = useContext(C); if (!c) throw new Error("StoreProvider missing"); return c; };

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const [data, setData] = useState<Data>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [loaded, setLoaded] = useState(!live);
  const [error, setError] = useState("");

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) { const s = JSON.parse(raw) as Partial<Data>; setData((d) => (live ? { ...d, cart: s.cart ?? [], wish: s.wish ?? [] } : { ...d, ...s })); } } catch { /* ignore */ }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(KEY, JSON.stringify(live ? { cart: data.cart, wish: data.wish } : data)); } catch { /* ignore */ }
  }, [data, hydrated]);

  useEffect(() => {
    if (!live || loading) return;
    const subs: Unsubscribe[] = [];
    const err = (e: Error) => setError(e.message);
    const d = db();
    subs.push(onSnapshot(isAdmin ? collection(d, "products") : query(collection(d, "products"), where("status", "==", "published")),
      (s) => { setData((x) => ({ ...x, products: s.docs.map((r) => r.data() as DemoProduct) })); setLoaded(true); }, err));
    subs.push(onSnapshot(isAdmin ? collection(d, "categories") : query(collection(d, "categories"), where("published", "==", true)),
      (s) => setData((x) => ({ ...x, categories: s.docs.map((r) => ({ ...(r.data() as Omit<Category, "id">), id: r.id })) })), err));
    if (user) {
      const oq = isAdmin ? query(collection(d, "orders"), orderBy("createdAt", "desc")) : query(collection(d, "orders"), where("customerId", "==", user.uid), orderBy("createdAt", "desc"));
      subs.push(onSnapshot(oq, (s) => setData((x) => ({ ...x, orders: s.docs.map((r) => toOrder(r.id, r.data())) })), err));
    } else setData((x) => ({ ...x, orders: [] }));
    const iq = isAdmin ? query(collection(d, "inquiries"), orderBy("createdAt", "desc")) : user ? query(collection(d, "inquiries"), where("uid", "==", user.uid), orderBy("createdAt", "desc")) : null;
    if (iq) subs.push(onSnapshot(iq, (s) => setData((x) => ({ ...x, inquiries: s.docs.map((r) => toInq(r.id, r.data())) })), err)); else setData((x) => ({ ...x, inquiries: [] }));
    subs.push(onSnapshot(isAdmin ? collection(d, "banners") : query(collection(d, "banners"), where("active", "==", true)),
      (s) => setData((x) => ({ ...x, banners: s.docs.map((r) => ({ ...(r.data() as Omit<Banner, "id">), id: r.id })) })), err));
    subs.push(onSnapshot(doc(d, "siteSettings", "announcement"), (s) => setData((x) => ({ ...x, announcement: s.exists() ? (s.data() as Announcement) : null })), err));
    subs.push(onSnapshot(doc(d, "siteSettings", "homepage"), (s) => { const v = s.exists() ? s.data() : {}; setData((x) => ({ ...x, settings: { categoryColumns: clampInt(v.categoryColumns, 2, 6, DEFAULT_HOME.categoryColumns), productColumns: clampInt(v.productColumns, 2, 5, DEFAULT_HOME.productColumns) } })); }, err));
    return () => subs.forEach((u) => u());
  }, [loading, user, isAdmin]);

  const find = (id: string) => data.products.find((x) => x.slug === id || x.sku === id);
  const audit = (action: string, target: string) => { if (live && user) void addDoc(collection(db(), "auditLogs"), { action, target, by: user.uid, email: user.email ?? "", at: serverTimestamp() }).catch(() => undefined); };

  const val: Ctx = {
    ...data, ready: hydrated && loaded, error,
    addToCart: (id, qty = 1) => {
      const p = find(id); if (!p || p.status !== "published" || available(p) <= 0) return;
      setData((d) => {
        const cur = d.cart.find((l) => l.id === p.sku);
        const next = Math.min(available(p), Math.max(p.minOrderQty, (cur?.qty ?? 0) + qty));
        return { ...d, cart: cur ? d.cart.map((l) => (l.id === p.sku ? { ...l, qty: next } : l)) : [...d.cart, { id: p.sku, qty: next }] };
      });
    },
    setQty: (id, qty) => setData((d) => ({ ...d, cart: d.cart.map((l) => (l.id === id ? { ...l, qty: Math.max(1, qty) } : l)) })),
    removeFromCart: (id) => setData((d) => ({ ...d, cart: d.cart.filter((l) => l.id !== id) })),
    toggleWish: (id) => setData((d) => ({ ...d, wish: d.wish.includes(id) ? d.wish.filter((w) => w !== id) : [...d.wish, id] })),

    placeOrder: async (address, requestId) => {
      if (!data.cart.length) return "Your cart is empty.";
      if (live) {
        try {
          const call = httpsCallable<{ requestId: string; lines: { sku: string; qty: number }[]; address: Address }, { id: string; number: string }>(fns(), "placeOrder");
          const res = await call({ requestId, lines: data.cart.map((l) => ({ sku: l.id, qty: l.qty })), address });
          setData((d) => ({ ...d, cart: [] }));
          return { number: res.data.number };
        } catch (e) { return (e as { message?: string }).message ?? "Could not place the order."; }
      }
      const lines: OrderLine[] = [];
      for (const l of data.cart) {
        const p = find(l.id);
        if (!p || p.status !== "published") return `A product in your cart is no longer available (${l.id}).`;
        if (l.qty > available(p)) return `Only ${available(p)} left of ${p.name}. Update your cart.`;
        lines.push({ id: p.sku, sku: p.sku, name: p.name, qty: l.qty, unit: p.price });
      }
      const subtotal = lines.reduce((s, l) => s + l.qty * l.unit, 0), shipping = shippingFor(subtotal);
      const order: Order = { id: `o${Date.now()}`, number: `${brand.orderPrefix}-${new Date().getFullYear()}-${String(data.orders.length + 1).padStart(6, "0")}`, createdAt: new Date().toISOString(), lines, address, subtotal, shipping, total: subtotal + shipping, status: "Pending", paymentStatus: "unpaid" };
      setData((d) => ({ ...d, orders: [order, ...d.orders], cart: [], products: d.products.map((p) => { const l = lines.find((x) => x.sku === p.sku); return l ? { ...p, stock: p.stock - l.qty } : p; }) }));
      return { number: order.number };
    },
    addInquiry: async (i) => {
      if (live) { if (!user) throw new Error("Please sign in first."); await addDoc(collection(db(), "inquiries"), { ...i, uid: user.uid, status: "New", createdAt: serverTimestamp() }); return; }
      setData((d) => ({ ...d, inquiries: [{ ...i, id: `q${Date.now()}`, createdAt: new Date().toISOString(), status: "New" }, ...d.inquiries] }));
    },
    upsertProduct: async (p) => {
      if (live) { await setDoc(doc(db(), "products", p.sku), { ...clean(p), updatedAt: serverTimestamp() }, { merge: true }); audit("product.upsert", p.sku); return; }
      setData((d) => ({ ...d, products: d.products.some((x) => x.sku === p.sku) ? d.products.map((x) => (x.sku === p.sku ? p : x)) : [p, ...d.products] }));
    },
    setStock: async (sku, n) => {
      const v = Math.max(0, Math.floor(n));
      if (live) { await updateDoc(doc(db(), "products", sku), { stock: v, updatedAt: serverTimestamp() }); audit("stock.set", `${sku}=${v}`); return; }
      setData((d) => ({ ...d, products: d.products.map((p) => (p.sku === sku ? { ...p, stock: v } : p)) }));
    },
    upsertCategory: async (c) => {
      if (live) { const { id, ...rest } = c; await setDoc(doc(db(), "categories", id), { ...clean(rest), updatedAt: serverTimestamp() }, { merge: true }); audit("category.upsert", id); return; }
      setData((d) => ({ ...d, categories: d.categories.some((x) => x.id === c.id) ? d.categories.map((x) => (x.id === c.id ? c : x)) : [...d.categories, c] }));
    },
    setOrderStatus: async (id, s) => {
      if (live) { await updateDoc(doc(db(), "orders", id), { status: s, updatedAt: serverTimestamp() }); audit("order.status", `${id}=${s}`); return; }
      setData((d) => ({ ...d, orders: d.orders.map((o) => (o.id === id ? { ...o, status: s } : o)) }));
    },
    setInquiryStatus: async (id, s) => {
      if (live) { await updateDoc(doc(db(), "inquiries", id), { status: s }); return; }
      setData((d) => ({ ...d, inquiries: d.inquiries.map((q) => (q.id === id ? { ...q, status: s } : q)) }));
    },
    deleteProduct: async (sku) => {
      const p = data.products.find((x) => x.sku === sku);
      if (live) { await deleteDoc(doc(db(), "products", sku)); await dropFile(p?.thumbnail); audit("product.delete", sku); }
      setData((d) => ({ ...d, products: d.products.filter((x) => x.sku !== sku), cart: d.cart.filter((l) => l.id !== sku), wish: d.wish.filter((w) => w !== sku) }));
    },
    deleteCategory: async (id) => {
      const kids = data.categories.filter((c) => c.parentId === id).length, prods = data.products.filter((p) => p.categoryId === id).length;
      if (kids || prods) throw new Error(`Cannot delete: it has ${kids} subcategor${kids === 1 ? "y" : "ies"} and ${prods} product${prods === 1 ? "" : "s"}. Move or delete them first.`);
      if (live) { await deleteDoc(doc(db(), "categories", id)); await dropFile(data.categories.find((c) => c.id === id)?.imageUrl); audit("category.delete", id); return; }
      setData((d) => ({ ...d, categories: d.categories.filter((c) => c.id !== id) }));
    },
    upsertBanner: async (b) => {
      if (live) { const { id, ...rest } = b; await setDoc(doc(db(), "banners", id), { ...clean(rest), updatedAt: serverTimestamp() }, { merge: true }); audit("banner.upsert", id); return; }
      setData((d) => ({ ...d, banners: d.banners.some((x) => x.id === b.id) ? d.banners.map((x) => (x.id === b.id ? b : x)) : [...d.banners, b] }));
    },
    deleteBanner: async (id) => {
      const b = data.banners.find((x) => x.id === id);
      if (live) { await deleteDoc(doc(db(), "banners", id)); await dropFile(b?.imageUrl); audit("banner.delete", id); return; }
      setData((d) => ({ ...d, banners: d.banners.filter((x) => x.id !== id) }));
    },
    setAnnouncement: async (a) => {
      if (live) { await setDoc(doc(db(), "siteSettings", "announcement"), clean(a)); audit("announcement.set", a.enabled ? "on" : "off"); return; }
      setData((d) => ({ ...d, announcement: a }));
    },
    reorderBanners: async (ids) => {
      if (live) { const b = writeBatch(db()); ids.forEach((id, i) => b.update(doc(db(), "banners", id), { order: i + 1 })); await b.commit(); audit("banner.reorder", ids.join(",")); return; }
      setData((d) => ({ ...d, banners: d.banners.map((x) => ({ ...x, order: ids.indexOf(x.id) + 1 || x.order })) }));
    },
    setHomeSettings: async (h) => {
      const v = { categoryColumns: clampInt(h.categoryColumns, 2, 6, 4), productColumns: clampInt(h.productColumns, 2, 5, 4) };
      if (live) { await setDoc(doc(db(), "siteSettings", "homepage"), v); audit("homepage.layout", `${v.categoryColumns}/${v.productColumns}`); return; }
      setData((d) => ({ ...d, settings: v }));
    },
  };
  return <C.Provider value={val}>{children}</C.Provider>;
}
