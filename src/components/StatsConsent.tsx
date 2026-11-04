import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { getStatsConsent, setStatsConsent } from '../lib/visits';

/** One-time, small question (TDDDG § 25): may we keep a random number in this browser for unique-visitor counts? */
export const StatsConsent: React.FC<{ onPrivacy: () => void }> = ({ onPrivacy }) => {
  const [show, setShow] = useState(() => getStatsConsent() === null);
  if (!show) return null;
  const choose = (v: 'yes' | 'no') => {
    setStatsConsent(v);
    setShow(false);
  };
  return (
    <div role="region" aria-label="إحصاء الزوار"
      className="fixed z-40 bottom-20 lg:bottom-4 inset-x-3 sm:inset-x-auto sm:left-4 sm:max-w-sm bg-white/95 backdrop-blur border border-slate-200 shadow-xl rounded-2xl p-3.5 text-xs text-slate-600 space-y-2.5">
      <p className="leading-relaxed flex gap-2">
        <BarChart3 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <span>
          نحصي عدد الزيارات دون أي بيانات شخصية. هل تسمح بحفظ رقم عشوائي في متصفحك لمعرفة عدد الزوار المميزين تقريبياً؟{' '}
          <button onClick={onPrivacy} className="underline font-bold text-emerald-800 cursor-pointer">التفاصيل</button>
        </span>
      </p>
      <div className="flex gap-2 justify-end">
        <button onClick={() => choose('no')} className="px-3 py-1.5 rounded-full border border-slate-300 font-bold cursor-pointer hover:bg-slate-50">لا، شكراً</button>
        <button onClick={() => choose('yes')} className="px-3 py-1.5 rounded-full bg-emerald-800 text-white font-black cursor-pointer hover:bg-emerald-700">موافق</button>
      </div>
    </div>
  );
};
