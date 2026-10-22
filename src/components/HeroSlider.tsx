"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Banner } from "@/lib/store";

const AUTO_MS = 5000; // auto-advance every 5 seconds

function Slide({ b, onClick }: { b: Banner; onClick: (e: React.MouseEvent) => void }) {
  const img = <img src={b.imageUrl} alt={b.title} draggable={false} />;
  if (!b.link) return <div className="slide">{img}</div>; // not clickable
  return b.link.startsWith("/")
    ? <Link href={b.link} className="slide" onClick={onClick} draggable={false}>{img}</Link>
    : <a href={b.link} className="slide" target="_blank" rel="noopener noreferrer" onClick={onClick} draggable={false}>{img}</a>;
}

export default function HeroSlider({ banners }: { banners: Banner[] }) {
  const n = banners.length;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const cur = n ? Math.min(i, n - 1) : 0;
  const go = (k: number) => { if (n) setI(((k % n) + n) % n); };

  useEffect(() => {
    if (n < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setI((Math.min(i, n - 1) + 1) % n), AUTO_MS);
    return () => clearTimeout(t);
  }, [i, n, paused]);

  if (!n) return null;
  return (
    <section className="slider" role="region" aria-roledescription="carousel" aria-label="Offers and announcements"
      onKeyDown={(e) => { if (e.key === "ArrowLeft") go(cur - 1); if (e.key === "ArrowRight") go(cur + 1); }}>
      <div className="slides"
        onPointerEnter={(e) => { if (e.pointerType === "mouse") setPaused(true); }}
        onPointerLeave={(e) => { if (e.pointerType === "mouse") setPaused(false); }}
        onPointerDown={(e) => { start.current = { x: e.clientX, y: e.clientY }; dragged.current = false; if (e.pointerType !== "mouse") setPaused(true); }}
        onPointerCancel={() => { start.current = null; setPaused(false); }}
        onPointerUp={(e) => {
          const s0 = start.current; start.current = null; if (e.pointerType !== "mouse") setPaused(false);
          if (!s0) return; const dx = e.clientX - s0.x, dy = e.clientY - s0.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { dragged.current = true; go(cur + (dx < 0 ? 1 : -1)); }
        }}>
        <div className="track" style={{ transform: `translateX(-${cur * 100}%)` }}>
          {banners.map((b) => <div className="cell" key={b.id}><Slide b={b} onClick={(e) => { if (dragged.current) { e.preventDefault(); dragged.current = false; } }} /></div>)}
        </div>
      </div>
      {n > 1 && <>
        <button type="button" className="arrow l" aria-label="Previous slide" onClick={() => go(cur - 1)}>‹</button>
        <button type="button" className="arrow r" aria-label="Next slide" onClick={() => go(cur + 1)}>›</button>
        <div className="dots">{banners.map((b, k) => <button type="button" key={b.id} aria-label={`Show slide ${k + 1}`} aria-current={k === cur} onClick={() => go(k)} />)}</div>
      </>}
    </section>
  );
}
