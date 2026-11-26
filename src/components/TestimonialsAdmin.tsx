import React, { useState } from 'react';
import { CheckCircle2, Trash2, XCircle } from 'lucide-react';
import { deleteTestimonial, setTestimonialStatus, TESTIMONIAL_ROLES, TestimonialStatus, useTestimonials } from '../lib/testimonials';
import { formatDate } from '../utils/helpers';

/** Admin: opinions about the platform. Nothing is public until approved here. */
export const TestimonialsAdmin: React.FC<{ onToast: (msg: string, kind?: 'success' | 'error') => void }> = ({ onToast }) => {
  const { items, loaded } = useTestimonials(true);
  const [filter, setFilter] = useState<TestimonialStatus>('pending');
  const list = items.filter((i) => i.status === filter);
  const count = (s: TestimonialStatus) => items.filter((i) => i.status === s).length;
  const act = async (fn: () => Promise<void>, msg: string) => {
    try {
      await fn();
      onToast(msg);
    } catch (e) {
      onToast((e as { code?: string })?.code || 'تعذر التنفيذ', 'error');
    }
  };
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
      <div className="border-b pb-3 space-y-1">
        <h3 className="font-black text-base text-slate-900">آراء الزوار والأئمة والمساجد في المنصة</h3>
        <p className="text-xs text-slate-500">لا يظهر أي رأي في صفحة «من نحن» ولا في الرئيسية إلا بعد موافقتك.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {([['pending', '⏳ بانتظار الموافقة'], ['approved', '✅ منشورة'], ['rejected', '✖ مرفوضة']] as const).map(([s, label]) => (
          <button key={s} type="button" onClick={() => setFilter(s)} aria-pressed={filter === s}
            className={`px-3 py-1.5 rounded-full border text-xs font-black cursor-pointer ${filter === s ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-slate-700 border-slate-200'}`}>
            {label} ({count(s)})
          </button>
        ))}
      </div>
      {!loaded ? null : list.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">لا توجد آراء هنا.</p>
      ) : (
        <ul className="space-y-3">
          {list.map((it) => (
            <li key={it.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
              <p className="text-xs text-slate-500">
                <b className="text-slate-900">{it.name}</b> · {TESTIMONIAL_ROLES.find((r) => r.value === it.role)?.label}
                {it.city && ` · ${it.city}`} · {formatDate(it.createdAt)} {it.uid ? '· (مسجّل في المنصة)' : '· (زائر غير مسجّل)'}
              </p>
              <p className="whitespace-pre-line text-slate-800 leading-relaxed [unicode-bidi:plaintext]">{it.text}</p>
              <div className="flex flex-wrap gap-2 justify-end pt-1">
                {it.status !== 'approved' && (
                  <button type="button" onClick={() => act(() => setTestimonialStatus(it.id, 'approved'), 'نُشر الرأي.')}
                    className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3 py-1.5 rounded-xl text-xs cursor-pointer">
                    <CheckCircle2 className="w-3.5 h-3.5" /> موافقة ونشر
                  </button>
                )}
                {it.status !== 'rejected' && (
                  <button type="button" onClick={() => act(() => setTestimonialStatus(it.id, 'rejected'), it.status === 'approved' ? 'أُخفي الرأي.' : 'رُفض الرأي.')}
                    className="inline-flex items-center gap-1 bg-white border border-slate-300 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer">
                    <XCircle className="w-3.5 h-3.5" /> {it.status === 'approved' ? 'إخفاء' : 'رفض'}
                  </button>
                )}
                <button type="button" onClick={() => window.confirm('حذف هذا الرأي نهائياً؟') && act(() => deleteTestimonial(it.id), 'حُذف الرأي.')}
                  className="inline-flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" /> حذف
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
