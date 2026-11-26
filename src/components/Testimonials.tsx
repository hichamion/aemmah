import React, { useState } from 'react';
import { CheckCircle2, Loader2, MessageSquareQuote, Quote } from 'lucide-react';
import { submitTestimonial, Testimonial, TESTIMONIAL_MAX, TESTIMONIAL_MIN, TESTIMONIAL_ROLES, TestimonialRole, useTestimonials } from '../lib/testimonials';
import { formatDate } from '../utils/helpers';
import { t } from '../i18n';

const roleLabel = (r: TestimonialRole) => t(TESTIMONIAL_ROLES.find((x) => x.value === r)?.label || '');

export const TestimonialCard: React.FC<{ item: Testimonial }> = ({ item }) => (
  <figure className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col gap-3 h-full">
    <Quote className="w-6 h-6 text-amber-400 shrink-0" aria-hidden />
    <blockquote dir="auto" className="text-sm text-slate-700 leading-relaxed whitespace-pre-line flex-1 [unicode-bidi:plaintext]">{item.text}</blockquote>
    <figcaption className="border-t border-slate-100 pt-3 text-xs">
      <span dir="auto" className="block font-black text-slate-900">{item.name}</span>
      <span className="text-emerald-800 font-bold">{roleLabel(item.role)}</span>
      {item.city && <span dir="auto" className="text-slate-500"> · {item.city}</span>}
      <span className="text-slate-400"> · {formatDate(item.createdAt)}</span>
    </figcaption>
  </figure>
);

/** Approved opinions. `limit` shows only the newest ones (home page). */
export const TestimonialsList: React.FC<{ limit?: number; emptyText?: string }> = ({ limit, emptyText }) => {
  const { items, loaded } = useTestimonials();
  if (!loaded) return null;
  if (!items.length) return emptyText ? <p className="text-sm text-slate-500 text-center py-6">{emptyText}</p> : null;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {(limit ? items.slice(0, limit) : items).map((it) => <TestimonialCard key={it.id} item={it} />)}
    </div>
  );
};

/** Home page block: shown only when there is at least one approved opinion. */
export const TestimonialsHome: React.FC<{ onOpenAbout: () => void }> = ({ onOpenAbout }) => {
  const { items } = useTestimonials();
  if (!items.length) return null;
  return (
    <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <h2 className="text-2xl sm:text-3xl font-black text-white text-center">{t('ماذا قالوا عن منصة أئمة')}</h2>
      <TestimonialsList limit={3} />
      <div className="text-center">
        <button type="button" onClick={onOpenAbout} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm cursor-pointer">
          <MessageSquareQuote className="w-4 h-4" /> {t('كل الآراء — وأضف رأيك')}
        </button>
      </div>
    </section>
  );
};

/** Form to send an opinion (saved as pending until the team approves it). */
export const TestimonialForm: React.FC<{ uid?: string | null; defaultName?: string; defaultRole?: TestimonialRole }> = ({ uid, defaultName = '', defaultRole = 'visitor' }) => {
  const [name, setName] = useState(defaultName);
  const [role, setRole] = useState<TestimonialRole>(defaultRole);
  const [city, setCity] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const field = 'w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError(t('اكتب اسمك.'));
    if (text.trim().length < TESTIMONIAL_MIN) return setError(t('اكتب رأيك في {n} حرفاً على الأقل.', { n: TESTIMONIAL_MIN }));
    setBusy(true);
    setError('');
    try {
      await submitTestimonial({ name, role, city, text, uid });
      setSent(true);
    } catch {
      setError(t('تعذر الإرسال. حاول مرة أخرى.'));
    } finally {
      setBusy(false);
    }
  };

  if (sent)
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-900 text-sm flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="font-black">{t('جزاك الله خيراً، وصل رأيك.')}</p>
          <p>{t('سيظهر رأيك على المنصة بعد أن تراجعه الإدارة وتوافق عليه.')}</p>
          <button type="button" onClick={() => { setSent(false); setText(''); }} className="underline font-bold cursor-pointer">{t('إرسال رأي آخر')}</button>
        </div>
      </div>
    );

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 text-slate-800">
      <h3 className="font-black text-lg">{t('أضف رأيك في المنصة')}</h3>
      <p className="text-xs text-slate-500">{t('لا يُنشر أي رأي إلا بعد موافقة الإدارة.')}</p>
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="block text-sm">
          <span className="block font-bold mb-1">{t('الاسم *')}</span>
          <input className={field} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="block font-bold mb-1">{t('الصفة')}</span>
          <select className={field} value={role} onChange={(e) => setRole(e.target.value as TestimonialRole)}>
            {TESTIMONIAL_ROLES.map((r) => <option key={r.value} value={r.value}>{t(r.label)}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="block font-bold mb-1">{t('المدينة أو البلد (اختياري)')}</span>
          <input className={field} value={city} maxLength={80} onChange={(e) => setCity(e.target.value)} />
        </label>
      </div>
      <label className="block text-sm">
        <span className="block font-bold mb-1">{t('رأيك *')}</span>
        <textarea className={`${field} min-h-28`} value={text} maxLength={TESTIMONIAL_MAX} onChange={(e) => setText(e.target.value)}
          placeholder={t('ما الذي أعجبك في المنصة؟ وكيف أفادتك؟')} />
        <span className="block text-xs text-slate-400 text-end">{text.length}/{TESTIMONIAL_MAX}</span>
      </label>
      {error && <p className="text-sm font-bold text-red-700">{error}</p>}
      <button type="submit" disabled={busy}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm cursor-pointer disabled:opacity-60">
        {busy && <Loader2 className="w-4 h-4 animate-spin" />} {t('إرسال الرأي')}
      </button>
    </form>
  );
};
