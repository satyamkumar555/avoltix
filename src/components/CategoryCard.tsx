import Link from "next/link";
import type { Category } from "@/lib/categories";

/** Card view for a category: image, name, description, product count and subcategory chips. */
export default function CategoryCard({ c, count, subs = [] }: { c: Category; count: number; subs?: Category[] }) {
  return (
    <article className="ccard">
      <Link href={`/products?cat=${c.id}`} className="cmain" aria-label={`${c.name}, ${count} products`}>
        <div className="catimg">{c.imageUrl ? <img src={c.imageUrl} alt="" loading="lazy" /> : <span>{c.name.slice(0, 1)}</span>}</div>
        <div className="cbody">
          <h3>{c.name}</h3>
          {c.description && <p>{c.description}</p>}
          <div className="cmeta"><span>{count} product{count === 1 ? "" : "s"}</span><span className="go">Shop now →</span></div>
        </div>
      </Link>
      {subs.length > 0 && <div className="chips">{subs.map((s) => <Link key={s.id} href={`/products?cat=${s.id}`}>{s.name}</Link>)}</div>}
    </article>
  );
}
