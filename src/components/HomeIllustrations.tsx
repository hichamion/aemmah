import React, { useId } from 'react';

/**
 * Flat illustrations for the two access cards of the home page (faceless figures, platform colours).
 * Drawn as inline SVG: sharp on every screen, no extra download.
 */

const SKIN = '#e8c39e';
const SKIN_SHADE = '#d4a77c';
const IVORY = '#fbf6ea';
const IVORY_SHADE = '#e9dfc8';
const BRASS = '#d6ae5c';
const BRASS_DARK = '#a9843a';

/** An imam (turban, beard, green robe with gold trim) reading from a book with a young student. */
export const ImamIllustration: React.FC<{ className?: string }> = ({ className = 'h-full w-auto' }) => (
  <svg viewBox="0 0 220 160" className={className} role="img" aria-label="إمام يعلّم طالباً">
    {/* soft arch behind the figures */}
    <path d="M40 160V78a70 70 0 0 1 140 0v82z" fill="#ffffff" fillOpacity="0.08" />
    <path d="M58 160V82a52 52 0 0 1 104 0v78z" fill="#ffffff" fillOpacity="0.06" />

    {/* ---- Imam ---- */}
    {/* robe */}
    <path d="M38 160c2-38 18-58 50-60 32 2 48 22 50 60z" fill="#1e5a48" />
    <path d="M38 160c2-38 18-58 50-60 6 .4 11 1.4 16 3-24 6-36 26-38 57z" fill="#164536" />
    {/* inner white garment and gold trim */}
    <path d="M80 102l8 58 8-58c-5-1.5-11-1.5-16 0z" fill={IVORY} />
    <path d="M78 103l-6 57M98 103l6 57" stroke={BRASS} strokeWidth="3.2" strokeLinecap="round" />
    {/* neck */}
    <rect x="81" y="88" width="14" height="14" rx="5" fill={SKIN_SHADE} />
    {/* head */}
    <circle cx="88" cy="72" r="20" fill={SKIN} />
    {/* beard */}
    <path d="M68 72c0 20 9 32 20 32s20-12 20-32c-4 8-11 11-20 11s-16-3-20-11z" fill="#3b2a21" />
    {/* turban */}
    <path d="M66 66c-1-20 12-30 22-30s23 10 22 30c-6-4-14-6-22-6s-16 2-22 6z" fill={IVORY} />
    <path d="M66 66c6-4 14-6 22-6s16 2 22 6" stroke={IVORY_SHADE} strokeWidth="3" fill="none" />
    <path d="M70 50c8-3 28-3 36 0" stroke={IVORY_SHADE} strokeWidth="2" fill="none" />
    <ellipse cx="88" cy="38" rx="7" ry="4" fill="#b8323a" />
    {/* hand on the book */}
    <ellipse cx="114" cy="128" rx="8" ry="6" fill={SKIN} />

    {/* ---- Student ---- */}
    <path d="M128 160c1-28 13-42 34-43 21 1 33 15 34 43z" fill={IVORY} />
    <path d="M162 117c-21 1-33 15-34 43h10c1-24 9-38 24-43z" fill={IVORY_SHADE} />
    <rect x="156" y="104" width="12" height="12" rx="4" fill={SKIN_SHADE} />
    <circle cx="162" cy="92" r="15" fill={SKIN} />
    <path d="M147 89c0-14 7-20 15-20s15 6 15 20c-5-3-10-4-15-4s-10 1-15 4z" fill="#ffffff" />
    <path d="M150 80c7-2 17-2 24 0" stroke={IVORY_SHADE} strokeWidth="1.6" fill="none" />
    <ellipse cx="150" cy="134" rx="6.5" ry="5" fill={SKIN} />

    {/* ---- Open book held between them ---- */}
    <path d="M110 120l22-5 22 5v22l-22-5-22 5z" fill="#0f3127" />
    <path d="M113 119l19-4v21l-19 4z" fill={IVORY} />
    <path d="M151 119l-19-4v21l19 4z" fill="#f3ead4" />
    <path d="M116 124l13-3M116 128l13-3M116 132l13-3M135 121l13 3M135 125l13 3M135 129l13 3" stroke={BRASS} strokeWidth="1" opacity="0.7" />
    <path d="M132 115v21" stroke={BRASS_DARK} strokeWidth="1.2" />
  </svg>
);

