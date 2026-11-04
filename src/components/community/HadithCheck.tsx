import React, { useState } from 'react';
import { ExternalLink, Loader2, ScrollText, ShieldCheck } from 'lucide-react';

/**
 * Official search box of «الموسوعة الحديثية» (code from https://hdith.com/embed/configure):
 * width 400 for phones, 460 for larger screens, light theme, results in the same window.
 * An admin can still paste another hdith.com code in «الإشراف».
 */
const searchbox = (width: number) =>
  `https://hdith.com/embed/searchbox?width=${width}&prefill=%D8%AA%D8%A3%D9%83%D8%AF+%D9%85%D9%86+%D8%B5%D8%AD%D8%A9+%D8%A7%D9%84%D8%AD%D8%AF%D9%8A%D8%AB&button=%D8%A8%D8%AD%D8%AB&theme=light&newwindow=no&summary=yes`;
export const HADITH_EMBED_MOBILE = searchbox(400);
export const HADITH_EMBED_DEFAULT = searchbox(460);
const BOX_HEIGHT = 80;
export const HADITH_SITE = 'https://hdith.com/';

/** Accepts an iframe snippet or a plain link; returns the https address on hdith.com, or null. */
export function parseHadithEmbed(input: string): string | null {
  const raw = input.trim();
  const src = raw.match(/src\s*=\s*["']([^"']+)["']/i)?.[1] ?? raw;
  try {
    const u = new URL(src.replace(/&amp;/g, '&'));
    if (u.protocol !== 'https:') return null;
    if (u.hostname !== 'hdith.com' && !u.hostname.endsWith('.hdith.com')) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * «التحقق من صحة حديث»: the official search window of the encyclopedia, shown as-is.
 * Results and rulings come from the service itself; the platform does not change or store them.
 */
export const HadithCheck: React.FC<{ embedUrl?: string }> = ({ embedUrl }) => {
  const narrow = typeof window !== 'undefined' && window.innerWidth < 520;
  const custom = embedUrl ? parseHadithEmbed(embedUrl) : null;
  // Very narrow phones: same phone code, with a width that fits the card (at most 400).
  const fit = narrow ? Math.max(280, Math.min(400, Math.floor(window.innerWidth - 64))) : 0;
  const src = custom || (narrow ? (fit < 400 ? searchbox(fit) : HADITH_EMBED_MOBILE) : HADITH_EMBED_DEFAULT);
  const boxWidth = Number(new URL(src).searchParams.get('width')) || 460;
  // First load = the search box. A later load means the box opened its results inside the frame:
  // the frame then grows so the results can be read.
  const [loads, setLoads] = useState(0);
  const [nonce, setNonce] = useState(0);
  const expanded = loads > 1;

  return (
    <div className="space-y-4">
      <header className="relative overflow-hidden bg-white/90 backdrop-blur rounded-3xl border border-slate-200 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-[#e3f6ef] to-[#c9ebe0] text-emerald-800 flex items-center justify-center ring-1 ring-emerald-700/10">
            <ScrollText className="w-5 h-5" />
          </span>
          <div className="space-y-1">
            <h2 className="text-2xl font-black font-amiri text-slate-900">التحقق من صحة حديث</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              ابحث عن الحديث النبوي، وتحقق من درجته ومصدره من خلال الموسوعة الحديثية
            </p>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-3">
        <p className="text-xs font-bold text-slate-500">اكتب جزءاً من نص الحديث ثم اضغط «بحث»:</p>
        <div className="relative flex justify-center">
          {loads === 0 && (
            <p className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-slate-500" aria-hidden>
              <Loader2 className="w-4 h-4 animate-spin" /> جاري تحميل خانة البحث…
            </p>
          )}
          <iframe
            key={`${src}#${nonce}`}
            src={src}
            title="البحث في الموسوعة الحديثية"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setLoads((n) => n + 1)}
            scrolling={expanded ? 'auto' : 'no'}
            style={expanded ? { width: '100%', height: '75vh', minHeight: 520 } : { width: '100%', maxWidth: boxWidth, height: BOX_HEIGHT }}
            className="relative block border-0 overflow-hidden m-0 p-0 bg-transparent transition-[height] duration-300"
          />
        </div>
        {expanded && (
          <button onClick={() => { setLoads(0); setNonce((n) => n + 1); }} className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer">
            ← بحث جديد
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/90 rounded-2xl border border-slate-200 px-4 py-3 text-xs text-slate-600">
        <p className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            نتائج البحث وأحكام العلماء مصدرها <b>الموسوعة الحديثية (حديث)</b> كما يعرضها الموقع، دون أي تعديل من منصة أئمة.
          </span>
        </p>
        <a href={HADITH_SITE} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-black text-emerald-800 hover:underline">
          فتح الموسوعة في نافذة جديدة <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
