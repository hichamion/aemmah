import React, { useEffect, useRef, useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { LANGS, t, useLang } from '../i18n';

/** Row of language buttons (settings panel and phone menu). */
export const LanguageButtons: React.FC<{ onPicked?: () => void; dark?: boolean }> = ({ onPicked, dark }) => {
  const { lang, setLang } = useLang();
  return (
    <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={t('اللغة')}>
      {LANGS.map((l) => {
        const on = l.code === lang;
        return (
          <button
            key={l.code}
            type="button"
            role="radio"
            aria-checked={on}
            lang={l.code}
            onClick={() => {
              onPicked?.();
              if (!on) setLang(l.code);
            }}
            className={`rounded-xl py-2 px-1 text-xs font-black cursor-pointer transition border ${
              on
                ? 'bg-emerald-800 border-emerald-800 text-white'
                : dark
                ? 'bg-white/5 border-white/15 text-white/85 hover:bg-white/10'
                : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-500'
            }`}
          >
            <span className="block text-sm leading-tight">{l.short}</span>
            <span className="block text-[10px] font-bold opacity-80 truncate">{l.label}</span>
          </button>
        );
      })}
    </div>
  );
};

/** Compact globe button with a dropdown (desktop top bar). */
export const LanguageMenu: React.FC = () => {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  const cur = LANGS.find((l) => l.code === lang)!;
  return (
    <div className="relative hidden lg:block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('اللغة')}
        title={t('اللغة')}
        className="h-10 px-2.5 inline-flex items-center gap-1.5 rounded-full text-slate-200 hover:text-white hover:bg-white/10 transition cursor-pointer text-xs font-black"
      >
        <Globe className="w-5 h-5" />
        {cur.short}
      </button>
      {open && (
        <div role="menu" className="absolute top-12 end-0 z-50 w-44 rounded-2xl bg-white text-slate-800 shadow-2xl ring-1 ring-slate-200 p-1.5">
          {LANGS.map((l) => (
            <button
              key={l.code}
              role="menuitemradio"
              aria-checked={l.code === lang}
              lang={l.code}
              type="button"
              onClick={() => {
                setOpen(false);
                if (l.code !== lang) setLang(l.code);
              }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-bold cursor-pointer ${
                l.code === lang ? 'bg-emerald-50 text-emerald-900' : 'hover:bg-slate-50'
              }`}
            >
              <span>{l.label}</span>
              {l.code === lang ? <Check className="w-4 h-4" /> : <span className="text-xs text-slate-400">{l.short}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
