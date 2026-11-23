import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DICT } from './dict';

/*
 * Site languages. Arabic is the source language: every text in the code stays written in Arabic and is
 * looked up in DICT for the other languages (missing translations fall back to English, then Arabic).
 * Texts written by users (profiles, ads, posts) are never translated.
 *
 *   t('الرئيسية')                    → «Home» in English
 *   t('{n} إمام متاح', { n: 5 })     → «5 imams available»
 */

export type Lang = 'ar' | 'en' | 'fr' | 'de' | 'tr';

export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: 'ar', label: 'العربية', short: 'ع' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'de', label: 'Deutsch', short: 'DE' },
  { code: 'tr', label: 'Türkçe', short: 'TR' },
];

const KEY = 'aemmah-lang';
const isLang = (x: unknown): x is Lang => typeof x === 'string' && LANGS.some((l) => l.code === x);

/** ?lang=de in the address wins (shareable links), then the visitor's saved choice, then Arabic. */
export function initialLang(): Lang {
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (isLang(q)) {
      localStorage.setItem(KEY, q);
      return q;
    }
    const saved = localStorage.getItem(KEY);
    if (isLang(saved)) return saved;
  } catch {
    // storage blocked: Arabic
  }
  return 'ar';
}

let current: Lang = 'ar';
export const currentLang = () => current;
export const isRtl = (l: Lang = current) => l === 'ar';

/** Sets <html lang/dir> (call before the first render to avoid a flash). */
export function applyLang(l: Lang) {
  current = l;
  const root = document.documentElement;
  root.lang = l;
  root.dir = isRtl(l) ? 'rtl' : 'ltr';
}

/** Translates an Arabic text into the current language; {name} placeholders are filled from vars. */
export function t(ar: string, vars?: Record<string, string | number>): string {
  let s = ar;
  if (current !== 'ar') {
    const e = DICT[ar];
    s = (e && (e[current] || e.en)) || ar;
  }
  if (vars) for (const k in vars) s = s.split(`{${k}}`).join(String(vars[k]));
  return s;
}

/** Locale for dates and numbers. */
export const locale = () => ({ ar: 'ar', en: 'en-GB', fr: 'fr-FR', de: 'de-DE', tr: 'tr-TR' })[current];

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: 'ar', setLang: () => {} });
export const useLang = () => useContext(Ctx);

/**
 * Holds the language. The app is remounted (key) when it changes, so every t() call — also in
 * constants read during render — picks up the new language without threading it everywhere.
 */
export const I18nProvider: React.FC<{ children: (lang: Lang) => React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const l = initialLang();
    applyLang(l);
    return l;
  });
  const setLang = useCallback((l: Lang) => {
    try {
      localStorage.setItem(KEY, l);
    } catch {
      // ignore
    }
    applyLang(l);
    setLangState(l);
  }, []);
  useEffect(() => {
    document.title = t('منصة أئمة | جسر تواصل بين الأئمة والمساجد');
  }, [lang]);
  return <Ctx.Provider value={{ lang, setLang }}>{children(lang)}</Ctx.Provider>;
};
