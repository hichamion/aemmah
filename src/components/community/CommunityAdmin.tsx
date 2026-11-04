import React, { useState } from 'react';
import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { CommunitySettings, PostType } from '../../types/community';
import { DEFAULT_TEMPLATES, POST_TYPES, saveCommunitySettings, templateFor } from '../../lib/community';

/** Admin tools of «ملتقى الأئمة»: pause posting, categories, library sections and post templates. */
export const CommunityAdmin: React.FC<{ settings: CommunitySettings; onDone: (m: string) => void; onError: (m: string) => void }> = ({
  settings,
  onDone,
  onError,
}) => {
  const save = async (patch: Partial<CommunitySettings>, msg: string) => {
    try {
      await saveCommunitySettings(patch);
      onDone(msg);
    } catch (e) {
      console.error(e);
      onError('تعذر حفظ الإعدادات.');
    }
  };

  return (
    <div className="space-y-5">
      <section className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3">
        <h2 className="font-black text-slate-900">النشر في الملتقى</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={settings.postingEnabled} className="w-5 h-5 accent-emerald-700"
            onChange={(e) => save({ postingEnabled: e.target.checked }, e.target.checked ? 'تم فتح النشر.' : 'تم إيقاف النشر مؤقتاً.')} />
          <span className="font-bold">{settings.postingEnabled ? 'النشر والتعليق مفتوحان للأئمة المعتمدين' : 'النشر والتعليق موقوفان مؤقتاً (يبقى الاطلاع متاحاً)'}</span>
        </label>
      </section>

      <ListEditor title="تصنيفات المنشورات" items={settings.categories} onSave={(categories) => save({ categories }, 'تم حفظ التصنيفات.')} />
      <ListEditor title="أقسام مكتبة الأئمة" items={settings.libraryCategories} onSave={(libraryCategories) => save({ libraryCategories }, 'تم حفظ أقسام المكتبة.')} />

      <section className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4">
        <div>
          <h2 className="font-black text-slate-900">النماذج الجاهزة</h2>
          <p className="text-xs text-slate-500">يظهر النموذج للإمام عند اختيار نوع المنشور. يمكنك تعديله أو حذفه أو استعادة النموذج الأصلي.</p>
        </div>
        {POST_TYPES.map((t) => (
          <TemplateEditor key={t.value} type={t.value} label={`${t.icon} ${t.label}`} settings={settings}
            onSave={(tpl, msg) => save({ templates: { ...settings.templates, [t.value]: tpl } }, msg)} />
        ))}
      </section>
    </div>
  );
};

const ListEditor: React.FC<{ title: string; items: string[]; onSave: (items: string[]) => void }> = ({ title, items, onSave }) => {
  const [list, setList] = useState(items);
  const [value, setValue] = useState('');
  const changed = JSON.stringify(list) !== JSON.stringify(items);
  return (
    <section className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3">
      <h2 className="font-black text-slate-900">{title}</h2>
      <ul className="flex flex-wrap gap-2">
        {list.map((c, i) => (
          <li key={i} className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-full pr-1 pl-3 py-1">
            <input value={c} maxLength={60} aria-label="اسم التصنيف" onChange={(e) => setList((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
              className="bg-transparent text-sm font-bold text-emerald-900 w-32 px-2 outline-none" />
            <button onClick={() => setList((p) => p.filter((_, j) => j !== i))} aria-label={`حذف ${c}`} className="text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input value={value} maxLength={60} onChange={(e) => setValue(e.target.value)} placeholder="إضافة تصنيف…" className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm" />
        <button onClick={() => { if (value.trim() && !list.includes(value.trim())) setList((p) => [...p, value.trim()]); setValue(''); }}
          className="inline-flex items-center gap-1 bg-slate-100 font-bold px-3 py-2 rounded-xl text-sm cursor-pointer"><Plus className="w-4 h-4" /> إضافة</button>
      </div>
      {changed && (
        <button onClick={() => onSave(list.map((x) => x.trim()).filter(Boolean))} className="inline-flex items-center gap-1.5 bg-emerald-800 text-white font-black px-4 py-2 rounded-full text-sm cursor-pointer">
          <Save className="w-4 h-4" /> حفظ
        </button>
      )}
    </section>
  );
};

const TemplateEditor: React.FC<{
  type: PostType;
  label: string;
  settings: CommunitySettings;
  onSave: (tpl: { title: string; body: string } | null, msg: string) => void;
}> = ({ type, label, settings, onSave }) => {
  const current = templateFor(settings, type);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(current?.title ?? '');
  const [body, setBody] = useState(current?.body ?? '');
  return (
    <div className="border border-slate-200 rounded-2xl">
      <button onClick={() => { setOpen((v) => !v); setTitle(current?.title ?? ''); setBody(current?.body ?? ''); }}
        className="w-full flex justify-between items-center px-4 py-3 font-bold text-sm cursor-pointer">
        <span>{label}</span>
        <span className="text-xs text-slate-500">{current ? (settings.templates?.[type] ? 'معدّل' : 'النموذج الأصلي') : 'محذوف'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          <input value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان النموذج" className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold" />
          <textarea value={body} rows={8} maxLength={10000} onChange={(e) => setBody(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm leading-relaxed" />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onSave({ title, body }, 'تم حفظ النموذج.')} className="inline-flex items-center gap-1.5 bg-emerald-800 text-white font-black px-4 py-2 rounded-full text-xs cursor-pointer"><Save className="w-3.5 h-3.5" /> حفظ</button>
            <button onClick={() => { onSave(null, 'تم حذف النموذج.'); setOpen(false); }} className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 font-bold px-4 py-2 rounded-full text-xs cursor-pointer"><Trash2 className="w-3.5 h-3.5" /> حذف النموذج</button>
            <button onClick={() => { setTitle(DEFAULT_TEMPLATES[type].title); setBody(DEFAULT_TEMPLATES[type].body); }} className="inline-flex items-center gap-1.5 bg-slate-100 font-bold px-4 py-2 rounded-full text-xs cursor-pointer"><RotateCcw className="w-3.5 h-3.5" /> النموذج الأصلي</button>
          </div>
        </div>
      )}
    </div>
  );
};
