import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, MessageSquareQuote, Pin, Quote } from 'lucide-react';
import { QUESTIONS, submitTestimonial, Testimonial, TESTIMONIAL_MAX, TESTIMONIAL_MIN, TESTIMONIAL_ROLES, TestimonialRole, useTestimonials } from '../lib/testimonials';
import { formatDate } from '../utils/helpers';
import { t } from '../i18n';

const roleLabel = (r: TestimonialRole) => t(TESTIMONIAL_ROLES.find((x) => x.value === r)?.label || '');

/** One opinion: the answers to the questions, then who wrote it (name, short introduction). */
export const TestimonialCard: React.FC<{ item: Testimonial; className?: string }> = ({ item, className = '' }) => {
  const answers = QUESTIONS.filter((q) => (item[q.key] || '').trim());
  return (
    <figure className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col gap-3 h-full ${item.pinned ? 'border-amber-300 ring-2 ring-amber-200' : 'border-slate-200'} ${className}`}>
      <div className="flex items-center justify-between">
        <Quote className="w-6 h-6 text-amber-400 shrink-0" aria-hidden />
        {item.pinned && (
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <Pin className="w-3 h-3" /> {t('رأي مختار')}
          </span>
        )}
      </div>
      <div className="flex-1 space-y-3">
        {answers.map((q) => (
          <div key={q.key}>
            <p className="text-[11px] font-black text-emerald-800">{t(q.label)}</p>
            <blockquote dir="auto" className="text-sm text-slate-700 leading-relaxed whitespace-pre-line [unicode-bidi:plaintext]">{item[q.key]}</blockquote>
          </div>
        ))}
        {!answers.length && item.text && (
          <blockquote dir="auto" className="text-sm text-slate-700 leading-relaxed whitespace-pre-line [unicode-bidi:plaintext]">{item.text}</blockquote>
        )}
      </div>
      <figcaption className="border-t border-slate-100 pt-3 text-xs">
        <span dir="auto" className="block font-black text-slate-900 text-sm">{item.name}</span>
        {item.bio && <span dir="auto" className="block text-[11px] text-slate-500 leading-snug">{item.bio}</span>}
        <span className="block mt-1">
          <span className="text-emerald-800 font-bold">{roleLabel(item.role)}</span>
          {item.city && <span dir="auto" className="text-slate-500"> · {item.city}</span>}
          <span className="text-slate-400"> · {formatDate(item.createdAt)}</span>
        </span>
      </figcaption>
    </figure>
  );
};

/** Home page: all approved opinions (pinned first) in a row that scrolls sideways. */
export const TestimonialsHome: React.FC<{ onOpenTestimonials: () => void }> = ({ onOpenTestimonials }) => {
  const { items } = useTestimonials();
  if (!items.length) return null;
  return (
    <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl sm:text-3xl font-black text-white">{t('ماذا قالوا عن منصة أئمة')}</h2>
        <button type="button" onClick={onOpenTestimonials} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm cursor-pointer">
          <MessageSquareQuote className="w-4 h-4" /> {t('كل الآراء ({n}) — وأضف رأيك', { n: items.length })}
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:thin]">
        {items.map((it) => (
          <div key={it.id} className="snap-start shrink-0 w-[85%] sm:w-[22rem]">
            <TestimonialCard item={it} />
          </div>
        ))}
      </div>
    </section>
  );
};

/** Form: who you are, then the three questions (at least one answered). Saved as pending. */
export const TestimonialForm: React.FC<{ uid?: string | null; defaultName?: string; defaultRole?: TestimonialRole }> = ({ uid, defaultName = '', defaultRole = 'visitor' }) => {
  const [name, setName] = useState(defaultName);
  const [bio, setBio] = useState('');
  const [role, setRole] = useState<TestimonialRole>(defaultRole);
  const [city, setCity] = useState('');
  const [answers, setAnswers] = useState({ idea: '', design: '', suggestions: '' });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const field = 'w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError(t('اكتب اسمك.'));
    if (!Object.values(answers).some((a) => a.trim().length >= TESTIMONIAL_MIN))
      return setError(t('أجب عن سؤال واحد على الأقل ({n} أحرف أو أكثر).', { n: TESTIMONIAL_MIN }));
    setBusy(true);
    setError('');
    try {
      await submitTestimonial({ name, bio, role, city, ...answers, uid });
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
          <button type="button" onClick={() => { setSent(false); setAnswers({ idea: '', design: '', suggestions: '' }); }} className="underline font-bold cursor-pointer">
            {t('إرسال رأي آخر')}
          </button>
        </div>
      </div>
    );

  return (
    <form id="add-opinion" onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 text-slate-800">
      <div>
        <h3 className="font-black text-lg">{t('أضف رأيك في المنصة')}</h3>
        <p className="text-xs text-slate-500">{t('لا يُنشر أي رأي إلا بعد موافقة الإدارة.')}</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="block font-bold mb-1">{t('الاسم *')}</span>
          <input className={field} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="block font-bold mb-1">{t('المسمّى الوظيفي أو تعريف قصير بنفسك')}</span>
          <input className={field} value={bio} maxLength={120} onChange={(e) => setBio(e.target.value)} placeholder={t('مثال: إمام وخطيب مسجد النور بليون')} />
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
      <p className="text-xs text-slate-500">{t('أجب عن سؤال واحد على الأقل:')}</p>
      {QUESTIONS.map((q) => (
        <label key={q.key} className="block text-sm">
          <span className="block font-bold mb-1">{t(q.label)}</span>
          <textarea className={`${field} min-h-24`} value={answers[q.key]} maxLength={TESTIMONIAL_MAX} placeholder={t(q.placeholder)}
            onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))} />
          <span className="block text-[11px] text-slate-400 text-end">{answers[q.key].length}/{TESTIMONIAL_MAX}</span>
        </label>
      ))}
      {error && <p className="text-sm font-bold text-red-700">{error}</p>}
      <button type="submit" disabled={busy}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm cursor-pointer disabled:opacity-60">
        {busy && <Loader2 className="w-4 h-4 animate-spin" />} {t('إرسال الرأي')}
      </button>
    </form>
  );
};

/** Page «What they said about Aemmah»: pinned opinions, then all others, then the form. */
export const TestimonialsPage: React.FC<{ onBack: () => void; uid?: string | null; userName?: string; userRole?: TestimonialRole }> = ({ onBack, uid, userName, userRole }) => {
  const { items, loaded } = useTestimonials();
  const pinned = items.filter((i) => i.pinned);
  const others = items.filter((i) => !i.pinned);
  return (
    <section className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-8">
      <button onClick={onBack} className="text-brass-300 hover:text-brass-200 font-bold text-xs flex items-center gap-1 cursor-pointer">
        <ArrowRight className="w-4 h-4" />
        <span>{t('العودة للرئيسية')}</span>
      </button>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black text-white font-amiri flex items-center gap-2">
            <MessageSquareQuote className="w-8 h-8 text-amber-400" /> {t('ماذا قالوا عن منصة أئمة')}
          </h1>
          <p className="text-sm text-white/70">{t('آراء الأئمة والمساجد والزوار في المنصة.')}</p>
        </div>
        <a href="#add-opinion" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm">
          {t('أضف رأيك')}
        </a>
      </header>

      {loaded && !items.length && <p className="text-sm text-white/70 text-center py-6">{t('لا توجد آراء منشورة بعد. كن أول من يكتب رأيه.')}</p>}
      {pinned.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-black text-amber-300 flex items-center gap-2"><Pin className="w-4 h-4" /> {t('آراء مختارة')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{pinned.map((it) => <TestimonialCard key={it.id} item={it} />)}</div>
        </div>
      )}
      {others.length > 0 && (
        <div className="space-y-3">
          {pinned.length > 0 && <h2 className="text-lg font-black text-white">{t('كل الآراء')}</h2>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{others.map((it) => <TestimonialCard key={it.id} item={it} />)}</div>
        </div>
      )}

      <TestimonialForm uid={uid} defaultName={userName} defaultRole={userRole} />
    </section>
  );
};
