"use client";
import Link from "next/link";
import AvoltixLogo from "@/components/AvoltixLogo";
import HeroChip from "@/components/HeroChip";
import HeroSlider from "@/components/HeroSlider";
import ProductCard from "@/components/ProductCard";
import { brand } from "@/lib/config/brand";
import { useStore } from "@/lib/store";

export default function Home() {
  const { products, banners, settings, ready, error } = useStore();
  const live = products.filter((p) => p.status === "published");
  const per = settings.productColumns * 2; // two rows
  const featured = live.filter((p) => p.featured).slice(0, per);
  const fresh = live.filter((p) => p.isNew).slice(0, per);
  const posters = banners.filter((b) => b.active).sort((a, b) => a.order - b.order);
  return (
    <>
      {posters.length > 0 ? <HeroSlider banners={posters} /> : (
        <section className="hero"><div className="hwrap">
          <div className="htxt">
            <AvoltixLogo size={64} />
            <h1>{brand.tagline}</h1>
            <p>{brand.description}</p>
            <div className="row"><Link className="btn" href="/products">Shop products</Link><Link className="btn ghost" href="/request">Request components</Link></div>
          </div>
          <HeroChip />
        </div></section>
      )}
      <section className="sec trust">
        <div><b>Order tracking</b><small>Follow every order from your account</small></div>
        <div><b>Component requests</b><small>Not in stock? Send your list and we will source it</small></div>
        <div><b>Verified specifications</b><small>We list only details we can confirm</small></div>
      </section>
      {error && <p className="sec st out_of_stock" role="alert">Could not load the catalogue: {error}</p>}
      {featured.length > 0 && <section className="sec"><h2>Featured products</h2><div className={`pgrid cols-${settings.productColumns}`}>{featured.map((p) => <ProductCard key={p.sku} p={p} />)}</div></section>}
      {fresh.length > 0 && <section className="sec"><h2>New arrivals</h2><div className={`pgrid cols-${settings.productColumns}`}>{fresh.map((p) => <ProductCard key={p.sku} p={p} />)}</div></section>}
      {ready && !live.length && !error && <section className="sec"><p className="note">No products are published yet. Add some from the admin panel.</p></section>}
      <section className="sec"><div className="band"><h2>Can’t find a component?</h2><p className="note">Send us your component list with quantities. If it is not in stock, we will arrange it and contact you.</p><Link className="btn" href="/request">Request components</Link></div></section>
    </>
  );
}
