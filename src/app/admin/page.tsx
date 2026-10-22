"use client";
import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { friendly, useAuth } from "@/lib/auth";
import { useStore, type Banner } from "@/lib/store";
import { firebaseReady, storage } from "@/lib/firebase/client";
import { formatINR, rupeesToPaise } from "@/lib/money";
import { productSchema, stockStatus } from "@/lib/validations/product";
import type { DemoProduct } from "@/lib/data/seed";
import { descendantIds, flatten, slugify, wouldCycle, type Category } from "@/lib/categories";
import AvoltixLogo from "@/components/AvoltixLogo";

const ORDER = ["Pending", "Confirmed", "Processing", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];
const REQ = ["New", "Contacted", "In Discussion", "Resolved", "Closed"];
type Tab = "products" | "categories" | "homepage" | "orders" | "requests";

const okLink = (s: string) => s === "" || s.startsWith("/") || s.startsWith("https://");
const readFile = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error("Could not read the image.")); r.readAsDataURL(f); });
/** Live: upload to Firebase Storage. Demo: keep a small data URL in this browser. */
async function saveImage(file: File, folder: string, maxMB: number): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Image must be JPG, PNG or WebP.");
  if (file.size > (firebaseReady ? maxMB * 1048576 : 400 * 1024)) throw new Error(firebaseReady ? `Image must be under ${maxMB} MB.` : "In demo mode images must be under 400 KB.");
  if (!firebaseReady) return readFile(file);
  const rf = ref(storage(), `${folder}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`);
  await uploadBytes(rf, file);
  return getDownloadURL(rf);
}
const Errs = ({ e }: { e: string[] }) => (e.length ? <ul role="alert" className="st out_of_stock">{e.map((m) => <li key={m}>{m}</li>)}</ul> : null);

function Login() {
  const { signIn } = useAuth();
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <div className="alogin"><AvoltixLogo size={34} /><h1>Admin sign in</h1>
      <form className="form" onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.currentTarget); setBusy(true); setMsg(""); try { await signIn(String(f.get("email")), String(f.get("password"))); } catch (x) { setMsg(friendly(x)); } setBusy(false); }}>
        <input name="email" type="email" placeholder="Email" autoComplete="email" /><input name="password" type="password" placeholder="Password" autoComplete="current-password" />
        {msg && <p role="alert" className="st out_of_stock">{msg}</p>}<button className="btn" disabled={busy}>Sign in</button>
      </form></div>
  );
}

