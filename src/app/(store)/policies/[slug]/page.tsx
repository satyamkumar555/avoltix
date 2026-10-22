import { notFound } from "next/navigation";
import { brand } from "@/lib/config/brand";

const pages: Record<string, { title: string; body: string[] }> = {
  about: { title: "About us", body: [`${brand.name} sells electronics components, development boards, sensors, robotics kits and tools.`] },
  contact: { title: "Contact", body: ["Add your support email, phone number and address in the admin settings."] },
  faq: { title: "FAQ", body: ["Q: Is online payment available? A: Not yet. Orders are placed as requests and confirmed by our team."] },
  shipping: { title: "Shipping policy", body: ["Shipping charges and delivery times are configured by the store. Demo rule: free shipping above Rs 999."] },
  returns: { title: "Return and replacement policy", body: ["A return or replacement may be requested within 15 days of delivery for eligible products, with a video clearly showing the defect.", "Exclusions, shipping responsibility, refund timelines and warranty terms must be reviewed and finalised before this policy is published."] },
  terms: { title: "Terms and conditions", body: ["Draft. Have these reviewed by a qualified professional before launch."] },
  privacy: { title: "Privacy policy", body: ["Draft. Describe what customer data you collect and why, and have it reviewed before launch."] },
};
export function generateStaticParams() { return Object.keys(pages).map((slug) => ({ slug })); }
export default function Policy({ params }: { params: { slug: string } }) {
  const pg = pages[params.slug];
  if (!pg) notFound();
  return <section className="sec"><h1>{pg.title}</h1><p className="note">Draft content: review before publishing.</p>{pg.body.map((b) => <p key={b}>{b}</p>)}</section>;
}
