import React from 'react';

/*
 * Decorative backgrounds for the two home-page cards. They are drawn in white and blended into the card colour
 * (opacity + mix-blend-mode), so the colour stays dominant and the text stays readable.
 * To use a real photo instead, put the file in public/ and set its name in HERO_PHOTOS (src/config.ts).
 */

const artClass = 'absolute inset-0 w-full h-full pointer-events-none select-none';

/** A worshipper kneeling on a prayer rug, hands raised in du'a, under mosque arches and a hanging lamp. */
export const DuaArt: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" className={`${artClass} ${className}`} aria-hidden>
    <defs>
      <radialGradient id="dua-glow" cx="50%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="400" height="300" fill="url(#dua-glow)" />

    {/* Row of horseshoe arches (mosque interior) */}
    <g fill="none" stroke="#fff" strokeWidth="2" opacity="0.5">
      {[-60, 60, 180, 300].map((x) => (
        <path key={x} d={`M${x} 300 V150 A60 60 0 1 1 ${x + 120} 150 V300`} />
      ))}
      {[-60, 60, 180, 300].map((x) => (
        <path key={`i${x}`} d={`M${x + 12} 300 V152 A48 48 0 1 1 ${x + 108} 152 V300`} strokeWidth="1" />
      ))}
    </g>

    {/* Hanging lamps */}
    <g fill="#fff" opacity="0.75">
      {[120, 280].map((x) => (
        <g key={x}>
          <line x1={x} y1="0" x2={x} y2="58" stroke="#fff" strokeWidth="1.2" />
          <path d={`M${x - 12} 62 Q${x} 50 ${x + 12} 62 L${x + 8} 78 Q${x} 86 ${x - 8} 78 Z`} />
          <circle cx={x} cy="90" r="2.5" />
        </g>
      ))}
    </g>

    {/* Prayer rug */}
    <g opacity="0.55">
      <path d="M95 300 L130 236 H270 L305 300 Z" fill="#fff" opacity="0.35" />
      <path d="M112 300 L140 246 H260 L288 300" fill="none" stroke="#fff" strokeWidth="1.5" />
    </g>

    {/* Worshipper seen from behind, hands raised in du'a */}
    <g fill="#fff" opacity="0.9">
      <path d="M150 292 Q150 222 182 200 H218 Q250 222 250 292 Z" />
      <path d="M186 206 Q160 196 150 160" stroke="#fff" strokeWidth="15" strokeLinecap="round" fill="none" />
      <path d="M214 206 Q240 196 250 160" stroke="#fff" strokeWidth="15" strokeLinecap="round" fill="none" />
      <ellipse cx="146" cy="148" rx="10" ry="15" transform="rotate(-22 146 148)" />
      <ellipse cx="254" cy="148" rx="10" ry="15" transform="rotate(22 254 148)" />
      <circle cx="200" cy="176" r="20" />
      <path d="M180 172 Q200 146 220 172 Z" />
    </g>
  </svg>
);

