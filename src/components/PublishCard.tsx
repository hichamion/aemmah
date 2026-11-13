import React from 'react';
import { CheckCircle2, Clock, EyeOff, Megaphone, XCircle } from 'lucide-react';

export type PublishState = 'none' | 'unpublished' | 'pending' | 'published' | 'rejected';

const LOOK: Record<PublishState, { icon: React.ReactNode; ring: string; title: string }> = {
  none: { icon: <Megaphone className="w-7 h-7" />, ring: 'from-brass-300 to-brass-600 text-ink', title: '' },
  unpublished: { icon: <EyeOff className="w-7 h-7" />, ring: 'from-slate-300 to-slate-500 text-white', title: 'غير منشور حالياً' },
  pending: { icon: <Clock className="w-7 h-7" />, ring: 'from-amber-300 to-amber-600 text-white', title: 'أُرسل للنشر — بانتظار موافقة الإدارة' },
  published: { icon: <CheckCircle2 className="w-7 h-7" />, ring: 'from-emerald-400 to-emerald-700 text-white', title: 'منشور' },
  rejected: { icon: <XCircle className="w-7 h-7" />, ring: 'from-red-400 to-red-700 text-white', title: 'لم توافق الإدارة على النشر' },
};

/**
 * «Is my profile / ad published?» — one clear card with the state and one big action
 * (publish, or pause publishing), shown at the top of the imam's / mosque's own page.
 */
export const PublishCard: React.FC<{
  state: PublishState;
  /** Title for «none» / «published» (e.g. «ملفك منشور للمساجد»). */
  title?: string;
  text: string;
  action?: { label: string; onClick: () => void; primary?: boolean };
  secondary?: { label: string; onClick: () => void };
}> = ({ state, title, text, action, secondary }) => {
  const look = LOOK[state];
  return (
    <section className={`rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 border ${
      state === 'published' ? 'bg-emerald-50 border-emerald-200' : state === 'none' ? 'bg-gradient-to-l from-brass-100 to-white border-brass-300' : 'bg-white border-slate-200'
    }`}>
      <span className={`w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br ${look.ring} flex items-center justify-center shadow-md`}>{look.icon}</span>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-black text-slate-900">{title || look.title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        {action && (
          <button onClick={action.onClick}
            className={`inline-flex items-center justify-center gap-2 font-black px-5 py-3 rounded-full cursor-pointer transition shadow-md ${
              action.primary === false ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-gradient-to-l from-brass-300 to-brass-500 text-ink hover:brightness-105'
            }`}>
            <Megaphone className="w-4 h-4" /> {action.label}
          </button>
        )}
        {secondary && (
          <button onClick={secondary.onClick} className="inline-flex items-center gap-1.5 font-bold px-4 py-3 rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">
            {secondary.label}
          </button>
        )}
      </div>
    </section>
  );
};