/** A mosque with a large dome, two minarets and arched doors. */
export const MosqueIllustration: React.FC<{ className?: string }> = ({ className = 'h-full w-auto' }) => {
  // Unique gradient ids: the drawing can appear twice on a page (phone and desktop copies).
  const uid = useId().replace(/:/g, '');
  const dome = `mq-dome-${uid}`;
  const wall = `mq-wall-${uid}`;
  return (
  <svg viewBox="0 0 220 160" className={className} role="img" aria-label="مسجد">
    <defs>
      <linearGradient id={dome} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4fb3c0" />
        <stop offset="1" stopColor="#1d6b78" />
      </linearGradient>
      <linearGradient id={wall} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={IVORY} />
        <stop offset="1" stopColor={IVORY_SHADE} />
      </linearGradient>
    </defs>

    {/* moon */}
    <path d="M182 22a12 12 0 1 0 9 20 10 10 0 1 1-9-20z" fill={BRASS} opacity="0.9" />

    {/* minarets */}
    {[30, 176].map((x) => (
      <g key={x}>
        <rect x={x} y="56" width="14" height="96" fill={`url(#${wall})`} />
        <rect x={x - 3} y="78" width="20" height="5" rx="1.5" fill={BRASS} />
        <rect x={x - 3} y="112" width="20" height="5" rx="1.5" fill={BRASS} />
        <rect x={x + 4} y="62" width="6" height="10" rx="3" fill="#1d6b78" opacity="0.55" />
        <path d={`M${x - 2} 56h18l-9-22z`} fill={`url(#${dome})`} />
        <path d={`M${x + 7} 34v-8`} stroke={BRASS} strokeWidth="1.6" />
        <circle cx={x + 7} cy="24" r="2" fill={BRASS} />
      </g>
    ))}

    {/* side domes */}
    <path d="M52 100a16 16 0 0 1 32 0z" fill={`url(#${dome})`} />
    <path d="M136 100a16 16 0 0 1 32 0z" fill={`url(#${dome})`} />
    {/* main dome */}
    <path d="M70 98c0-30 16-48 40-54 24 6 40 24 40 54z" fill={`url(#${dome})`} />
    <path d="M86 98c0-26 10-42 24-50-8 10-12 28-12 50z" fill="#ffffff" opacity="0.18" />
    <rect x="66" y="96" width="88" height="6" rx="2" fill={BRASS} />
    <path d="M110 44v-12" stroke={BRASS} strokeWidth="2" />
    <path d="M110 22a6 6 0 1 0 4.5 10 5 5 0 1 1-4.5-10z" fill={BRASS} />

    {/* main building */}
    <rect x="48" y="100" width="124" height="52" fill={`url(#${wall})`} />
    <rect x="48" y="100" width="124" height="4" fill={BRASS} opacity="0.85" />
    {/* arches */}
    <path d="M98 152v-26a12 12 0 0 1 24 0v26z" fill="#0f414c" />
    <path d="M101 152v-25a9 9 0 0 1 18 0v25" stroke={BRASS} strokeWidth="1.4" fill="none" />
    {[60, 78, 134, 152].map((x) => (
      <path key={x} d={`M${x} 140v-14a5 5 0 0 1 10 0v14z`} fill="#1d6b78" opacity="0.75" />
    ))}
    {/* ground */}
    <rect x="18" y="150" width="184" height="6" rx="3" fill={IVORY_SHADE} />
  </svg>
  );
};
