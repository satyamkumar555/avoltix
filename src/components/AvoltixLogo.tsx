"use client";
import { useEffect, useState, type CSSProperties } from "react";
import { brand } from "@/lib/config/brand";

const INTERVAL = 8000; // 5000-10000 ms

export default function AvoltixLogo({ size = 40 }: { size?: number }) {
  const [run, setRun] = useState(0);
  useEffect(() => {
    setRun(1);
    const t = setInterval(() => setRun((n) => n + 1), INTERVAL);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="logo" key={run} style={{ "--s": `${size}px` } as CSSProperties} role="img" aria-label={brand.name}>
      <svg className="bolt" viewBox="0 0 110 156" aria-hidden="true">
        <polygon points="72,0 14,88 46,88 4,154 106,58 70,58 108,0" />
      </svg>
      <span className="word" aria-hidden="true">
        {brand.name.toUpperCase().split("").map((c, i) => (
          <span key={i} style={{ "--i": i } as CSSProperties}>{c}</span>
        ))}
        <span className="tld" style={{ "--i": brand.name.length } as CSSProperties}>.in</span>
      </span>
    </span>
  );
}
