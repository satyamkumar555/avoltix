import Link from "next/link";

const tabs = [["Home", "/"], ["Categories", "/categories"], ["Search", "/products"], ["Wishlist", "/wishlist"], ["Account", "/orders"]] as const;
export default function MobileNav() {
  return <nav className="mnav" aria-label="Mobile">{tabs.map(([t, h]) => <Link key={h} href={h}>{t}</Link>)}</nav>;
}