/* ---------- Products ---------- */
function ProductForm({ initial, onDone }: { initial: DemoProduct | null; onDone: () => void }) {
  const s = useStore(); const flat = flatten(s.categories);
  const [err, setErr] = useState<string[]>([]); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const fd = new FormData(e.currentTarget); const f = Object.fromEntries(fd) as Record<string, string>;
    const name = (f.name ?? "").trim(); const sku = initial ? initial.sku : (f.sku ?? "").trim().toUpperCase();
    let slug = initial?.slug ?? slugify(name); if (!initial && s.products.some((p) => p.slug === slug)) slug += "-" + slugify(sku);
    const r = productSchema.safeParse({ sku, name, slug, shortDescription: f.desc ?? "", categoryId: f.cat ?? "", brand: f.brand || undefined, mpn: f.mpn || undefined, price: rupeesToPaise(Number(f.price)), mrp: rupeesToPaise(Number(f.mrp)), stock: Number(f.stock), minOrderQty: initial?.minOrderQty ?? 1, lowStockThreshold: initial?.lowStockThreshold ?? 5, status: f.status });
    if (!r.success) { setErr(r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)); return; }
    if (!initial && s.products.some((p) => p.sku === sku)) { setErr(["This SKU already exists."]); return; }
    setBusy(true); setErr([]);
    try {
      const file = fd.get("image"); let thumbnail = initial?.thumbnail;
      if (file instanceof File && file.size > 0) thumbnail = await saveImage(file, `products/${sku}`, 2);
      await s.upsertProduct({ ...initial, ...r.data, reserved: initial?.reserved ?? 0, thumbnail, featured: f.featured === "on", isNew: f.isNew === "on" });
      onDone();
    } catch (x) { setErr([(x as Error).message]); }
    setBusy(false);
  }
  return (
    <form className="form inline boxed" onSubmit={submit}>
      <h3 className="full">{initial ? `Edit ${initial.sku}` : "Add product"}</h3>
      <input name="name" placeholder="Product name" defaultValue={initial?.name} />
      <input name="sku" placeholder="SKU e.g. AVX-SEN-IRS-0001" defaultValue={initial?.sku} readOnly={!!initial} title={initial ? "SKU cannot be changed" : ""} />
      <input name="brand" placeholder="Brand" defaultValue={initial?.brand} /><input name="mpn" placeholder="MPN" defaultValue={initial?.mpn} />
      <select name="cat" aria-label="Category" defaultValue={initial?.categoryId ?? flat[0]?.c.id}>{flat.map(({ c, depth }) => <option key={c.id} value={c.id}>{"— ".repeat(depth)}{c.name}</option>)}</select>
      <input name="price" type="number" step="0.01" placeholder="Price (Rs)" defaultValue={initial ? initial.price / 100 : ""} />
      <input name="mrp" type="number" step="0.01" placeholder="MRP (Rs)" defaultValue={initial ? initial.mrp / 100 : ""} />
      <input name="stock" type="number" min={0} placeholder="Stock" defaultValue={initial?.stock} />
      <input name="desc" placeholder="Short description" defaultValue={initial?.shortDescription} className="wide" />
      <select name="status" aria-label="Status" defaultValue={initial?.status ?? "published"}><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
      <label><input type="checkbox" name="featured" defaultChecked={initial?.featured} /> Featured</label><label><input type="checkbox" name="isNew" defaultChecked={initial?.isNew} /> New</label>
      <label className="file">Image {initial?.thumbnail && "(choose to replace)"} <input name="image" type="file" accept="image/jpeg,image/png,image/webp" /></label>
      <div className="full row"><button className="btn" disabled={busy}>{busy ? "Saving…" : initial ? "Save changes" : "Add product"}</button><button type="button" className="btn ghost" onClick={onDone}>Cancel</button></div>
      <div className="full"><Errs e={err} /></div>
    </form>
  );
}

