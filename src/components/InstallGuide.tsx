import React, { useEffect, useState } from 'react';
import { MoreVertical, Plus, Share, Smartphone, SquarePlus, X } from 'lucide-react';
import { getStatsConsent } from '../lib/visits';

/**
 * «ثبّت منصة أئمة على هاتفك»: how to add the site to the home screen, as an app.
 * Shown by itself on the 1st and 2nd visit from a phone (never inside the installed app),
 * and on demand from the settings / menu.
 */
type Platform = 'ios' | 'android' | 'other';

const VISITS_KEY = 'aemmah-visit-count';
const DISMISSED_KEY = 'aemmah-install-dismissed';
const SESSION_KEY = 'aemmah-visit-counted-install';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const platform = (): Platform => {
  const ua = navigator.userAgent;
  if (/iP(hone|ad|od)/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
};
export const isInstalled = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    // storage blocked
  }
};

// Chrome / Android offers its own install window: keep the event to open it from our button.
let deferred: BeforeInstallPromptEvent | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
  });
}

/** Counts the visit (once per tab session) and says whether the guide should open by itself. */
function shouldAutoOpen(): boolean {
  if (isInstalled() || platform() === 'other' || read(DISMISSED_KEY)) return false;
  let count = Number(read(VISITS_KEY) || 0);
  try {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      sessionStorage.setItem(SESSION_KEY, '1');
      count += 1;
      write(VISITS_KEY, String(count));
    }
  } catch {
    // ignore
  }
  return count >= 1 && count <= 2;
}

export const InstallGuide: React.FC<{ open: boolean; onClose: () => void; onAutoOpen: () => void }> = ({ open, onClose, onAutoOpen }) => {
  const [os, setOs] = useState<Platform>('other');
  useEffect(() => setOs(platform()), []);

  // 1st and 2nd visit from a phone: open after a short pause (not over the statistics question).
  useEffect(() => {
    if (!shouldAutoOpen()) return;
    const t = window.setInterval(() => {
      if (getStatsConsent() === null && platform() !== 'other') return; // wait until that question is answered
      window.clearInterval(t);
      onAutoOpen();
    }, 1500);
    const stop = window.setTimeout(() => window.clearInterval(t), 60_000);
    return () => {
      window.clearInterval(t);
      window.clearTimeout(stop);
    };
  }, [onAutoOpen]);

  if (!open) return null;
  const tab = os === 'other' ? 'android' : os;
  const close = (forever: boolean) => {
    if (forever) write(DISMISSED_KEY, '1');
    onClose();
  };
  const installNow = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => null);
    deferred = null;
    close(true);
  };

  const Step: React.FC<{ n: number; children: React.ReactNode }> = ({ n, children }) => (
    <li className="flex items-start gap-3">
      <span className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-cedar-600 to-cedar-800 text-brass-100 text-sm font-black flex items-center justify-center">{n}</span>
      <span className="pt-0.5 leading-relaxed">{children}</span>
    </li>
  );
  const Key: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="inline-flex items-center gap-1 align-middle bg-slate-100 border border-slate-200 rounded-lg px-1.5 py-0.5 font-bold text-slate-800">{children}</span>
  );

  return (
    <div className="fixed inset-0 z-[75] bg-black/60 flex items-end sm:items-center justify-center" onClick={() => close(false)}>
      <div role="dialog" aria-modal="true" aria-label="ثبّت منصة أئمة على هاتفك" onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white text-slate-800 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl max-h-[92vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        <div className="relative home-hero text-white px-6 pt-6 pb-5 rounded-t-[2rem]">
          <button onClick={() => close(false)} aria-label="إغلاق" className="absolute top-4 left-4 w-9 h-9 rounded-full liquid-glass flex items-center justify-center cursor-pointer"><X className="w-5 h-5" /></button>
          <div className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" className="w-14 h-14 rounded-2xl shadow-lg" />
            <div>
              <h2 className="font-kufi text-2xl leading-tight">ثبّت منصة أئمة</h2>
              <p className="text-sm text-white/85">كتطبيق على هاتفك: أيقونة على الشاشة الرئيسية، وفتح بملء الشاشة، دون متجر تطبيقات.</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-1 bg-slate-100 rounded-full p-1" role="tablist">
            {(['ios', 'android'] as const).map((k) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setOs(k)}
                className={`py-2 rounded-full font-black cursor-pointer transition ${tab === k ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>
                {k === 'ios' ? 'آيفون (iPhone)' : 'أندرويد (Android)'}
              </button>
            ))}
          </div>

          {tab === 'ios' ? (
            <ol className="space-y-3">
              <Step n={1}>افتح الموقع في متصفح <b>Safari</b>.</Step>
              <Step n={2}>اضغط زر المشاركة <Key><Share className="w-4 h-4" /></Key> أسفل الشاشة (أو أعلاها في الآيباد).</Step>
              <Step n={3}>انزل في القائمة واختر <Key><SquarePlus className="w-4 h-4" /> إضافة إلى الشاشة الرئيسية</Key>.</Step>
              <Step n={4}>اضغط <Key>إضافة</Key> أعلى الشاشة. تظهر أيقونة «أئمة» بين تطبيقاتك.</Step>
            </ol>
          ) : (
            <>
              {deferred && (
                <button onClick={installNow} className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-brass-300 to-brass-500 text-ink font-black py-3.5 rounded-2xl cursor-pointer shadow">
                  <Smartphone className="w-5 h-5" /> تثبيت التطبيق الآن
                </button>
              )}
              <ol className="space-y-3">
                <Step n={1}>افتح الموقع في متصفح <b>Chrome</b>.</Step>
                <Step n={2}>اضغط زر القائمة <Key><MoreVertical className="w-4 h-4" /></Key> أعلى الشاشة.</Step>
                <Step n={3}>اختر <Key><Plus className="w-4 h-4" /> تثبيت التطبيق</Key> أو <Key>إضافة إلى الشاشة الرئيسية</Key>.</Step>
                <Step n={4}>اضغط <Key>تثبيت</Key>. تظهر أيقونة «أئمة» بين تطبيقاتك.</Step>
              </ol>
            </>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={() => close(true)} className="flex-1 py-3 rounded-2xl bg-emerald-800 text-white font-black cursor-pointer">فهمت</button>
            <button onClick={() => close(false)} className="flex-1 py-3 rounded-2xl border border-slate-300 font-bold text-slate-600 cursor-pointer">لاحقاً</button>
          </div>
          <p className="text-[11px] text-slate-400 text-center">تجد هذا الشرح دائماً في القائمة ← «ثبّت التطبيق على هاتفك».</p>
        </div>
      </div>
    </div>
  );
};
