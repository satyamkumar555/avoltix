"use client";
import CategoryCard from "@/components/CategoryCard";
import { childrenOf, descendantIds } from "@/lib/categories";
import { useStore } from "@/lib/store";

export default function Categories() {
  const { categories, products, settings, ready } = useStore();
  if (!ready) return <p className="sec note">Loading…</p>;
  const pub = categories.filter((c) => c.published);
  const live = products.filter((p) => p.status === "published");
  const count = (id: string) => { const ids = descendantIds(pub, id); return live.filter((p) => ids.includes(p.categoryId)).length; };
  return (
    <section className="sec"><h1>All categories</h1>
      {pub.length ? <div className={`catgrid cols-${settings.categoryColumns}`}>{childrenOf(pub, null).map((c) => <CategoryCard key={c.id} c={c} count={count(c.id)} subs={childrenOf(pub, c.id)} />)}</div> : <p className="note">No categories yet.</p>}
    </section>
  );
}
