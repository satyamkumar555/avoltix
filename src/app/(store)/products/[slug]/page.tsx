"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatINR, discountPercent } from "@/lib/money";
import { stockStatus } from "@/lib/validations/product";
import { available, useStore } from "@/lib/store";
import ProductCard from "@/components/ProductCard";

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { products, categories, addToCart, toggleWish, wish, ready } = useStore();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const p = products.find((x) => x.slug === slug);
  if (!ready) return <p className="sec note">Loading…</p>;
  if (!p || p.status !== "published") return <section className="sec"><h2>Product not found</h2><Link className="btn" href="/products">Back to products</Link></section>;
  const st = stockStatus(p), off = discountPercent(p.mrp, p.price), max = available(p);
  const related = products.filter((x) => x.categoryId === p.categoryId && x.sku !== p.sku && x.status === "published").slice(0, 4);
  return (
    <section className="sec">
      <p className="note"><Link href="/products">Products</Link> / {categories.find((c) => c.id === p.categoryId)?.name}</p>
      <div className="detail">
        <div className="thumb big">{p.thumbnail ? <img src={p.thumbnail} alt={p.name} /> : <span>{p.sku.split("-")[2]}</span>}</div>
        <div className="info">
          <h1>{p.name}</h1>
          <p className="note">SKU {p.sku}{p.mpn ? ` · MPN ${p.mpn}` : ""}{p.brand ? ` · ${p.brand}` : ""}</p>
          <p className="price">{formatINR(p.price)} {off > 0 && <><s className="note">{formatINR(p.mrp)}</s> <span className="off">{off}% off</span></>}</p>
          <p className={`st ${st}`}>{st === "in_stock" ? `In stock (${max} available)` : st === "low_stock" ? `Only ${max} left` : "Out of stock"}</p>
          <p>{p.shortDescription}</p>
          {st !== "out_of_stock" && (
            <div className="row">
              <input type="number" min={p.minOrderQty} max={max} value={qty} aria-label="Quantity" onChange={(e) => setQty(Math.max(p.minOrderQty, Math.min(max, Number(e.target.value) || 1)))} />
              <button className="btn" onClick={() => { addToCart(p.sku, qty); setAdded(true); setTimeout(() => setAdded(false), 1500); }}>{added ? "Added ✓" : "Add to cart"}</button>
              <Link className="btn ghost" href="/cart" onClick={() => addToCart(p.sku, qty)}>Buy now</Link>
            </div>
          )}
          <div className="row">
            <button className="btn ghost" onClick={() => toggleWish(p.sku)}>{wish.includes(p.sku) ? "♥ In wishlist" : "♡ Add to wishlist"}</button>
            <Link className="btn ghost" href={`/request?item=${encodeURIComponent(`${p.name} (${p.sku})`)}`}>Ask about this</Link>
          </div>
          {p.specs && <table className="tbl"><tbody>{Object.entries(p.specs).map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody></table>}
          <p className="note">Warranty, shipping and return details follow the store policies in the footer.</p>
        </div>
      </div>
      {related.length > 0 && <><h2>Related products</h2><div className="grid">{related.map((x) => <ProductCard key={x.sku} p={x} />)}</div></>}
    </section>
  );
}
