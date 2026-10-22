import Link from "next/link";
import { brand } from "@/lib/config/brand";

const cols: [string, [string, string][]][] = [
  ["Shop", [["All products", "/products"], ["Categories", "/categories"], ["Request components", "/request"], ["My orders", "/orders"]]],
  ["Support", [["FAQ", "/policies/faq"], ["Shipping", "/policies/shipping"], ["Returns", "/policies/returns"], ["Contact", "/policies/contact"]]],
  ["Company", [["About us", "/policies/about"], ["Terms", "/policies/terms"], ["Privacy", "/policies/privacy"]]],
];
export default function Footer() {
  return (
    <footer className="ftr">
      <div className="fgrid">
        <div className="fbrand">
          <span className="fname"><svg viewBox="0 0 110 156" width="18" aria-hidden="true"><polygon fill="#1ea0ff" points="72,0 14,88 46,88 4,154 106,58 70,58 108,0" /></svg>{brand.name.toUpperCase()}<span className="tldf">.in</span></span>
          <p>{brand.tagline}</p><p className="note">{brand.description}</p>
        </div>
        {cols.map(([t, ls]) => (<nav key={t} aria-label={t}><h4>{t}</h4>{ls.map(([l, h]) => <Link key={h} href={h}>{l}</Link>)}</nav>))}
      </div>
      <div className="fbar"><span>© {new Date().getFullYear()} {brand.domain}. All rights reserved.</span><span>Prices in INR</span></div>
    </footer>
  );
}
