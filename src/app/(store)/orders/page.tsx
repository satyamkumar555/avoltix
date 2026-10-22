"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatINR } from "@/lib/money";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { firebaseReady } from "@/lib/firebase/client";

function Orders() {
  const { orders: all, inquiries, ready } = useStore();
  const { user, loading, signOut } = useAuth();
  const orders = firebaseReady ? all.filter((o) => o.customerId === user?.uid) : all;
  const placed = useSearchParams().get("placed");
  const requests = firebaseReady ? inquiries.filter((q) => q.uid === user?.uid) : inquiries;
  if (loading || !ready) return <p className="sec note">Loading…</p>;
  if (firebaseReady && !user) return <section className="sec"><h2>My orders</h2><p className="note">Sign in to see your orders.</p><Link className="btn" href="/login">Sign in</Link></section>;
  return (
    <section className="sec"><div className="row spread"><h2>My orders</h2>{user && <button className="btn ghost" onClick={() => void signOut()}>Sign out</button>}</div>
      {placed && <p className="st in_stock" role="status">Order request {placed} received. No payment has been taken.</p>}
      {!orders.length && <><p className="note">No orders yet.</p><Link className="btn" href="/products">Start shopping</Link></>}
      {orders.map((o) => (
        <article key={o.id} className="card"><h3>{o.number}</h3>
          <p className="note">{new Date(o.createdAt).toLocaleString("en-IN")} · Status: <strong>{o.status}</strong> · Payment: {o.paymentStatus}</p>
          <ul>{o.lines.map((l) => <li key={l.id}>{l.qty} × {l.name} ({l.sku}) — {formatINR(l.qty * l.unit)}</li>)}</ul>
          <p>Shipping {o.shipping ? formatINR(o.shipping) : "free"} · <strong>Total {formatINR(o.total)}</strong></p>
          <p className="note">Ship to: {o.address.name}, {o.address.line1}, {o.address.city}, {o.address.state} {o.address.pincode}</p></article>
      ))}
      <h2 className="cap">My component requests</h2>
      {requests.length === 0 && <p className="note">No requests yet. <Link href="/request">Send your component list</Link>.</p>}
      {requests.map((q) => (
        <article key={q.id} className="card"><h3>{new Date(q.createdAt || Date.now()).toLocaleDateString("en-IN")} · Status: <strong>{q.status}</strong></h3>
          <ul>{q.items.map((it, i) => <li key={i}>{it.qty} × {it.name}{it.note ? ` (${it.note})` : ""}</li>)}</ul></article>
      ))}
    </section>
  );
}
export default function Page() { return <Suspense fallback={<p className="sec note">Loading…</p>}><Orders /></Suspense>; }
