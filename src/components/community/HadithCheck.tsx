import React, { useState } from 'react';
import { ExternalLink, Loader2, ScrollText, ShieldCheck } from 'lucide-react';

/**
 * Default address of the official search window of «الموسوعة الحديثية» (hdith.com).
 * The exact code is generated on https://hdith.com/embed/configure — an admin can paste it
 * in «الإشراف» and it replaces this default without a new deployment.
 */
export const HADITH_EMBED_DEFAULT = 'https://hdith.com/embed/search?theme=light';
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
  const src = (embedUrl && parseHadithEmbed(embedUrl)) || HADITH_EMBED_DEFAULT;
  const [loaded, setLoaded] = useState(false);

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

      <div className="relative bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {!loaded && (
          <p className="absolute inset-x-0 top-10 flex items-center justify-center gap-2 text-sm text-slate-500" aria-hidden>
            <Loader2 className="w-4 h-4 animate-spin" /> جاري تحميل نافذة البحث…
          </p>
        )}
        <iframe
          key={src}
          src={src}
          title="البحث في الموسوعة الحديثية"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setLoaded(true)}
          className="relative block w-full h-[72vh] min-h-[520px] max-h-[900px] border-0 bg-transparent"
        />
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
