"use client";
import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { firebaseReady } from "@/lib/firebase/client";
import { useStore } from "@/lib/store";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().regex(/^\d{10}$/, "Contact number must be 10 digits"),
  institution: z.string().max(200),
  contactMethod: z.enum(["Call", "WhatsApp", "Email"]),
  message: z.string().max(1000),
  items: z.array(z.object({
    name: z.string().trim().min(2, "Every component needs a name"),
    qty: z.number().int("Quantity must be a whole number").min(1, "Quantity must be at least 1").max(100000),
    note: z.string().max(200).optional(),
  })).min(1, "Add at least one component").max(50, "At most 50 components per request"),
});
type Row = { key: number; name: string; qty: string; note: string };

function Form() {
  const first = useSearchParams().get("item") ?? "";
  const { user, loading } = useAuth();
  const { addInquiry } = useStore();
  const seq = useRef(1);
  const [rows, setRows] = useState<Row[]>([{ key: 0, name: first, qty: "1", note: "" }]);
  const [err, setErr] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const edit = (key: number, patch: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  if (loading) return <p className="sec note">Loading…</p>;
  if (firebaseReady && !user) return (
    <section className="sec narrow"><h1>Request components</h1>
      <p className="note">Sign in or create an account first. We attach your name, email and contact number to the request so we can reach you.</p>
      <Link className="btn" href="/login">Sign in or register</Link></section>
  );
  if (done) return (
    <section className="sec narrow"><h1>Request sent</h1>
      <p className="st in_stock" role="status">Thank you. We will check availability and contact you with the details.</p>
      <div className="row"><Link className="btn" href="/orders">View my requests</Link><Link className="btn ghost" href="/products">Keep browsing</Link></div></section>
  );

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (busy) return;
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const r = schema.safeParse({
      name: f.name, email: f.email, phone: f.phone, institution: f.institution ?? "", contactMethod: f.contactMethod, message: f.message ?? "",
      items: rows.filter((x) => x.name.trim() || x.note.trim()).map((x) => ({ name: x.name, qty: Number(x.qty), note: x.note.trim() || undefined })),
    });
    if (!r.success) { setErr([...new Set(r.error.issues.map((i) => i.message))]); return; }
    setBusy(true); setErr([]);
    try { await addInquiry(r.data); setDone(true); } catch { setErr(["Could not send your request. Please try again."]); }
    setBusy(false);
  }
  return (
    <section className="sec narrow wide"><h1>Request components</h1>
      <p className="note">Can’t find what you need? List every component and quantity. If we don’t have it, we will arrange it and contact you.</p>
      <form className="form" onSubmit={submit}>
        <h3>Your components</h3>
        {rows.map((r, idx) => (
          <div className="reqrow" key={r.key}>
            <input value={r.name} onChange={(e) => edit(r.key, { name: e.target.value })} placeholder={`Component ${idx + 1} (name, part number or link)`} aria-label={`Component ${idx + 1} name`} />
            <input type="number" min={1} value={r.qty} onChange={(e) => edit(r.key, { qty: e.target.value })} aria-label={`Component ${idx + 1} quantity`} className="qty" />
            <input value={r.note} onChange={(e) => edit(r.key, { note: e.target.value })} placeholder="Note (optional)" aria-label={`Component ${idx + 1} note`} />
            {rows.length > 1 && <button type="button" className="btn ghost small" onClick={() => setRows((x) => x.filter((y) => y.key !== r.key))} aria-label={`Remove component ${idx + 1}`}>Remove</button>}
          </div>
        ))}
        <div><button type="button" className="btn ghost" disabled={rows.length >= 50} onClick={() => setRows((x) => [...x, { key: seq.current++, name: "", qty: "1", note: "" }])}>+ Add component</button></div>
        <h3>Your details</h3>
        <input name="name" placeholder="Full name" defaultValue={user?.displayName ?? ""} autoComplete="name" />
        <input name="email" type="email" placeholder="Email" defaultValue={user?.email ?? ""} readOnly={firebaseReady} autoComplete="email" />
        <input name="phone" placeholder="Contact number (10 digits)" autoComplete="tel" inputMode="numeric" />
        <input name="institution" placeholder="College, company or institution (optional)" />
        <select name="contactMethod" aria-label="Preferred contact method" defaultValue="WhatsApp"><option>Call</option><option>WhatsApp</option><option>Email</option></select>
        <textarea name="message" rows={3} placeholder="Anything else? Project, deadline, budget (optional)" />
        {err.length > 0 && <ul role="alert" className="st out_of_stock">{err.map((m) => <li key={m}>{m}</li>)}</ul>}
        <button className="btn" disabled={busy}>{busy ? "Sending…" : "Send request"}</button>
      </form>
    </section>
  );
}
export default function Page() { return <Suspense fallback={<p className="sec note">Loading…</p>}><Form /></Suspense>; }
