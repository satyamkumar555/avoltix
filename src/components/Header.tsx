"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AvoltixLogo from "./AvoltixLogo";
import { brand } from "@/lib/config/brand";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";

export default function Header() {
  const router = useRouter();
  const { cart, wish } = useStore();
  const { user } = useAuth();
  const count = cart.reduce((s, l) => s + l.qty, 0);
  return (
    <header className="hdr"><div className="hin">
      <Link href="/" aria-label={`${brand.name} home`}><AvoltixLogo size={30} /></Link>
      <nav aria-label="Main" className="dnav">
        <Link href="/">Home</Link><Link href="/categories">Categories</Link><Link href="/products">Products</Link><Link href="/request">Request components</Link>
      </nav>
      <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); const q = String(new FormData(e.currentTarget).get("q") ?? ""); router.push(`/products?q=${encodeURIComponent(q)}`); }}>
        <input name="q" placeholder="Search name, SKU, brand" aria-label="Search products" />
      </form>
      <div className="icons">
        <Link href="/wishlist" aria-label="Wishlist">♡ <b>{wish.length}</b></Link>
        <Link href="/cart" aria-label="Cart">Cart <b>{count}</b></Link>
        <Link href={user ? "/orders" : "/login"} className="btn small">{user ? "Account" : "Sign in"}</Link>
      </div>
    </div></header>
  );
}
