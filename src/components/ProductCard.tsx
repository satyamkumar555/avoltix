"use client";
import Link from "next/link";
import { formatINR, discountPercent } from "@/lib/money";
import { stockStatus } from "@/lib/validations/product";
import { useStore } from "@/lib/store";
import type { DemoProduct } from "@/lib/data/seed";

const label = { in_stock: "In stock", low_stock: "Low stock", out_of_stock: "Out of stock" } as const;

export default function ProductCard({ p }: { p: DemoProduct }) {
  const { addToCart, toggleWish, wish } = useStore();
  const st = stockStatus(p);
  const off = discountPercent(p.mrp, p.price);
  const liked = wish.includes(p.sku);
  return (
    <article className="card">
      <Link href={`/products/${p.slug}`} className="thumb" aria-label={p.name}>{p.thumbnail ? <img src={p.thumbnail} alt={p.name} loading="lazy" /> : <span>{p.sku.split("-")[2]}</span>}{p.isNew && <em className="badge">New</em>}</Link>
      <Link href={`/products/${p.slug}`}><h3>{p.name}</h3></Link>
      <small>{p.sku}</small>
      <strong>{formatINR(p.price)} {off > 0 && <><s className="note">{formatINR(p.mrp)}</s> <span className="off">{off}% off</span></>}</strong>
      <small className={`st ${st}`}>{label[st]}</small>
      <div className="row">
        <button className="btn" disabled={st === "out_of_stock"} onClick={() => addToCart(p.sku)}>Add to cart</button>
        <button className="btn ghost" aria-pressed={liked} aria-label="Wishlist" onClick={() => toggleWish(p.sku)}>{liked ? "♥" : "♡"}</button>
      </div>
    </article>
  );
}