function Products() {
  const s = useStore(); const flat = flatten(s.categories);
  const [open, setOpen] = useState(false); const [editing, setEditing] = useState<DemoProduct | null>(null); const [err, setErr] = useState("");
  const close = () => { setOpen(false); setEditing(null); };
  const run = async (fn: () => Promise<void>) => { try { setErr(""); await fn(); } catch (e) { setErr((e as Error).message); } };
  return (<>
    {!open && <button className="btn" onClick={() => setOpen(true)}>+ Add product</button>}
    {open && <ProductForm key={editing?.sku ?? "new"} initial={editing} onDone={close} />}
    {err && <p role="alert" className="st out_of_stock">{err}</p>}
    <div className="scroll"><table className="tbl"><thead><tr><th>SKU</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {s.products.map((p) => (<tr key={p.sku}><td>{p.sku}</td><td>{p.name}</td><td>{flat.find((x) => x.c.id === p.categoryId)?.c.name ?? "—"}</td><td>{formatINR(p.price)}</td>
        <td><input type="number" min={0} defaultValue={p.stock} key={`${p.sku}-${p.stock}`} aria-label={`Stock ${p.sku}`} onBlur={(e) => { const n = Number(e.target.value); if (n !== p.stock) void run(() => s.setStock(p.sku, n)); }} /></td>
        <td>{p.status} <small className={`st ${stockStatus(p)}`}>· {stockStatus(p).replace(/_/g, " ")}</small></td>
        <td className="acts"><button className="btn ghost small" onClick={() => { setEditing(p); setOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>
          <button className="btn danger small" onClick={() => { if (window.confirm(`Permanently delete "${p.name}" (${p.sku})? This cannot be undone.`)) void run(() => s.deleteProduct(p.sku)); }}>Delete</button></td></tr>))}
    </tbody></table></div>
    {!s.products.length && <p className="note">No products yet.</p>}
  </>);
}

/* ---------- Categories ---------- */
function CategoryForm({ initial, onDone }: { initial: Category | null; onDone: () => void }) {
  const s = useStore(); const [err, setErr] = useState<string[]>([]); const [busy, setBusy] = useState(false);
  const blocked = initial ? descendantIds(s.categories, initial.id) : [];
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const fd = new FormData(e.currentTarget); const f = Object.fromEntries(fd) as Record<string, string>;
    const name = (f.name ?? "").trim(); const id = initial?.id ?? slugify(name);
    if (name.length < 2 || !id) { setErr(["Enter a category name."]); return; }
    if (!initial && s.categories.some((c) => c.id === id)) { setErr(["A category with this name already exists."]); return; }
    const parentId = f.parent || null;
    if (initial && (parentId === initial.id || wouldCycle(s.categories, initial.id, parentId))) { setErr(["A category cannot be placed inside itself."]); return; }
    setBusy(true); setErr([]);
    try {
      const file = fd.get("image"); let imageUrl = initial?.imageUrl;
      if (file instanceof File && file.size > 0) imageUrl = await saveImage(file, "categories", 2);
      await s.upsertCategory({ id, name, description: f.desc ?? "", parentId, order: Number(f.order) || 0, published: f.published === "on", imageUrl }); onDone();
    }
    catch (x) { setErr([(x as Error).message]); }
    setBusy(false);
  }
  return (
    <form className="form inline boxed" onSubmit={submit}>
      <h3 className="full">{initial ? `Edit ${initial.name}` : "Add category"}</h3>
      <input name="name" placeholder="Category name" defaultValue={initial?.name} /><input name="desc" placeholder="Description" defaultValue={initial?.description} />
      <select name="parent" aria-label="Parent category" defaultValue={initial?.parentId ?? ""}><option value="">No parent (top level)</option>
        {flatten(s.categories).filter((x) => !blocked.includes(x.c.id)).map(({ c, depth }) => <option key={c.id} value={c.id}>{"— ".repeat(depth)}{c.name}</option>)}</select>
      <input name="order" type="number" placeholder="Order" defaultValue={initial?.order ?? 0} />
      <label><input type="checkbox" name="published" defaultChecked={initial?.published ?? true} /> Published</label>
      <label className="file">Category image {initial?.imageUrl && "(choose to replace)"} <input name="image" type="file" accept="image/jpeg,image/png,image/webp" /></label>
      <div className="full row"><button className="btn" disabled={busy}>{busy ? "Saving…" : initial ? "Save changes" : "Add category"}</button><button type="button" className="btn ghost" onClick={onDone}>Cancel</button></div>
      <div className="full"><Errs e={err} /></div>
    </form>
  );
}

function Categories() {
  const s = useStore(); const flat = flatten(s.categories);
  const [open, setOpen] = useState(false); const [editing, setEditing] = useState<Category | null>(null); const [err, setErr] = useState("");
  const close = () => { setOpen(false); setEditing(null); };
  const run = async (fn: () => Promise<void>) => { try { setErr(""); await fn(); } catch (e) { setErr((e as Error).message); } };
  const count = (id: string) => { const ids = descendantIds(s.categories, id); return s.products.filter((p) => ids.includes(p.categoryId)).length; };
  return (<>
    {!open && <button className="btn" onClick={() => setOpen(true)}>+ Add category</button>}
    {open && <CategoryForm key={editing?.id ?? "new"} initial={editing} onDone={close} />}
    {err && <p role="alert" className="st out_of_stock">{err}</p>}
    <div className="scroll"><table className="tbl"><thead><tr><th>Category</th><th>Parent</th><th>Order</th><th>Products</th><th>Published</th><th>Actions</th></tr></thead><tbody>
      {flat.map(({ c, depth }) => (<tr key={c.id}><td style={{ paddingLeft: 10 + depth * 22 }}>{depth > 0 && "↳ "}{c.imageUrl && <img className="mini" src={c.imageUrl} alt="" />}{c.name}</td><td>{s.categories.find((x) => x.id === c.parentId)?.name ?? "—"}</td><td>{c.order}</td><td>{count(c.id)}</td>
        <td><input type="checkbox" checked={c.published} aria-label={`Published ${c.name}`} onChange={(e) => void run(() => s.upsertCategory({ ...c, published: e.target.checked }))} /></td>
        <td className="acts"><button className="btn ghost small" onClick={() => { setEditing(c); setOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>
          <button className="btn danger small" onClick={() => { if (window.confirm(`Permanently delete category "${c.name}"? This cannot be undone.`)) void run(() => s.deleteCategory(c.id)); }}>Delete</button></td></tr>))}
    </tbody></table></div>
    {!s.categories.length && <p className="note">No categories yet.</p>}
  </>);
}

/* ---------- Homepage posters and announcement ---------- */
function BannerForm({ initial, onDone }: { initial: Banner | null; onDone: () => void }) {
  const s = useStore(); const [err, setErr] = useState<string[]>([]); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const fd = new FormData(e.currentTarget); const f = Object.fromEntries(fd) as Record<string, string>;
    const title = (f.title ?? "").trim(), link = (f.link ?? "").trim(); const file = fd.get("image");
    const hasFile = file instanceof File && file.size > 0;
    if (title.length < 2) { setErr(["Enter a title (used as the image description)."]); return; }
    if (!okLink(link)) { setErr(["Link must start with / (page on this site) or https://"]); return; }
    if (!initial && !hasFile) { setErr(["Choose a poster image."]); return; }
    setBusy(true); setErr([]);
    try {
      const imageUrl = hasFile ? await saveImage(file, "banners", 3) : initial!.imageUrl;
      await s.upsertBanner({ id: initial?.id ?? `b${Date.now()}`, title, imageUrl, link, order: Number(f.order) || 0, active: f.active === "on" });
      onDone();
    } catch (x) { setErr([(x as Error).message]); }
    setBusy(false);
  }
  return (
    <form className="form inline boxed" onSubmit={submit}>
      <h3 className="full">{initial ? `Edit poster: ${initial.title}` : "Add new poster"}</h3>
      {initial && <p className="note full">You are editing this one poster only. To add another poster, cancel and use “+ Add new poster”.</p>}
      <input name="title" placeholder="Title (image description)" defaultValue={initial?.title} />
      <input name="link" placeholder="Click link (optional): /products or https://…" defaultValue={initial?.link} className="wide" />
      <input name="order" type="number" placeholder="Order" defaultValue={initial?.order ?? Math.max(0, ...s.banners.map((b) => b.order)) + 1} />
      <label><input type="checkbox" name="active" defaultChecked={initial?.active ?? true} /> Show on homepage</label>
      <label className="file">Poster image (wide, about 1600×600) {initial && "(choose to replace)"} <input name="image" type="file" accept="image/jpeg,image/png,image/webp" /></label>
      <div className="full row"><button className="btn" disabled={busy}>{busy ? "Saving…" : "Save poster"}</button><button type="button" className="btn ghost" onClick={onDone}>Cancel</button></div>
      <div className="full"><Errs e={err} /></div>
    </form>
  );
}

function Homepage() {
  const s = useStore(); const a = s.announcement; const h = s.settings;
  const [open, setOpen] = useState(false); const [editing, setEditing] = useState<Banner | null>(null);
  const [err, setErr] = useState<string[]>([]); const [saved, setSaved] = useState("");
  const close = () => { setOpen(false); setEditing(null); };
  const sorted = [...s.banners].sort((x, y) => x.order - y.order);
  const flash = (k: string) => { setSaved(k); setTimeout(() => setSaved(""), 2000); };
  const fail = (e: unknown) => setErr([(e as Error).message]);
  const move = (id: string, to: number) => {
    const ids = sorted.map((b) => b.id); const from = ids.indexOf(id);
    if (from < 0 || to < 0 || to >= ids.length || to === from) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]!); setErr([]); void s.reorderBanners(ids).catch(fail);
  };
  return (<>
    <h3>Posters (homepage slider)</h3>
    <p className="note">Posters slide automatically every 5 seconds; visitors can swipe, use the arrows or the dots. Leave the link empty if a poster should not be clickable. Use the position controls to reorder.</p>
    {!open && <button className="btn" onClick={() => { setEditing(null); setOpen(true); }}>+ Add new poster</button>}
    {open && <BannerForm key={editing?.id ?? "new"} initial={editing} onDone={close} />}
    <div className="grid bn">{sorted.map((b, idx) => (
      <article key={b.id} className="card"><img src={b.imageUrl} alt={b.title} className="bnimg" />
        <strong>{idx + 1}. {b.title}</strong><small className="note">{b.link ? `Clickable → ${b.link}` : "Not clickable"}</small>
        <div className="pos">
          <button className="btn ghost small" disabled={idx === 0} onClick={() => move(b.id, idx - 1)}>← Earlier</button>
          <button className="btn ghost small" disabled={idx === sorted.length - 1} onClick={() => move(b.id, idx + 1)}>Later →</button>
          <select value={idx} onChange={(e) => move(b.id, Number(e.target.value))} aria-label={`Position of ${b.title}`}>{sorted.map((_, k) => <option key={k} value={k}>Position {k + 1}</option>)}</select>
        </div>
        <div className="row"><label><input type="checkbox" checked={b.active} onChange={(e) => void s.upsertBanner({ ...b, active: e.target.checked }).catch(fail)} /> Visible</label>
          <button className="btn ghost small" onClick={() => { setEditing(b); setOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>
          <button className="btn danger small" onClick={() => { if (window.confirm(`Permanently delete poster "${b.title}"?`)) void s.deleteBanner(b.id).catch(fail); }}>Delete</button></div></article>
    ))}</div>
    {!sorted.length && <p className="note">No posters yet. The homepage shows the default Avoltix.in banner until you add one.</p>}

    <h3 className="cap">Homepage layout</h3>
    <form key={`${h.categoryColumns}-${h.productColumns}`} className="form inline boxed" onSubmit={async (e) => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
      try { setErr([]); await s.setHomeSettings({ categoryColumns: Number(f.cc), productColumns: Number(f.pc) }); flash("layout"); } catch (x) { fail(x); }
    }}>
      <label>Categories per row (Categories page) <select name="cc" defaultValue={h.categoryColumns}>{[2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}</select></label>
      <label>Products per row <select name="pc" defaultValue={h.productColumns}>{[2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></label>
      <button className="btn">{saved === "layout" ? "Saved ✓" : "Save layout"}</button>
      <p className="note full">Category cards (image, name, description) appear on the Categories page from the menu, not on the homepage. Phones always show 2 per row.</p>
    </form>

    <h3 className="cap">Announcement bar</h3>
    <form key={a?.text ?? "none"} className="form inline boxed" onSubmit={async (e) => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>; const link = (f.link ?? "").trim();
      if (!okLink(link)) { setErr(["Link must start with / or https://"]); return; }
      try { setErr([]); await s.setAnnouncement({ text: (f.text ?? "").trim().slice(0, 200), link, enabled: f.enabled === "on" }); flash("ann"); } catch (x) { fail(x); }
    }}>
      <input name="text" placeholder="Notice text, e.g. Diwali sale: 10% off sensors" defaultValue={a?.text} className="wide" maxLength={200} />
      <input name="link" placeholder="Click link (optional)" defaultValue={a?.link} className="wide" />
      <label><input type="checkbox" name="enabled" defaultChecked={a?.enabled ?? true} /> Show on site</label>
      <button className="btn">{saved === "ann" ? "Saved ✓" : "Save announcement"}</button>
    </form>
    <Errs e={err} />
  </>);
}

/* ---------- Panel ---------- */
function Panel() {
  const s = useStore(); const { user, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("products");
  const n = (st: string) => s.products.filter((p) => stockStatus(p) === st).length;
  return (<div className="apanel">
    <aside className="side"><AvoltixLogo size={24} />
      {(["products", "categories", "homepage", "orders", "requests"] as Tab[]).map((t) => <button key={t} aria-current={tab === t} onClick={() => setTab(t)}>{t}</button>)}
      <div className="grow" />{user ? <><small className="note">{user.email}</small><button onClick={() => void signOut()}>Sign out</button></> : <small className="st low_stock">Demo mode: no login. Data stays in this browser.</small>}
    </aside>
    <div className="amain"><h1>Dashboard</h1>
      {s.error && <p role="alert" className="st out_of_stock">{s.error}</p>}
      <div className="grid stats">
        <div className="card"><small>Products</small><h3>{s.products.length}</h3></div><div className="card"><small>Low stock</small><h3>{n("low_stock")}</h3></div>
        <div className="card"><small>Out of stock</small><h3>{n("out_of_stock")}</h3></div><div className="card"><small>Pending orders (unpaid)</small><h3>{s.orders.filter((o) => o.status === "Pending").length}</h3></div>
        <div className="card"><small>New requests</small><h3>{s.inquiries.filter((q) => q.status === "New").length}</h3></div>
      </div>
      <h2 className="cap">{tab}</h2>
      {tab === "products" && <Products />}{tab === "categories" && <Categories />}{tab === "homepage" && <Homepage />}
      {tab === "orders" && (s.orders.length ? s.orders.map((o) => (<article key={o.id} className="card"><h3>{o.number} · {formatINR(o.total)}</h3>
        <p className="note">{o.address.name}, {o.address.phone}, {o.address.line1}, {o.address.city} {o.address.pincode} · payment {o.paymentStatus}</p>
        <ul>{o.lines.map((l) => <li key={l.sku}>{l.qty} × {l.name} ({l.sku})</li>)}</ul>
        <select value={o.status} aria-label="Order status" onChange={(e) => void s.setOrderStatus(o.id, e.target.value)}>{ORDER.map((x) => <option key={x}>{x}</option>)}</select></article>)) : <p className="note">No orders yet.</p>)}
      {tab === "requests" && (s.inquiries.length ? s.inquiries.map((q) => (<article key={q.id} className="card"><h3>{q.name} · {q.institution || "—"}</h3>
        <p className="note">{q.email} · {q.phone} · prefers {q.contactMethod} · {q.createdAt ? new Date(q.createdAt).toLocaleString("en-IN") : ""}</p>
        <ul>{q.items.map((it, i) => <li key={i}>{it.qty} × {it.name}{it.note ? ` (${it.note})` : ""}</li>)}</ul>{q.message && <p>{q.message}</p>}
        <div className="row"><a className="btn ghost small" href={`tel:${q.phone}`}>Call</a><a className="btn ghost small" href={`https://wa.me/91${q.phone}`} target="_blank" rel="noopener noreferrer">WhatsApp</a><a className="btn ghost small" href={`mailto:${q.email}`}>Email</a>
          <select value={q.status} aria-label="Request status" onChange={(e) => void s.setInquiryStatus(q.id, e.target.value)}>{REQ.map((x) => <option key={x}>{x}</option>)}</select></div></article>)) : <p className="note">No component requests yet.</p>)}
    </div></div>);
}

export default function AdminPage() {
  const { user, isAdmin, loading, signOut } = useAuth();
  if (firebaseReady) {
    if (loading) return <p className="note" style={{ padding: 40 }}>Loading…</p>;
    if (!user) return <Login />;
    if (!isAdmin) return <div className="alogin"><h1>Not authorised</h1><p className="note">{user.email} does not have admin access.</p><button className="btn ghost" onClick={() => void signOut()}>Sign out</button></div>;
  }
  return <Panel />;
}
