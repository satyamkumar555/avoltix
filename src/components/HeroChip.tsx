export default function HeroChip() {
  return (
    <svg viewBox="0 0 320 320" className="chip" aria-hidden="true">
      <defs><linearGradient id="hg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#1ea0ff" /><stop offset="1" stopColor="#7c5cff" /></linearGradient></defs>
      <g className="traces" stroke="url(#hg)" fill="none" strokeWidth="2">
        <path d="M100 130H40V60" /><path d="M100 190H30" /><path d="M220 130H280V70" /><path d="M220 190H290V250" /><path d="M130 100V40" /><path d="M190 220V290" />
      </g>
      <g fill="#5ee1ff"><circle cx="40" cy="60" r="4" /><circle cx="30" cy="190" r="4" /><circle cx="280" cy="70" r="4" /><circle cx="290" cy="250" r="4" /><circle cx="130" cy="40" r="4" /><circle cx="190" cy="290" r="4" /></g>
      <rect x="100" y="100" width="120" height="120" rx="14" fill="#0b1224" stroke="url(#hg)" strokeWidth="3" />
      <polygon transform="translate(133 118) scale(.52)" fill="#1ea0ff" points="72,0 14,88 46,88 4,154 106,58 70,58 108,0" />
    </svg>
  );
}
