"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { descendantIds, flatten } from "@/lib/categories";
import { available, useStore } from "@/lib/store";

function List() {
  const sp = useSearchParams();
  const router = useRouter();
  const { products, categories, ready } = useStore();
  const pub = categories.filter((c) => c.published);
  const q = (sp.get("q") ?? "").toLowerCase().trim();
  const cat = sp.get("cat") ?? "";
  const sort = sp.get("sort") ?? "new";
  const inStock = sp.get("stock") === "1";
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp.toString()); if (v) n.set(k, v); else n.delete(k); router.replace(`/products?${n.toString()}`); };

  let list = products.filter((p) => p.status === "published");
  if (cat) { const ids = descendantIds(pub, cat); list = list.filter((p) => ids.includes(p.categoryId)); }
  if (inStock) list = list.filter((p) => available(p) > 0);
  if (q) list = list.filter((p) => [p.name, p.sku, p.mpn ?? "", p.brand ?? "", p.shortDescription].join(" ").toLowerCase().includes(q));
  if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
  if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);

  if (!ready) return <p className="sec note">Loading…</p>;
  return (
    <section className="sec">
      <h2>Products {q && <span className="note">for “{q}”</span>}</h2>
      <div className="filters">
        <select aria-label="Category" value={cat} onChange={(e) => set("cat", e.target.value)}><option value="">All categories</option>{flatten(pub).map(({ c, depth }) => <option key={c.id} value={c.id}>{"— ".repeat(depth)}{c.name}</option>)}</select>
        <select aria-label="Sort" value={sort} onChange={(e) => set("sort", e.target.value)}><option value="new">Newest</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select>
        <label><input type="checkbox" checked={inStock} onChange={(e) => set("stock", e.target.checked ? "1" : "")} /> In stock only</label>
        <span className="note">{list.length} result{list.length === 1 ? "" : "s"}</span>
      </div>
      {list.length ? <div className="grid">{list.map((p) => <ProductCard key={p.sku} p={p} />)}</div> : <p className="note">No products match. Clear a filter or try another search.</p>}
    </section>
  );
}
export default function Products() { return <Suspense fallback={<p className="sec note">Loading…</p>}><List /></Suspense>; }
