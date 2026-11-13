import React from 'react';
import { BarChart3, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { useVisitStats } from '../lib/visits';

const fmt = (n: number) => n.toLocaleString('ar');

/** Admin only: anonymous visit counts (firestore.rules lets only admins read them). */
export const VisitStatsPanel: React.FC = () => {
  const { stats, error, reload } = useVisitStats(true);

  if (error)
    return (
      <p role="alert" className="bg-red-50 border border-red-200 text-red-800 font-bold rounded-2xl p-4 text-sm">
        تعذر تحميل إحصاءات الزيارات ({error}). إن كان الرمز permission-denied فانشر قواعد الأمان الجديدة.
      </p>
    );
  if (!stats)
    return (
      <p className="text-center text-slate-500 py-10 flex items-center justify-center gap-2 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> جاري حساب الإحصاءات…
      </p>
    );

  const max = Math.max(1, ...stats.daily.map((d) => d.count));
  const tiles: [string, number, string][] = [
    ['إجمالي الزيارات', stats.visits.total, 'منذ تفعيل الإحصاء'],
    ['زوار مميزون (تقريبي)', stats.visitors.total, 'من وافقوا على الإحصاء'],
    ['زيارات آخر 7 أيام', stats.visits.d7, `${fmt(stats.visitors.d7)} زائر جديد`],
    ['زيارات آخر 30 يوماً', stats.visits.d30, `${fmt(stats.visitors.d30)} زائر جديد`],
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-700" /> إحصاءات الزيارات
        </h3>
        <button onClick={reload} className="inline-flex items-center gap-1.5 text-xs font-bold bg-white border border-slate-200 px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-50">
          <RefreshCw className="w-3.5 h-3.5" /> تحديث
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map(([label, value, hint]) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-500">{label}</p>
            <p className="text-3xl font-black text-slate-900 tabular-nums mt-1">{fmt(value)}</p>
            <p className="text-[11px] text-slate-400 mt-1">{hint}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-black text-slate-800">الزيارات اليومية — آخر 14 يوماً (اليوم: {fmt(stats.visits.today)})</p>
        <div className="flex items-end gap-1.5 h-40" role="img" aria-label="رسم الزيارات اليومية">
          {stats.daily.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center justify-end gap-1 h-full min-w-0" title={`${d.day}: ${d.count}`}>
              <span className="text-[10px] text-slate-500 tabular-nums">{d.count || ''}</span>
              <div className="w-full rounded-t-md bg-emerald-600/80" style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count ? 4 : 1 }} />
              <span className="text-[9px] text-slate-400 tabular-nums" dir="ltr">{d.day.slice(8)}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed flex gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
        <span>
          تُحصى كل فتحة جديدة للموقع (لا يُحتسب تحديث الصفحة ولا الرجوع للخلف) دون حفظ أي بيانات شخصية أو عنوان IP. عدد «الزوار المميزين»
          تقريبي ويشمل فقط من وافق على حفظ رقم عشوائي في متصفحه، لذلك يكون أقل من العدد الحقيقي. لا يمكن لأحد غير الإدارة الاطلاع على هذه الأرقام.
        </span>
      </p>
    </div>
  );
};