/** An ornate Maghribi mihrab: horseshoe arch with alternating voussoirs, a zellige star pattern and a calligraphy band. */
export const MihrabArt: React.FC<{ className?: string }> = ({ className = '' }) => {
  // Voussoirs: radial wedges around the arch centre, alternating filled / empty (as in Córdoba and Fès).
  const cx = 200;
  const cy = 170;
  const voussoirs = Array.from({ length: 17 }, (_, i) => {
    const a0 = Math.PI * (1.08 + (i * 0.84) / 17);
    const a1 = Math.PI * (1.08 + ((i + 1) * 0.84) / 17);
    const p = (r: number, a: number) => `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
    return { d: `M${p(78, a0)} L${p(104, a0)} A104 104 0 0 1 ${p(104, a1)} L${p(78, a1)} A78 78 0 0 0 ${p(78, a0)} Z`, filled: i % 2 === 0 };
  });

  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" className={`${artClass} ${className}`} aria-hidden>
      <defs>
        <pattern id="zellige" width="36" height="36" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#fff" strokeWidth="1">
            <rect x="8" y="8" width="20" height="20" />
            <rect x="8" y="8" width="20" height="20" transform="rotate(45 18 18)" />
            <circle cx="18" cy="18" r="3" />
          </g>
        </pattern>
        <clipPath id="arch-clip">
          <path d="M108 300 V180 A104 104 0 1 1 292 180 V300 Z" />
        </clipPath>
      </defs>

      {/* Zellige field around the arch */}
      <rect width="400" height="300" fill="url(#zellige)" opacity="0.35" />

      {/* Rectangular frame (alfiz) */}
      <rect x="70" y="20" width="260" height="300" fill="none" stroke="#fff" strokeWidth="3" opacity="0.7" />
      <rect x="80" y="30" width="240" height="290" fill="none" stroke="#fff" strokeWidth="1" opacity="0.6" />

      {/* Calligraphy band across the top of the frame */}
      <text
        x="200"
        y="54"
        textAnchor="middle"
        fill="#fff"
        opacity="0.85"
        fontFamily="Ruwudu, Amiri, serif"
        fontSize="20"
      >
        بسم الله الرحمن الرحيم
      </text>
      <line x1="80" y1="64" x2="320" y2="64" stroke="#fff" strokeWidth="1" opacity="0.6" />

      {/* Plain niche inside the arch, so the arch reads clearly */}
      <rect x="0" y="0" width="400" height="300" clipPath="url(#arch-clip)" fill="#fff" opacity="0.12" />

      {/* Voussoirs */}
      <g stroke="#fff" strokeWidth="1" opacity="0.85">
        {voussoirs.map((v, i) => (
          <path key={i} d={v.d} fill={v.filled ? '#fff' : 'none'} fillOpacity={v.filled ? 0.45 : 0} />
        ))}
      </g>

      {/* Horseshoe arch outlines and columns */}
      <g fill="none" stroke="#fff" opacity="0.9">
        <path d="M96 300 V180 A104 104 0 1 1 304 180 V300" strokeWidth="3" />
        <path d="M122 300 V182 A78 78 0 1 1 278 182 V300" strokeWidth="2" />
      </g>
      <g fill="#fff" opacity="0.7">
        <rect x="112" y="210" width="10" height="90" />
        <rect x="278" y="210" width="10" height="90" />
        <rect x="108" y="204" width="18" height="6" />
        <rect x="274" y="204" width="18" height="6" />
      </g>

      {/* Hanging lamp in the niche */}
      <g fill="#fff" opacity="0.85">
        <line x1="200" y1="110" x2="200" y2="168" stroke="#fff" strokeWidth="1.2" />
        <path d="M186 172 Q200 158 214 172 L209 192 Q200 200 191 192 Z" />
        <circle cx="200" cy="206" r="3" />
      </g>
    </svg>
  );
};

/** Hanging lantern (fanous), drawn in gold. `x` is its centre, `len` the chain length. */
const Lantern: React.FC<{ x: number; len: number; scale?: number }> = ({ x, len, scale = 1 }) => (
  <g transform={`translate(${x} 0) scale(${scale})`}>
    <line x1="0" y1="0" x2="0" y2={len} stroke="url(#gold)" strokeWidth="1.5" />
    <g transform={`translate(0 ${len})`}>
      <path d="M-6 0 H6 L10 10 H-10 Z" fill="url(#gold)" />
      <path d="M-14 10 H14 L18 22 H-18 Z" fill="url(#gold)" />
      <rect x="-14" y="22" width="28" height="44" rx="4" fill="#fcd27f" fillOpacity="0.18" stroke="url(#gold)" strokeWidth="2" />
      <ellipse cx="0" cy="46" rx="7" ry="12" fill="#ffe7a8" opacity="0.9" />
      <ellipse cx="0" cy="46" rx="16" ry="24" fill="#ffd36b" opacity="0.18" />
      <path d="M-7 22 V66 M7 22 V66" stroke="url(#gold)" strokeWidth="1" opacity="0.7" />
      <path d="M-18 66 H18 L12 78 H-12 Z" fill="url(#gold)" />
      <path d="M-4 78 H4 L0 88 Z" fill="url(#gold)" />
    </g>
  </g>
);

/** Golden crescent with a geometric star pattern and hanging lanterns, for the dark home hero. */
export const NightDecor: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 260 230" className={`pointer-events-none select-none ${className}`} aria-hidden>
    <defs>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fde7a9" />
        <stop offset="55%" stopColor="#e6b25a" />
        <stop offset="100%" stopColor="#a8742c" />
      </linearGradient>
      <pattern id="crescent-stars" width="14" height="14" patternUnits="userSpaceOnUse">
        <g fill="none" stroke="#f3cf85" strokeWidth="0.7" opacity="0.9">
          <rect x="3" y="3" width="8" height="8" />
          <rect x="3" y="3" width="8" height="8" transform="rotate(45 7 7)" />
        </g>
      </pattern>
      <mask id="crescent-mask">
        <circle cx="80" cy="120" r="70" fill="#fff" />
        <circle cx="112" cy="98" r="62" fill="#000" />
      </mask>
    </defs>
    <g mask="url(#crescent-mask)">
      <circle cx="80" cy="120" r="70" fill="#1c3550" />
      <circle cx="80" cy="120" r="70" fill="url(#crescent-stars)" />
    </g>
    {/* Gold rim of the crescent */}
    <g mask="url(#crescent-mask)">
      <circle cx="80" cy="120" r="68.5" fill="none" stroke="url(#gold)" strokeWidth="3" />
    </g>
    <circle cx="112" cy="98" r="62" fill="none" stroke="url(#gold)" strokeWidth="2.5" mask="url(#crescent-mask)" />
    <Lantern x={168} len={40} />
    <Lantern x={222} len={78} scale={0.85} />
  </svg>
);
