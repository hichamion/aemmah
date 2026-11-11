import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Edit3, ImagePlus, Loader2, Megaphone, Plus, Save, Trash2, X } from 'lucide-react';
import {
  Announcement,
  AnnouncementInput,
  createAnnouncement,
  deleteAnnouncement,
  reorderAnnouncements,
  setShowDefaultSlides,
  TARGETS,
  updateAnnouncement,
  useAnnouncements,
} from '../lib/announcements';
import { compressImage } from '../lib/image';

const EMPTY: AnnouncementInput = { chip: '', title: '', text: '', cta: '', target: 'imams', url: '', image: '', order: 0, active: true };

/** «إعلانات الواجهة»: the admin writes, orders, hides and deletes the slides of the home banner. */
export const AnnouncementsAdmin: React.FC<{ onDone: (m: string) => void; onError: (m: string) => void }> = ({ onDone, onError }) => {
  const { items, showDefaults } = useAnnouncements();
  const [editing, setEditing] = useState<{ id: string | null; data: AnnouncementInput } | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      onDone(ok);
    } catch (e) {
      console.error(e);
      onError('تعذر الحفظ. إن كان الخطأ متعلقاً بالصلاحيات فتأكد من نشر قواعد الأمان الجديدة.');
    } finally {
      setBusy(false);
    }
  };

  const move = (i: number, d: -1 | 1) => {
    const ids = items.map((x) => x.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    run(() => reorderAnnouncements(ids), 'تم تغيير الترتيب.');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2"><Megaphone className="w-5 h-5 text-emerald-700" /> إعلانات الواجهة</h3>
          <p className="text-xs text-slate-500">ما تكتبه هنا يظهر في البانر المتحرك أعلى الصفحة الرئيسية، بالترتيب الذي تختاره.</p>
        </div>
        <button onClick={() => setEditing({ id: null, data: { ...EMPTY, order: items.length } })}
          className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-full text-sm cursor-pointer">
          <Plus className="w-4 h-4" /> إعلان جديد
        </button>
      </div>

      <label className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-4 cursor-pointer">
        <input type="checkbox" className="w-5 h-5 accent-emerald-700" checked={showDefaults} disabled={busy}
          onChange={(e) => run(() => setShowDefaultSlides(e.target.checked), e.target.checked ? 'ستظهر الشرائح الافتراضية بعد إعلاناتك.' : 'أُخفيت الشرائح الافتراضية.')} />
        <span className="text-sm font-bold text-slate-700">
          إظهار الشرائح الافتراضية للمنصة (مساجد تبحث عن أئمة، ملتقى الأئمة…) بعد إعلاناتك
        </span>
      </label>

      {items.length === 0 && (
        <p className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-sm text-slate-500">
          لا توجد إعلانات بعد. تظهر الآن الشرائح الافتراضية فقط.
        </p>
      )}

      <ul className="space-y-3">
        {items.map((a, i) => (
          <li key={a.id} className={`bg-white border rounded-2xl p-3 flex items-center gap-3 ${a.active ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-70'}`}>
            <Thumb a={a} />
            <div className="flex-1 min-w-0">
              <p className="font-black text-slate-900 truncate">{a.title}</p>
              <p className="text-xs text-slate-500 truncate">{a.chip && `${a.chip} · `}{TARGETS.find((t) => t.value === a.target)?.label}{a.active ? '' : ' · مخفي'}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => move(i, -1)} disabled={busy || i === 0} aria-label="إلى الأعلى" className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center disabled:opacity-30 cursor-pointer"><ArrowUp className="w-4 h-4" /></button>
              <button onClick={() => move(i, 1)} disabled={busy || i === items.length - 1} aria-label="إلى الأسفل" className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center disabled:opacity-30 cursor-pointer"><ArrowDown className="w-4 h-4" /></button>
              <button onClick={() => run(() => updateAnnouncement(a.id, { active: !a.active }), a.active ? 'أُخفي الإعلان.' : 'أُظهر الإعلان.')} disabled={busy}
                className={`text-xs font-black px-3 py-2 rounded-full cursor-pointer ${a.active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {a.active ? 'ظاهر' : 'مخفي'}
              </button>
              <button onClick={() => { const { id, createdAt, updatedAt, ...data } = a; void createdAt; void updatedAt; setEditing({ id, data }); }}
                aria-label="تعديل" className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer"><Edit3 className="w-4 h-4" /></button>
              <button onClick={() => window.confirm('حذف هذا الإعلان نهائياً؟') && run(() => deleteAnnouncement(a.id), 'تم حذف الإعلان.')} disabled={busy}
                aria-label="حذف" className="w-9 h-9 rounded-full hover:bg-red-50 text-red-700 flex items-center justify-center cursor-pointer"><Trash2 className="w-4 h-4" /></button>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <Editor
          initial={editing.data}
          isNew={!editing.id}
          busy={busy}
          onCancel={() => setEditing(null)}
          onError={onError}
          onSave={(data) =>
            run(async () => {
              if (editing.id) await updateAnnouncement(editing.id, data);
              else await createAnnouncement(data);
              setEditing(null);
            }, editing.id ? 'تم حفظ الإعلان.' : 'تم نشر الإعلان في الواجهة.')
          }
        />
      )}
    </div>
  );
};

const Thumb: React.FC<{ a: Pick<Announcement, 'image' | 'title'> }> = ({ a }) =>
  a.image ? (
    <img src={a.image} alt="" className="w-20 h-12 rounded-xl object-cover shrink-0" />
  ) : (
    <span className="w-20 h-12 rounded-xl shrink-0 home-hero" aria-hidden />
  );

const Editor: React.FC<{
  initial: AnnouncementInput;
  isNew: boolean;
  busy: boolean;
  onSave: (d: AnnouncementInput) => void;
  onCancel: () => void;
  onError: (m: string) => void;
}> = ({ initial, isNew, busy, onSave, onCancel, onError }) => {
  const [d, setD] = useState(initial);
  const [imgBusy, setImgBusy] = useState(false);
  const set = <K extends keyof AnnouncementInput>(k: K, v: AnnouncementInput[K]) => setD((p) => ({ ...p, [k]: v }));
  const field = 'w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white';
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setImgBusy(true);
    try {
      set('image', await compressImage(f, 1600, 400_000));
    } catch (err) {
      onError(err instanceof Error ? err.message : 'تعذر معالجة الصورة.');
    } finally {
      setImgBusy(false);
    }
  };
  const problem = !d.title.trim()
    ? 'اكتب عنوان الإعلان.'
    : d.target === 'url' && !/^https:\/\/.+/.test(d.url.trim())
    ? 'الرابط الخارجي يجب أن يبدأ بـ https://'
    : d.target !== 'none' && !d.cta.trim()
    ? 'اكتب نص الزر (مثلاً: سجّل الآن).'
    : '';

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onCancel}>
      <div role="dialog" aria-modal="true" aria-label={isNew ? 'إعلان جديد' : 'تعديل الإعلان'} onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-xl bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-black text-lg">{isNew ? 'إعلان جديد في الواجهة' : 'تعديل الإعلان'}</h2>
          <button onClick={onCancel} aria-label="إغلاق" className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-3 text-sm">
          {/* live preview, as on the home page */}
          <div className="relative h-40 rounded-2xl overflow-hidden ring-1 ring-black/10">
            {d.image ? <img src={d.image} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 home-hero" />}
            <div className="absolute inset-0 bg-gradient-to-l from-ink/90 via-ink/60 to-ink/0" />
            <div className="relative h-full flex flex-col justify-center items-start gap-1.5 px-4 max-w-[80%] text-white">
              {d.chip && <span className="liquid-glass rounded-full px-2.5 py-0.5 text-[10px] font-bold text-brass-200">{d.chip}</span>}
              <p className="font-kufi text-lg leading-snug">{d.title || 'عنوان الإعلان'}</p>
              {d.text && <p className="text-[11px] text-white/85 line-clamp-2">{d.text}</p>}
              {d.target !== 'none' && <span className="mt-0.5 bg-gradient-to-l from-brass-300 to-brass-500 text-ink text-[11px] font-black px-3 py-1 rounded-full">{d.cta || 'نص الزر'}</span>}
            </div>
          </div>

          <label className="block"><span className="font-bold text-slate-700">العنوان *</span>
            <input className={field} maxLength={80} value={d.title} onChange={(e) => set('title', e.target.value)} placeholder="مثلاً: الدورة التأهيلية للأئمة والخطباء" /></label>
          <label className="block"><span className="font-bold text-slate-700">نص قصير</span>
            <textarea className={field} maxLength={220} rows={2} value={d.text} onChange={(e) => set('text', e.target.value)} placeholder="سطر أو سطران يوضحان الإعلان" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="font-bold text-slate-700">شارة صغيرة</span>
              <input className={field} maxLength={40} value={d.chip} onChange={(e) => set('chip', e.target.value)} placeholder="جديد / رمضان…" /></label>
            <label className="block"><span className="font-bold text-slate-700">نص الزر</span>
              <input className={field} maxLength={30} value={d.cta} onChange={(e) => set('cta', e.target.value)} placeholder="سجّل الآن" disabled={d.target === 'none'} /></label>
          </div>
          <label className="block"><span className="font-bold text-slate-700">الزر يفتح</span>
            <select className={field} value={d.target} onChange={(e) => set('target', e.target.value as AnnouncementInput['target'])}>
              {TARGETS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select></label>
          {d.target === 'url' && (
            <label className="block"><span className="font-bold text-slate-700">الرابط</span>
              <input className={field} dir="ltr" maxLength={300} value={d.url} onChange={(e) => set('url', e.target.value)} placeholder="https://…" /></label>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 font-bold px-4 py-2.5 rounded-full cursor-pointer">
              {imgBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />} {d.image ? 'تغيير الصورة' : 'إضافة صورة'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pick} />
            </label>
            {d.image && <button onClick={() => set('image', '')} className="text-red-700 font-bold px-3 py-2 cursor-pointer">إزالة الصورة</button>}
            <span className="text-xs text-slate-500">بدون صورة تظهر الزخرفة الأندلسية.</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-5 h-5 accent-emerald-700" checked={d.active} onChange={(e) => set('active', e.target.checked)} />
            <span className="font-bold text-slate-700">ظاهر في الواجهة</span>
          </label>

          {problem && <p className="text-xs font-bold text-amber-700">{problem}</p>}
          <div className="flex gap-2 pt-2">
            <button onClick={() => onSave({ ...d, title: d.title.trim(), text: d.text.trim(), chip: d.chip.trim(), cta: d.target === 'none' ? '' : d.cta.trim(), url: d.target === 'url' ? d.url.trim() : '' })}
              disabled={busy || imgBusy || !!problem}
              className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-full cursor-pointer disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {isNew ? 'نشر الإعلان' : 'حفظ'}
            </button>
            <button onClick={onCancel} className="px-5 py-3 rounded-full border border-slate-300 font-bold cursor-pointer">إلغاء</button>
          </div>
        </div>
      </div>
    </div>
  );
};
