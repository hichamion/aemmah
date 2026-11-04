import React, { useState } from 'react';
import { ChevronLeft, Hash, Plus } from 'lucide-react';
import { CommunityPost } from '../../types/community';
import { timeAgo } from './PostParts';

export interface SidebarTab {
  key: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  count?: number;
}

/** Eight-pointed star (khatam) used as a small ornament beside the titles. */
export const Ornament: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="5" y="5" width="14" height="14" rx="1" />
    <rect x="5" y="5" width="14" height="14" rx="1" transform="rotate(45 12 12)" />
    <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
  </svg>
);

/**
 * Right sidebar of «ملتقى الأئمة» (RTL): section tiles and an expanding list of categories.
 * On phones the tiles become a compact grid above the wall (no horizontal scrolling).
 */
export const CommunitySidebar: React.FC<{
  tabs: SidebarTab[];
  active: string | null;
  onTab: (key: string) => void;
  categories: { name: string; count: number }[];
  category: string;
  onCategory: (c: string) => void;
}> = ({ tabs, active, onTab, categories, category, onCategory }) => {
  const [open, setOpen] = useState(!!category);
  return (
    <nav aria-label="أقسام الملتقى" className="lg:sticky lg:top-24 space-y-3">
      <p className="hidden lg:flex items-center gap-2 text-[#0b5e37] font-black text-lg font-amiri px-1">
        <Ornament className="w-5 h-5 text-amber-500" /> أقسام الملتقى
      </p>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
        {tabs.map((t) => {
          const on = active === t.key;
          return (
            <li key={t.key}>
              <button
                onClick={() => onTab(t.key)}
                aria-current={on ? 'page' : undefined}
                className="cm-tile w-full h-full text-right rounded-2xl px-3 py-3 lg:py-3.5 flex items-center gap-2.5 cursor-pointer text-[#0b3a2a] ring-1 ring-emerald-900/5"
              >
                <span className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition ${on ? 'bg-white/20 text-white' : 'bg-white/80 text-emerald-800 shadow-xs'}`}>
                  {t.icon}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-black leading-tight">{t.label}</span>
                  <span className={`hidden lg:block text-[11px] mt-0.5 truncate ${on ? 'text-white/80' : 'text-slate-500'}`}>{t.hint}</span>
                </span>
                {!!t.count && (
                  <span className={`text-[11px] font-black px-1.5 min-w-5 text-center rounded-full ${on ? 'bg-white/25' : 'bg-white text-emerald-900'}`}>{t.count}</span>
                )}
                <ChevronLeft className={`hidden lg:block w-4 h-4 shrink-0 transition-transform ${on ? 'opacity-90 -translate-x-0.5' : 'opacity-40'}`} />
              </button>
            </li>
          );
        })}

        {/* Categories accordion */}
        <li className="col-span-2 sm:col-span-3 lg:col-span-1">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="cm-categories"
            className="cm-tile w-full text-right rounded-2xl px-3 py-3 flex items-center gap-2.5 cursor-pointer text-[#0b3a2a] ring-1 ring-emerald-900/5"
          >
            <span className="w-9 h-9 shrink-0 rounded-xl bg-white/80 text-emerald-800 shadow-xs flex items-center justify-center">
              <Hash className="w-4 h-4" />
            </span>
            <span className="flex-1 text-sm font-black">التصنيفات{category ? ` · ${category}` : ''}</span>
            <Plus className={`w-4 h-4 text-emerald-800 transition-transform duration-300 ${open ? 'rotate-45' : ''}`} />
          </button>
          <div id="cm-categories" className="cm-collapse" data-open={open}>
            <div>
              <ul className="pt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1">
                {categories.map((c) => (
                  <li key={c.name}>
                    <button
                      onClick={() => onCategory(c.name === category ? '' : c.name)}
                      aria-pressed={c.name === category}
                      className={`w-full text-right text-[13px] px-3 py-2 rounded-xl cursor-pointer flex items-center gap-2 transition ${
                        c.name === category ? 'bg-emerald-800 text-white font-bold' : 'bg-white/70 hover:bg-white text-slate-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rotate-45 shrink-0 ${c.name === category ? 'bg-amber-300' : 'bg-emerald-600/60'}`} aria-hidden />
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className={`text-[11px] ${c.name === category ? 'text-white/80' : 'text-slate-400'}`}>{c.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </li>
      </ul>
    </nav>
  );
};

/** Left column: latest / most active topics with diamond bullets (like a «related topics» panel). */
export const TopicsPanel: React.FC<{ title: string; posts: CommunityPost[]; onOpen: (id: string) => void; footer?: React.ReactNode }> = ({
  title,
  posts,
  onOpen,
  footer,
}) => (
  <section className="bg-white/85 backdrop-blur rounded-3xl border border-slate-200/80 overflow-hidden">
    <h2 className="text-center font-black font-amiri text-lg text-[#0b5e37] pt-4 pb-2">{title}</h2>
    <div className="mx-auto w-14 h-1 rounded-full bg-amber-300/70 mb-2" aria-hidden />
    {posts.length === 0 ? (
      <p className="text-xs text-slate-500 text-center px-4 pb-5">لا توجد مواضيع بعد.</p>
    ) : (
      <ul className="divide-y divide-slate-100">
        {posts.map((p) => (
          <li key={p.id}>
            <button onClick={() => onOpen(p.id)} className="w-full text-right px-4 py-3 flex gap-2.5 hover:bg-emerald-50/60 transition cursor-pointer group">
              <span className="mt-1.5 w-2 h-2 rotate-45 shrink-0 bg-emerald-600/70 group-hover:bg-amber-500 transition" aria-hidden />
              <span className="min-w-0">
                <span className="block text-[13px] font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-emerald-800">{p.title}</span>
                <span className="block text-[11px] text-slate-400 mt-0.5">
                  {timeAgo(p.publishedAt || p.createdAt)} · {p.commentCount} تعليق
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    )}
    {footer && <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-600">{footer}</div>}
  </section>
);

/** Very faint Arabic letters behind the community page (decorative only). */
export const CommunityBackdrop: React.FC = () => {
  const glyphs: { t: string; cls: string }[] = [
    { t: 'ن', cls: 'top-[4%] right-[3%] text-[13rem] rotate-[-8deg]' },
    { t: 'اقرأ', cls: 'top-[30%] left-[2%] text-[9rem] rotate-[6deg]' },
    { t: 'ق', cls: 'top-[58%] right-[8%] text-[12rem] rotate-[10deg]' },
    { t: 'ص', cls: 'bottom-[4%] left-[18%] text-[11rem] rotate-[-6deg]' },
    { t: 'ع', cls: 'top-[12%] left-[38%] text-[8rem] rotate-[4deg]' },
    { t: 'و', cls: 'bottom-[22%] right-[42%] text-[9rem] rotate-[-12deg]' },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {glyphs.map((g) => (
        <span key={g.t + g.cls} className={`community-watermark font-maghribi absolute ${g.cls}`}>
          {g.t}
        </span>
      ))}
    </div>
  );
};
