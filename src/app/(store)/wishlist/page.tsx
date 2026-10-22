"use client";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { useStore } from "@/lib/store";

export default function Wishlist() {
  const { wish, products, ready } = useStore();
  if (!ready) return <p className="sec note">Loading…</p>;
  const items = wish.map((id) => products.find((p) => p.sku === id)).filter((p) => p !== undefined);
  return (
    <section className="sec"><h2>Wishlist</h2>
      {items.length ? <div className="grid">{items.map((p) => <ProductCard key={p.sku} p={p} />)}</div> : <><p className="note">Nothing saved yet.</p><Link className="btn" href="/products">Browse products</Link></>}
    </section>
  );
}
