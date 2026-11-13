import React, { useState } from 'react';
import { BarChart3, Monitor, Moon, RotateCcw, Smartphone, Sparkles, Sun, Type, Wind, X } from 'lucide-react';
import { resetSettings, saveSettings, Settings, ThemeChoice, useSettings } from '../lib/settings';
import { getStatsConsent, setStatsConsent } from '../lib/visits';
import { useDialog } from '../lib/useDialog';

/** «الإعدادات»: theme (light / dark / automatic), text size, motion, intro and the statistics choice. */
export const SettingsPanel: React.FC<{ open: boolean; onClose: () => void; onPrivacy: () => void; onInstall?: () => void }> = ({ open, onClose, onPrivacy, onInstall }) => {
  const s = useSettings();
  const [consent, setConsent] = useState(getStatsConsent);
  const dialogRef = useDialog(open, onClose);
  if (!open) return null;

  const themes: { v: ThemeChoice; label: string; icon: React.ReactNode }[] = [
    { v: 'light', label: 'فاتح', icon: <Sun className="w-5 h-5" /> },
    { v: 'dark', label: 'داكن', icon: <Moon className="w-5 h-5" /> },
    { v: 'auto', label: 'تلقائي', icon: <Monitor className="w-5 h-5" /> },
  ];
  const sizes: { v: Settings['fontScale']; label: string }[] = [
    { v: 1, label: 'عادي' },
    { v: 1.1, label: 'كبير' },
    { v: 1.2, label: 'أكبر' },
  ];

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="settings-sheet w-full sm:max-w-md bg-white text-slate-800 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <h2 id="settings-title" className="text-lg font-black text-slate-900">الإعدادات</h2>
          <button onClick={onClose} aria-label="إغلاق" className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 text-sm">
          <section className="space-y-2.5">
            <h3 className="font-black text-slate-900">المظهر</h3>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="المظهر">
              {themes.map((t) => (
                <button
                  key={t.v}
                  role="radio"
                  aria-checked={s.theme === t.v}
                  onClick={() => saveSettings({ theme: t.v })}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 py-3 font-bold cursor-pointer transition ${
                    s.theme === t.v ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-slate-200 text-slate-600 hover:border-emerald-400'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">«تلقائي» يتبع إعداد جهازك (فاتح نهاراً أو داكن حسب نظام الهاتف أو الحاسوب).</p>
          </section>

          <section className="space-y-2.5">
            <h3 className="font-black text-slate-900 flex items-center gap-1.5"><Type className="w-4 h-4" /> حجم الخط</h3>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="حجم الخط">
              {sizes.map((z, i) => (
                <button
                  key={z.v}
                  role="radio"
                  aria-checked={s.fontScale === z.v}
                  onClick={() => saveSettings({ fontScale: z.v })}
                  className={`rounded-2xl border-2 py-2.5 font-black cursor-pointer transition ${
                    s.fontScale === z.v ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-slate-200 text-slate-600 hover:border-emerald-400'
                  }`}
                  style={{ fontSize: `${0.85 + i * 0.12}rem` }}
                >
                  {z.label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-1 divide-y divide-slate-100">
            <Toggle
              icon={<Wind className="w-4 h-4" />}
              label="تقليل الحركة"
              hint="إيقاف الحركات والانتقالات وتبديل الإعلانات التلقائي."
              checked={s.reduceMotion}
              onChange={(v) => saveSettings({ reduceMotion: v })}
            />
            <Toggle
              icon={<Sparkles className="w-4 h-4" />}
              label="المقدمة عند فتح الموقع"
              hint="عرض شاشة «منصة أئمة» الترحيبية عند أول فتح في كل جلسة."
              checked={s.showIntro}
              onChange={(v) => saveSettings({ showIntro: v })}
            />
            <Toggle
              icon={<BarChart3 className="w-4 h-4" />}
              label="إحصاء الزوار المميزين"
              hint={
                <>
                  حفظ رقم عشوائي في متصفحك لعدّ الزوار تقريبياً.{' '}
                  <button onClick={() => { onClose(); onPrivacy(); }} className="underline font-bold text-emerald-800 cursor-pointer">التفاصيل</button>
                </>
              }
              checked={consent === 'yes'}
              onChange={(v) => {
                setStatsConsent(v ? 'yes' : 'no');
                setConsent(v ? 'yes' : 'no');
              }}
            />
          </section>

          {onInstall && (
            <button onClick={onInstall} className="w-full inline-flex items-center justify-center gap-1.5 rounded-2xl bg-brass-100 border border-brass-300 py-3 font-black text-ink cursor-pointer">
              <Smartphone className="w-4 h-4" /> ثبّت منصة أئمة كتطبيق على هاتفك
            </button>
          )}

          <button onClick={resetSettings} className="w-full inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 py-2.5 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">
            <RotateCcw className="w-4 h-4" /> استعادة الإعدادات الافتراضية
          </button>
          <p className="text-[11px] text-slate-400 text-center">تُحفظ هذه الإعدادات في هذا الجهاز فقط.</p>
        </div>
      </div>
    </div>
  );
};

const Toggle: React.FC<{ icon: React.ReactNode; label: string; hint: React.ReactNode; checked: boolean; onChange: (v: boolean) => void }> = ({
  icon,
  label,
  hint,
  checked,
  onChange,
}) => (
  <div className="flex items-start justify-between gap-4 py-3">
    <div className="min-w-0">
      <p className="font-black text-slate-900 flex items-center gap-1.5">{icon} {label}</p>
      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{hint}</p>
    </div>
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 w-12 h-7 rounded-full transition-colors cursor-pointer ${checked ? 'bg-emerald-700' : 'bg-slate-300'}`}
    >
      <span className={`keep-light absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'right-1' : 'right-6'}`} />
    </button>
  </div>
);
