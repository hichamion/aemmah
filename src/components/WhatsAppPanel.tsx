import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { CheckCircle2, ExternalLink, Loader2, MessageCircle, Search, Send } from 'lucide-react';
import { db } from '../firebase';
import { ImamContact, ImamProfile } from '../types';
import { imamRole, isKhateeb } from '../utils/helpers';
import { countryFromText, DIAL_COUNTRIES, isInternationalPhone, toInternational } from '../utils/phone';

/** Countries for the admin's choice, Morocco and Europe first, names in Arabic. */
const countryOptions: [string, string, string][] = (() => {
  let dn: Intl.DisplayNames | null = null;
  try {
    dn = new Intl.DisplayNames(['ar'], { type: 'region' });
  } catch {
    dn = null;
  }
  const first = ['MA', 'ES', 'IT', 'FR', 'DE', 'BE', 'NL', 'DZ', 'TN', 'EG', 'GB'];
  const all = DIAL_COUNTRIES.map(([iso, code]) => [iso, code, (dn?.of(iso) as string) || iso] as [string, string, string]);
  return [...first.map((f) => all.find((a) => a[0] === f)!), ...all.filter((a) => !first.includes(a[0]))];
})();

/*
 * Admin: WhatsApp messages to imams (thanks, reminders, notices) using the numbers they entered.
 * WhatsApp does not allow a website to send messages by itself (only the paid WhatsApp Business API,
 * with a server and approved templates, can). So each message opens WhatsApp with the text ready,
 * addressed to the imam, and the admin presses «send». The panel keeps track of who was sent to.
 */

const TEMPLATES: { label: string; text: string }[] = [
  { label: 'شكر', text: 'السلام عليكم ورحمة الله الشيخ {الاسم}،\nنشكركم على تسجيلكم في منصة أئمة، ونسأل الله أن يبارك فيكم وفي جهودكم.\nإدارة منصة أئمة — aemmah.com' },
  { label: 'تحديث الملف', text: 'السلام عليكم ورحمة الله الشيخ {الاسم}،\nنرجو منكم مراجعة ملفكم على منصة أئمة وتحديثه (حالة التفرغ، عيّنة التلاوة، السيرة)، ليصل إلى المساجد بأفضل صورة.\naemmah.com' },
  { label: 'تذكير رمضان', text: 'السلام عليكم ورحمة الله الشيخ {الاسم}،\nرمضان على الأبواب، والمساجد تبحث عن أئمة للتراويح. حدّثوا حالة تفرغكم على منصة أئمة حتى تصلكم الطلبات.\naemmah.com' },
];

