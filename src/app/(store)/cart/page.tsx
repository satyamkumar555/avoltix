"use client";
import Link from "next/link";
import { formatINR } from "@/lib/money";
import { available, shippingFor, useStore } from "@/lib/store";

export default function Cart() {
  const { cart, products, setQty, removeFromCart, ready } = useStore();
  if (!ready) return <p className="sec note">Loading…</p>;
  const lines = cart.map((l) => ({ l, p: products.find((x) => x.sku === l.id) })).filter((x): x is { l: typeof x.l; p: NonNullable<typeof x.p> } => Boolean(x.p));
  const subtotal = lines.reduce((s, { l, p }) => s + l.qty * p.price, 0);
  const ship = shippingFor(subtotal);
  const bad = lines.some(({ l, p }) => l.qty > available(p));
  if (!lines.length) return <section className="sec"><h2>Your cart is empty</h2><Link className="btn" href="/products">Browse products</Link></section>;
  return (
    <section className="sec"><h2>Cart</h2>
      <table className="tbl"><thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th><th /></tr></thead><tbody>
        {lines.map(({ l, p }) => (
          <tr key={p.sku}><td><Link href={`/products/${p.slug}`}>{p.name}</Link><br /><small className="note">{p.sku}</small>{l.qty > available(p) && <small className="st out_of_stock"> Only {available(p)} available</small>}</td>
            <td>{formatINR(p.price)}</td>
            <td><input type="number" min={1} max={available(p)} value={l.qty} aria-label={`Quantity for ${p.name}`} onChange={(e) => setQty(p.sku, Number(e.target.value) || 1)} /></td>
            <td>{formatINR(l.qty * p.price)}</td><td><button className="btn ghost" onClick={() => removeFromCart(p.sku)}>Remove</button></td></tr>
        ))}
      </tbody></table>
      <div className="sum"><p>Subtotal: {formatINR(subtotal)}</p><p>Shipping: {ship ? formatINR(ship) : "Free"}</p><h3>Estimated total: {formatINR(subtotal + ship)}</h3>
        <p className="note">Final prices and stock are re-checked when you place the order.</p>
        {bad ? <p className="st out_of_stock">Fix quantities above to continue.</p> : <Link className="btn" href="/checkout">Checkout</Link>}</div>
    </section>
  );
}
