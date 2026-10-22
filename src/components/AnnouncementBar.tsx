"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";

export default function AnnouncementBar() {
  const { announcement: a } = useStore();
  if (!a || !a.enabled || !a.text) return null;
  if (!a.link) return <div className="ann">{a.text}</div>; // not clickable
  return a.link.startsWith("/")
    ? <Link href={a.link} className="ann link">{a.text}</Link>
    : <a href={a.link} className="ann link" target="_blank" rel="noopener noreferrer">{a.text}</a>;
}
