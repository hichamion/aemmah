import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ImamCertificate, ImamExperience, ImamLanguage, PreferredLocation } from '../types';
import { EUROPEAN_COUNTRIES, LANGUAGE_LEVELS, LANGUAGE_OPTIONS } from '../utils/helpers';

/*
 * Repeatable parts of the imam form (no fixed number of entries): positions held, certificates,
 * preferred countries in Europe and languages with a level. All optional.
 */

const input =
  'w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500';
const addBtn =
  'inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold px-3.5 py-2 rounded-xl text-xs cursor-pointer';
const delBtn = 'shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-xl cursor-pointer';

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 60 }, (_, i) => String(THIS_YEAR - i));

function update<T>(list: T[], i: number, patch: Partial<T>): T[] {
  return list.map((x, j) => (j === i ? { ...x, ...patch } : x));
}

// ---------------------------------------------------------------------------

export const ExperienceEditor: React.FC<{ value: ImamExperience[]; onChange: (v: ImamExperience[]) => void }> = ({
  value,
  onChange,
}) => (
  <div className="space-y-2">
    {value.map((e, i) => (
      <div key={i} className="bg-white border border-slate-200 rounded-2xl p-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
        <label className="md:col-span-4 space-y-1">
          <span className="text-xs font-bold text-slate-600">الوظيفة / المهمة</span>
          <input className={input} maxLength={100} value={e.title} placeholder="مثال: إمام وخطيب"
            onChange={(ev) => onChange(update(value, i, { title: ev.target.value }))} />
        </label>
        <label className="md:col-span-3 space-y-1">
          <span className="text-xs font-bold text-slate-600">المسجد / الجهة والمدينة</span>
          <input className={input} maxLength={120} value={e.place} placeholder="مثال: مسجد النور، ليون"
            onChange={(ev) => onChange(update(value, i, { place: ev.target.value }))} />
        </label>
        <label className="md:col-span-2 space-y-1">
          <span className="text-xs font-bold text-slate-600">من سنة</span>
          <select className={input} value={e.from} onChange={(ev) => onChange(update(value, i, { from: ev.target.value }))}>
            <option value="">—</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label className="md:col-span-3 space-y-1">
          <span className="text-xs font-bold text-slate-600">إلى سنة</span>
          <div className="flex gap-1">
            <select className={input} value={e.to} onChange={(ev) => onChange(update(value, i, { to: ev.target.value }))}>
              <option value="">حتى الآن</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button type="button" aria-label="حذف هذه الوظيفة" className={delBtn} onClick={() => onChange(value.filter((_, j) => j !== i))}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </label>
      </div>
    ))}
    {value.length < 30 && (
      <button type="button" className={addBtn} onClick={() => onChange([...value, { title: '', place: '', from: '', to: '' }])}>
        <Plus className="w-4 h-4" /> إضافة وظيفة أو مهمة
      </button>
    )}
  </div>
);

// ---------------------------------------------------------------------------

export const CertificateEditor: React.FC<{ value: ImamCertificate[]; onChange: (v: ImamCertificate[]) => void }> = ({
  value,
  onChange,
}) => (
  <div className="space-y-2">
    {value.map((c, i) => (
      <div key={i} className="bg-white border border-slate-200 rounded-2xl p-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
        <label className="md:col-span-5 space-y-1">
          <span className="text-xs font-bold text-slate-600">الشهادة / الإجازة</span>
          <input className={input} maxLength={150} value={c.name} placeholder="مثال: إجازة برواية ورش بالسند"
            onChange={(ev) => onChange(update(value, i, { name: ev.target.value }))} />
        </label>
        <label className="md:col-span-4 space-y-1">
          <span className="text-xs font-bold text-slate-600">الجهة المانحة / الشيخ</span>
          <input className={input} maxLength={150} value={c.issuer} placeholder="مثال: معهد محمد السادس للقراءات"
            onChange={(ev) => onChange(update(value, i, { issuer: ev.target.value }))} />
        </label>
        <label className="md:col-span-3 space-y-1">
          <span className="text-xs font-bold text-slate-600">السنة</span>
          <div className="flex gap-1">
            <select className={input} value={c.year} onChange={(ev) => onChange(update(value, i, { year: ev.target.value }))}>
              <option value="">—</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button type="button" aria-label="حذف هذه الشهادة" className={delBtn} onClick={() => onChange(value.filter((_, j) => j !== i))}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </label>
      </div>
    ))}
    {value.length < 30 && (
      <button type="button" className={addBtn} onClick={() => onChange([...value, { name: '', issuer: '', year: '' }])}>
        <Plus className="w-4 h-4" /> إضافة شهادة أو إجازة
      </button>
    )}
  </div>
);

