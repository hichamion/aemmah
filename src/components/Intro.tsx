import React, { useEffect, useState } from 'react';

/*
 * Opening screen shown once per browser session on the home page: a golden mihrab arch draws itself
 * under a starry sky, a lantern lights up, then the name, the tagline and the verse appear.
 * Animations live in index.css (classes "intro-*"); they are disabled for users who prefer reduced motion.
 */

const SEEN_KEY = 'aemmah-intro-seen';
const AUTO_CLOSE_MS = 9000;
const EXIT_MS = 700;

/** Show the intro only on a first visit of the session, and only when landing on the home page. */
export function shouldShowIntro(): boolean {
  try {
    if (sessionStorage.getItem(SEEN_KEY)) return false;
  } catch {
    // Storage blocked: still show it, it just may appear again.
  }
  const h = window.location.hash;
  return h === '' || h === '#' || h === '#/';
}

// Fixed star positions (percent), so the sky looks the same on every render.
const STARS = [
  [8, 12, 2], [18, 30, 1.5], [27, 8, 2.5], [35, 22, 1.5], [44, 6, 2], [58, 14, 1.5], [66, 28, 2.5], [74, 9, 2],
  [83, 20, 1.5], [92, 11, 2], [12, 48, 1.5], [88, 44, 2], [6, 72, 2], [95, 68, 1.5], [20, 86, 2], [78, 84, 2.5],
  [50, 92, 1.5], [38, 76, 1.5], [62, 70, 2], [3, 30, 1.5],
];

export const Intro: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [leaving, setLeaving] = useState(false);

  const close = () => {
    if (leaving) return;
    setLeaving(true);
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      // ignore
    }
    window.setTimeout(onDone, EXIT_MS);
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(close, AUTO_CLOSE_MS);
    const onKey = (e: KeyboardEvent) => (e.key === 'Escape' || e.key === 'Enter') && close();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="منصة أئمة"
      className={`intro fixed inset-0 z-[100] night-sky text-white flex flex-col items-center justify-center px-6 overflow-hidden ${
        leaving ? 'intro-leave' : ''
      }`}
    >
      {/* Twinkling stars */}
      {STARS.map(([x, y, r], i) => (
        <span
          key={i}
          className="intro-star absolute rounded-full bg-white"
          style={{ left: `${x}%`, top: `${y}%`, width: r * 2, height: r * 2, animationDelay: `${(i % 7) * 0.45}s` }}
          aria-hidden
        />
      ))}

      <button
        onClick={close}
        className="absolute top-5 left-5 text-white/70 hover:text-white text-sm font-bold px-4 py-2 rounded-full border border-white/20 hover:bg-white/10 cursor-pointer"
      >
        تخطّي
      </button>

      {/* Mihrab arch drawing itself, with a lantern */}
      <svg viewBox="0 0 240 280" className="w-44 sm:w-56 h-auto mb-4 sm:mb-6" aria-hidden>
        <defs>
          <linearGradient id="intro-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fde7a9" />
            <stop offset="55%" stopColor="#e6b25a" />
            <stop offset="100%" stopColor="#a8742c" />
          </linearGradient>
          <radialGradient id="intro-glow" cx="50%" cy="55%" r="50%">
            <stop offset="0%" stopColor="#ffd36b" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ffd36b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse className="intro-glow" cx="120" cy="160" rx="110" ry="120" fill="url(#intro-glow)" />
        <path
          className="intro-draw"
          pathLength={1}
          d="M30 272 V140 C30 78 120 18 120 18 C120 18 210 78 210 140 V272"
          fill="none"
          stroke="url(#intro-gold)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="intro-draw intro-draw-2"
          pathLength={1}
          d="M58 272 V148 C58 104 120 60 120 60 C120 60 182 104 182 148 V272"
          fill="none"
          stroke="url(#intro-gold)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.75"
        />
        <path className="intro-draw intro-draw-3" pathLength={1} d="M14 272 H226" stroke="url(#intro-gold)" strokeWidth="5" strokeLinecap="round" />
        {/* Lantern */}
        <g className="intro-lantern">
          <line x1="120" y1="60" x2="120" y2="118" stroke="url(#intro-gold)" strokeWidth="1.5" />
          <path d="M108 118 H132 L136 128 H104 Z" fill="url(#intro-gold)" />
          <rect x="106" y="128" width="28" height="40" rx="5" fill="#fcd27f" fillOpacity="0.15" stroke="url(#intro-gold)" strokeWidth="2" />
          <ellipse className="intro-flame" cx="120" cy="148" rx="6" ry="11" fill="#ffe7a8" />
          <path d="M102 168 H138 L131 180 H109 Z" fill="url(#intro-gold)" />
          <path d="M116 180 H124 L120 190 Z" fill="url(#intro-gold)" />
        </g>
      </svg>

      <h1 className="intro-title font-kufi text-6xl sm:text-8xl leading-tight text-center">منصة أئمة</h1>

      <p className="intro-sub mt-3 sm:mt-4 text-lg sm:text-2xl text-sky-100 font-bold text-center">
        جسر تواصل وربط بين الأئمة والمساجد
      </p>

      <div className="intro-line my-5 sm:my-7 flex items-center gap-2" aria-hidden>
        <span className="h-px w-16 sm:w-24 bg-gradient-to-l from-amber-400 to-transparent" />
        <span className="w-2 h-2 rotate-45 bg-amber-400" />
        <span className="h-px w-16 sm:w-24 bg-gradient-to-r from-amber-400 to-transparent" />
      </div>

      <p className="intro-ayah font-amiri text-2xl sm:text-4xl text-amber-200 text-center leading-relaxed">
        ﴿ وَجَعَلْنَاهُمْ أَئِمَّةً يَهْدُونَ بِأَمْرِنَا ﴾
      </p>
      <p className="intro-ayah-ref mt-1 text-sm text-white/60">[الأنبياء: ٧٣]</p>

      <button
        onClick={close}
        className="intro-enter mt-8 sm:mt-10 glass rounded-full px-8 py-3.5 text-base sm:text-lg font-black cursor-pointer hover:bg-white/20"
      >
        الدخول إلى المنصة
      </button>
    </div>
  );
};
