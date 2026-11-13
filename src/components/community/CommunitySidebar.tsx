import React from 'react';
import { ChevronLeft } from 'lucide-react';
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
 * Right sidebar of «ملتقى الأئمة» on larger screens (RTL): section tiles. Phones use the tab bar of the page.
 */
export const CommunitySidebar: React.FC<{
  tabs: SidebarTab[];
  active: string | null;
  onTab: (key: string) => void;
}> = ({ tabs, active, onTab }) => {
  return (
    <nav aria-label="أقسام الملتقى" className="lg:sticky lg:top-24 space-y-3">
      <p className="hidden lg:flex items-center gap-2 text-[#0b5e37] font-black text-lg font-amiri px-1">
        <Ornament className="w-5 h-5 text-amber-500" /> أقسام الملتقى
      </p>
      <ul className="grid grid-cols-1 gap-2">
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