// ---------------------------------------------------------------------------

export const PreferredLocationsEditor: React.FC<{ value: PreferredLocation[]; onChange: (v: PreferredLocation[]) => void }> = ({
  value,
  onChange,
}) => {
  const selected = new Set(value.map((l) => l.country));
  const toggle = (country: string) =>
    onChange(selected.has(country) ? value.filter((l) => l.country !== country) : [...value, { country, area: '' }]);
  const [other, setOther] = React.useState('');
  const addOther = () => {
    const c = other.trim();
    if (c && !selected.has(c)) onChange([...value, { country: c.slice(0, 60), area: '' }]);
    setOther('');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {EUROPEAN_COUNTRIES.map((c) => {
          const on = selected.has(c);
          return (
            <button key={c} type="button" aria-pressed={on} onClick={() => toggle(c)}
              className={`px-3 py-1.5 rounded-full border-2 font-bold text-xs transition cursor-pointer ${
                on ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-400'
              }`}>
              {on ? '✓ ' : ''}{c}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input className={input} maxLength={60} value={other} placeholder="دولة أخرى… (اكتبها ثم اضغط إضافة)"
          onChange={(e) => setOther(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOther(); } }} />
        <button type="button" className={addBtn} onClick={addOther}><Plus className="w-4 h-4" /> إضافة</button>
      </div>
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((l, i) => (
            <div key={l.country} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2">
              <span className="font-black text-emerald-900 text-sm w-32 shrink-0">{l.country}</span>
              <input className={input} maxLength={100} value={l.area}
                placeholder="المدينة أو المنطقة (اختياري — اتركه فارغاً لأي مكان في الدولة)"
                onChange={(e) => onChange(update(value, i, { area: e.target.value }))} />
              <button type="button" aria-label={`حذف ${l.country}`} className={delBtn} onClick={() => onChange(value.filter((_, j) => j !== i))}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------

export const LanguagesEditor: React.FC<{ value: ImamLanguage[]; onChange: (v: ImamLanguage[]) => void }> = ({ value, onChange }) => (
  <div className="space-y-2">
    <datalist id="lang-suggestions">
      {LANGUAGE_OPTIONS.map((l) => <option key={l} value={l} />)}
    </datalist>
    {value.map((l, i) => (
      <div key={i} className="grid grid-cols-[minmax(0,1fr)_9.5rem_auto] items-center gap-2">
        <input className={input} list="lang-suggestions" maxLength={40} value={l.name} placeholder="اللغة، مثل: الفرنسية"
          aria-label="اللغة" onChange={(e) => onChange(update(value, i, { name: e.target.value }))} />
        <select className={input} aria-label="المستوى" value={l.level}
          onChange={(e) => onChange(update(value, i, { level: e.target.value as ImamLanguage['level'] }))}>
          {LANGUAGE_LEVELS.map((lv) => <option key={lv.value} value={lv.value}>{lv.label}</option>)}
        </select>
        <button type="button" aria-label="حذف هذه اللغة" className={delBtn} onClick={() => onChange(value.filter((_, j) => j !== i))}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    ))}
    {value.length < 20 && (
      <button type="button" className={addBtn} onClick={() => onChange([...value, { name: '', level: 'good' }])}>
        <Plus className="w-4 h-4" /> إضافة لغة
      </button>
    )}
  </div>
);