/** International number in digits for wa.me (e.g. «+49 151 234» → «49151234»). */
export function waNumber(raw: string): string {
  let d = (raw || '').replace(/[^\d+]/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  return d.replace(/\D/g, '');
}

const SENT_KEY = 'aemmah-wa-sent';

type Filter = 'all' | 'approved' | 'khateeb' | 'tarawih' | 'europe';

export const WhatsAppPanel: React.FC<{ imams: ImamProfile[] }> = ({ imams }) => {
  const [contacts, setContacts] = useState<Record<string, ImamContact> | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('approved');
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [text, setText] = useState(TEMPLATES[0].text);
  const [sent, setSent] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem(SENT_KEY) || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    getDocs(collection(db, 'imamContacts'))
      .then((snap) => {
        const m: Record<string, ImamContact> = {};
        snap.docs.forEach((d) => (m[d.id] = d.data() as ImamContact));
        setContacts(m);
      })
      .catch((e) => setError(e?.code || e?.message || 'تعذر تحميل الأرقام.'));
  }, []);

  // Numbers typed without the country code get the code of the imam's country of residence.
  // For imams whose country cannot be read from their profile, the admin picks it (Morocco by default).
  const [manualIso, setManualIso] = useState<Record<string, string>>({});
  const isoOf = (imam: ImamProfile) => countryFromText(imam.country) || manualIso[imam.id] || 'MA';
  const fixed = (imam: ImamProfile, raw: string) => toInternational(raw || '', isoOf(imam)) || raw || '';
  const numberOf = (imam: ImamProfile) => {
    const c = contacts?.[imam.id];
    return waNumber(fixed(imam, c?.whatsapp || c?.phone || ''));
  };

  // Stored numbers without «+code»: what they become, and those whose country is unknown.
  type Fix = { imam: ImamProfile; phone: string; whatsapp: string; before: string };
  const toFix = useMemo(() => {
    if (!contacts) return { ok: [] as Fix[], unknown: [] as Fix[] };
    const ok: Fix[] = [];
    const unknown: Fix[] = [];
    for (const imam of imams) {
      const c = contacts[imam.id];
      if (!c) continue;
      const bad = [c.phone, c.whatsapp].some((n) => n && !isInternationalPhone(n.replace(/[\s\-()]/g, '')));
      if (!bad) continue;
      const before = [c.phone, c.whatsapp].filter(Boolean).join(' / ');
      if (countryFromText(imam.country)) {
        ok.push({ imam, phone: fixed(imam, c.phone), whatsapp: fixed(imam, c.whatsapp), before });
      } else {
        const iso = manualIso[imam.id] || 'MA';
        const f = (n: string) => toInternational(n || '', iso) || n || '';
        unknown.push({ imam, phone: f(c.phone), whatsapp: f(c.whatsapp), before });
      }
    }
    return { ok, unknown };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacts, imams, manualIso]);
  const [fixing, setFixing] = useState(false);
  const fixAll = async (items: Fix[]) => {
    setFixing(true);
    const next = { ...(contacts || {}) };
    let done = 0;
    for (const f of items.filter((x) => [x.phone, x.whatsapp].every((n) => !n || isInternationalPhone(n)))) {
      try {
        await setDoc(doc(db, 'imamContacts', f.imam.id), { phone: f.phone, whatsapp: f.whatsapp }, { merge: true });
        next[f.imam.id] = { ...next[f.imam.id], phone: f.phone, whatsapp: f.whatsapp };
        done++;
      } catch (e) {
        setError((e as { code?: string })?.code || 'تعذر حفظ بعض الأرقام');
      }
    }
    setContacts(next);
    setFixing(false);
    setFixedCount((n) => n + done);
  };
  const [fixedCount, setFixedCount] = useState(0);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return imams
      .filter((i) => {
        if (filter === 'approved' && i.approvalStatus !== 'approved') return false;
        if (filter === 'khateeb' && !isKhateeb(i) && imamRole(i.titles) !== 'khateeb') return false;
        if (filter === 'tarawih' && i.availabilityState !== 'ramadan_only') return false;
        if (filter === 'europe' && !i.livesInEurope) return false;
        return !s || `${i.name} ${i.country} ${i.nationality || ''}`.toLowerCase().includes(s);
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [imams, filter, q]);

  const withNumber = list.filter((i) => numberOf(i).length >= 8);
  const chosen = withNumber.filter((i) => picked.has(i.id));
  const allPicked = withNumber.length > 0 && withNumber.every((i) => picked.has(i.id));

  const toggle = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const toggleAll = () => setPicked(allPicked ? new Set() : new Set(withNumber.map((i) => i.id)));

  const personal = (imam: ImamProfile) => text.split('{الاسم}').join(imam.name.replace(/^الشيخ\s+/, ''));
  const open = (imam: ImamProfile) => {
    window.open(`https://wa.me/${numberOf(imam)}?text=${encodeURIComponent(personal(imam))}`, '_blank', 'noopener');
    const next = { ...sent, [imam.id]: new Date().toISOString() };
    setSent(next);
    try {
      localStorage.setItem(SENT_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };
  const nextUnsent = chosen.find((i) => !sent[i.id]);
  const clearSent = () => {
    setSent({});
    try {
      localStorage.removeItem(SENT_KEY);
    } catch {
      // ignore
    }
  };

  const chip = (f: Filter, label: string) => (
    <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f}
      className={`px-3 py-1.5 rounded-full border text-xs font-black cursor-pointer ${filter === f ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-slate-700 border-slate-200'}`}>
      {label}
    </button>
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-black text-parchment flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-brass-300" /> رسائل واتساب للأئمة
        </h3>
        <p className="text-xs text-white/70 leading-relaxed mt-1">
          اختر الأئمة واكتب الرسالة، ثم اضغط «إرسال» أمام كل إمام: يُفتح واتساب والرسالة جاهزة باسمه، فتضغط زر الإرسال فيه.
          واتساب لا يسمح للمواقع بالإرسال الآلي إلا عبر خدمة واتساب للأعمال المدفوعة.
        </p>
      </div>

      {error && <p className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-sm font-bold">تعذر تحميل الأرقام ({error}).</p>}

      {(toFix.ok.length > 0 || toFix.unknown.length > 0 || fixedCount > 0) && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 space-y-3 text-sm">
          <span className="block font-black text-amber-950">أرقام بدون المفتاح الدولي</span>
          {fixedCount > 0 && <p className="text-emerald-800 font-bold">✓ صُحّح {fixedCount} رقم.</p>}
          {toFix.ok.length > 0 && (
            <>
              <p className="text-xs text-amber-900 leading-relaxed">
                هذه الأرقام كُتبت دون المفتاح الدولي. التصحيح يضيف مفتاح دولة إقامة الإمام ويحذف الصفر في أول الرقم. الإرسال عبر واتساب يستعمل الرقم المصحّح حتى قبل الحفظ.
              </p>
              <ul className="divide-y divide-amber-100 bg-white rounded-xl border border-amber-100">
                {toFix.ok.map((f) => (
                  <li key={f.imam.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-xs">
                    <b className="text-slate-900">{f.imam.name}</b>
                    <span className="text-slate-500">{f.imam.country}</span>
                    <span dir="ltr" className="ms-auto text-slate-500 line-through">{f.before}</span>
                    <span dir="ltr" className="font-black text-emerald-800">{[...new Set([f.phone, f.whatsapp].filter(Boolean))].join(' / ')}</span>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => fixAll(toFix.ok)} disabled={fixing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white font-black text-xs cursor-pointer disabled:opacity-60">
                {fixing && <Loader2 className="w-4 h-4 animate-spin" />} تصحيح الكل وحفظه ({toFix.ok.length})
              </button>
            </>
          )}
          {toFix.unknown.length > 0 && (
            <>
              <p className="text-xs text-amber-900 leading-relaxed">
                لم تُعرف دولة هؤلاء من خانة الإقامة، فاختر دولة كل واحد منهم (المغرب افتراضياً) ثم احفظ:
              </p>
              <ul className="divide-y divide-amber-100 bg-white rounded-xl border border-amber-100">
                {toFix.unknown.map((f) => (
                  <li key={f.imam.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-xs">
                    <b className="text-slate-900">{f.imam.name}</b>
                    <span className="text-slate-500">{f.imam.country || '—'}</span>
                    <select value={manualIso[f.imam.id] || 'MA'} aria-label={`دولة ${f.imam.name}`}
                      onChange={(e) => setManualIso((m) => ({ ...m, [f.imam.id]: e.target.value }))}
                      className="border border-slate-300 rounded-lg px-2 py-1 text-xs bg-white">
                      {countryOptions.map(([iso, code, name]) => <option key={iso} value={iso}>{name} (+{code})</option>)}
                    </select>
                    <span dir="ltr" className="ms-auto text-slate-500 line-through">{f.before}</span>
                    <span dir="ltr" className="font-black text-emerald-800">{[...new Set([f.phone, f.whatsapp].filter(Boolean))].join(' / ')}</span>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => fixAll(toFix.unknown)} disabled={fixing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white font-black text-xs cursor-pointer disabled:opacity-60">
                {fixing && <Loader2 className="w-4 h-4 animate-spin" />} تصحيح هؤلاء وحفظه ({toFix.unknown.length})
              </button>
            </>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <span className="block font-black text-slate-800 text-sm">نص الرسالة</span>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button key={t.label} type="button" onClick={() => setText(t.text)}
              className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-black cursor-pointer">
              نموذج: {t.label}
            </button>
          ))}
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={1500} aria-label="نص الرسالة"
          className="w-full border border-slate-300 rounded-xl p-3 text-sm leading-relaxed" />
        <p className="text-xs text-slate-500">اكتب <b>{'{الاسم}'}</b> في النص ليوضع مكانه اسم كل إمام.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {chip('approved', 'المعتمدون')}
          {chip('all', 'الجميع')}
          {chip('khateeb', 'الخطباء')}
          {chip('tarawih', 'التراويح')}
          {chip('europe', 'المقيمون في أوروبا')}
          <div className="relative flex-1 min-w-40">
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم أو البلد" aria-label="بحث"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 ps-9 text-sm" />
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {!contacts && !error ? (
          <p className="text-sm text-slate-500 flex items-center gap-2 py-6 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> جاري تحميل الأرقام…</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <label className="flex items-center gap-2 font-black text-slate-800 cursor-pointer">
                <input type="checkbox" checked={allPicked} onChange={toggleAll} className="w-4 h-4 accent-emerald-700" />
                تحديد الكل ({withNumber.length})
              </label>
              <span className="text-slate-500 text-xs">
                المختارون: <b>{chosen.length}</b> · أُرسل إليهم: <b>{chosen.filter((i) => sent[i.id]).length}</b>
                {list.length > withNumber.length && ` · بلا رقم: ${list.length - withNumber.length}`}
              </span>
            </div>

            {nextUnsent && (
              <button type="button" onClick={() => open(nextUnsent)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#25D366] hover:brightness-95 text-white font-black cursor-pointer">
                <Send className="w-5 h-5" /> أرسل للتالي: {nextUnsent.name}
              </button>
            )}

            <ul className="divide-y divide-slate-100">
              {list.map((i) => {
                const num = numberOf(i);
                const ok = num.length >= 8;
                return (
                  <li key={i.id} className="flex items-center gap-3 py-2.5">
                    <input type="checkbox" disabled={!ok} checked={picked.has(i.id)} onChange={() => toggle(i.id)}
                      aria-label={`اختيار ${i.name}`} className="w-4 h-4 accent-emerald-700" />
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 text-sm truncate">{i.name}</p>
                      <p className="text-xs text-slate-500 truncate" dir="auto">{ok ? `+${num}` : 'لا يوجد رقم'} · {i.country}</p>
                    </div>
                    {sent[i.id] && <span className="text-xs font-black text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> أُرسلت</span>}
                    {ok && (
                      <button type="button" onClick={() => open(i)}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366] text-white text-xs font-black cursor-pointer">
                        <ExternalLink className="w-3.5 h-3.5" /> إرسال
                      </button>
                    )}
                  </li>
                );
              })}
              {list.length === 0 && <li className="py-6 text-center text-sm text-slate-500">لا يوجد أئمة في هذا الاختيار.</li>}
            </ul>
            {Object.keys(sent).length > 0 && (
              <button type="button" onClick={clearSent} className="text-xs text-slate-500 underline cursor-pointer">مسح علامات «أُرسلت»</button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
