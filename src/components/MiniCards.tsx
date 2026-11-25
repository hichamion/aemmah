import React from 'react';
import { Award, BookOpen, Briefcase, Car, ChevronLeft, Flag, FileText, Globe2, Headphones, Home, Languages, MapPin, Mic, Plane, Send, Check, Star, Users } from 'lucide-react';
import { ImamProfile, MosqueJob } from '../types';
import { formatPreferredLocations, getSafeImamAvatar, getSafeMosquePhoto, imamLanguages, imamTitle, imamRoleArt, imamTone, IMAM_TONES, isKhateeb, khateebArea, KHATEEB_TERM_LABELS, visaStatusText } from '../utils/helpers';
import { t } from '../i18n';

/*
 * Short, CV-looking cards for the imam and mosque lists. Clicking the card opens the full CV / ad
 * (which can be downloaded). The contact block is passed in so the same access rules apply as before.
 */

/** Makes the card open on click / Enter, but not when the click comes from a button or link inside it. */
const openOnCard = (open: () => void) => ({
  role: 'button' as const,
  tabIndex: 0,
  onClick: (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, select')) return;
    open();
  },
  onKeyDown: (e: React.KeyboardEvent) => {
    if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      open();
    }
  },
});

const Info: React.FC<{ icon: React.ReactNode; label: string; value?: string }> = ({ icon, label, value }) =>
  value && value.trim() ? (
    <div className="flex items-start gap-2 text-xs leading-relaxed min-w-0">
      <span className="text-amber-500 mt-0.5 shrink-0">{icon}</span>
      <span className="font-black text-slate-700 shrink-0">{label}:</span>
      <span className="text-slate-600 line-clamp-1 min-w-0">{value}</span>
    </div>
  ) : null;

const cardCls =
  'group bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300';

// ---------------------------------------------------------------------------

interface ImamMiniCardProps {
  imam: ImamProfile;
  contactBlock: React.ReactNode;
  onOpen: () => void;
  onReport: () => void;
}

export const ImamMiniCard: React.FC<ImamMiniCardProps> = ({ imam, contactBlock, onOpen, onReport }) => {
  const busy = imam.availabilityState === 'busy_ramadan' || imam.availabilityState === 'ramadan_only';
  const languages = imamLanguages(imam).map((l) => t(l.name)).join(t('، '));
  const kh = isKhateeb(imam) ? imam.khateeb! : null;
  const tone = IMAM_TONES[imamTone(imam)];

  return (
    <article
      {...openOnCard(onOpen)}
      aria-label={t('السيرة الذاتية: {name}', { name: imam.name })}
      data-khateeb={kh ? '' : undefined}
      data-tone={imamTone(imam)}
      className={`${cardCls} ${tone.card}`}
    >
      {/* Header band in the CV colours (wine red for Friday preachers), photo in a gold ring */}
      <div
        className={`relative bg-gradient-to-l ps-5 pe-[31%] pt-5 pb-4 flex items-center gap-4 ${
          tone.band
        }`}
      >
        {/* Role picture (minbar / lantern / mihrab), transparent, on the free side of the band */}
        <img
          src={imamRoleArt(imam).src}
          alt=""
          aria-hidden
          loading="lazy"
          className="role-art absolute end-2 bottom-1 h-[90%] w-auto max-w-[30%] object-contain object-bottom pointer-events-none select-none"
        />
        <div className="relative z-10 p-1 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shrink-0 shadow-lg">
          <img
            src={getSafeImamAvatar(imam.photo)}
            alt=""
            loading="lazy"
            className={`w-20 h-20 rounded-full object-cover border-[3px] bg-white ${tone.ring}`}
          />
        </div>
        <div className="relative z-10 min-w-0 text-white">
          <h3 dir="auto" className="font-black text-2xl sm:text-[1.7rem] font-amiri leading-snug line-clamp-2">{imam.name}</h3>
          <p className={`${tone.title} text-sm font-black`}>{imamTitle(imam.titles)}</p>
          {kh && (
            <span className="inline-flex items-center gap-1 mt-1 me-1 text-[11px] font-black bg-amber-300 text-[#4f1029] px-2 py-0.5 rounded-full">
              <Mic className="w-3 h-3" /> {t('خطيب جمعة')}
            </span>
          )}
          {imam.isVerified && <span className="inline-block mt-1 text-[11px] font-black bg-emerald-500/90 px-2 py-0.5 rounded-full">{t('✓ موثق')}</span>}
          {imam.recitationMeta && <span className="inline-block mt-1 ms-1 text-[11px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">{t('🎧 عيّنة تلاوة')}</span>}
        </div>
      </div>

      <div className="p-5 space-y-3 flex-1">
        <div className="grid gap-1.5">
          <Info icon={<Globe2 className="w-3.5 h-3.5" />} label={t('الجنسية')} value={imam.nationality} />
          <Info icon={<MapPin className="w-3.5 h-3.5" />} label={t('الإقامة')} value={imam.country} />
          <Info icon={<BookOpen className="w-3.5 h-3.5" />} label={t('الرواية')} value={t(imam.riwaya)} />
          <Info icon={<Languages className="w-3.5 h-3.5" />} label={t('اللغات')} value={languages} />
          <Info icon={<Briefcase className="w-3.5 h-3.5" />} label={t('الوظيفة الحالية')} value={imam.currentJob} />
          <Info icon={<Star className="w-3.5 h-3.5" />} label={t('يفضّل')} value={formatPreferredLocations(imam.preferredLocations)} />
          <Info icon={<Plane className="w-3.5 h-3.5" />} label={t('الإقامة في أوروبا')} value={visaStatusText(imam)} />
        </div>

        {kh && (
          <div className="khateeb-box rounded-xl border border-[#8a2a4c]/25 bg-[#fbf1f4] px-3 py-2.5 space-y-1 text-xs">
            <p className="font-black text-[#6e1d3b] flex items-center gap-1.5"><Mic className="w-3.5 h-3.5" /> {t(KHATEEB_TERM_LABELS[kh.term])}</p>
            <p className="text-slate-700 flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#8a2a4c]" /> <span className="line-clamp-2">{khateebArea(kh, imam.country)}</span></p>
            <p className="text-slate-700 flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-[#8a2a4c]" /> {kh.hasCar ? t('عنده سيارة') : t('ليس عنده سيارة')}</p>
          </div>
        )}

        <p
          className={`px-3 py-2 rounded-xl text-xs font-bold ${
            busy ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
          }`}
        >
          {imam.availabilityState === 'ramadan_only'
            ? t('متاح لرمضان فقط (صلاة التراويح)')
            : imam.availabilityState === 'busy_ramadan'
            ? t('ملتزم في رمضان — متاح للتعاقد: {date}', { date: imam.availableAfterDate || t('بعد العيد') })
            : imam.availabilityState === 'paused'
            ? t('غير متاح حالياً')
            : t('متاح حالياً لصلاة التراويح أو التعاقد الدائم')}
        </p>

        {contactBlock}
      </div>

      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
        <button
          onClick={onOpen}
          className={`flex-1 text-white font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs cursor-pointer ${tone.button}`}
        >
          <FileText className="w-4 h-4" />
          {t('السيرة الكاملة والتلاوة')}
        </button>
        <button
          onClick={onReport}
          title={t('إبلاغ الإدارة')}
          className="px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl border border-red-200 cursor-pointer flex items-center gap-1 text-xs font-bold"
        >
          <Flag className="w-3.5 h-3.5" />
          {t('إبلاغ')}
        </button>
      </div>
    </article>
  );
};

// ---------------------------------------------------------------------------

interface MosqueMiniCardProps {
  mosque: MosqueJob;
  contactBlock: React.ReactNode;
  onOpen: () => void;
  onReport: () => void;
  /** Apply button (imams) or sign-in button (visitors); omitted for other roles. */
  apply?: { label: string; done: boolean; onClick: () => void };
}

export const MosqueMiniCard: React.FC<MosqueMiniCardProps> = ({ mosque, contactBlock, onOpen, onReport, apply }) => (
  <article {...openOnCard(onOpen)} aria-label={t('إعلان {name}', { name: mosque.mosqueName })} className={cardCls}>
    <div className="relative bg-gradient-to-l from-[#2fbf7a] via-[#0b5e37] to-[#063d24] px-5 pt-5 pb-4 flex items-center gap-4">
      <div className="p-1 rounded-[1.4rem] bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shrink-0 shadow-lg">
        <img
          src={getSafeMosquePhoto(mosque.photo)}
          alt=""
          loading="lazy"
          className="w-20 h-20 rounded-[1.1rem] object-cover border-[3px] border-[#0b5e37] bg-white"
        />
      </div>
      <div className="min-w-0 text-white">
        <h3 dir="auto" className="font-black text-2xl sm:text-[1.7rem] font-amiri leading-snug line-clamp-2">{mosque.mosqueName}</h3>
        <p className="text-amber-300 text-xs font-black line-clamp-1">{t(mosque.lookingType)}</p>
        <p className="text-white/80 text-xs mt-0.5 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {mosque.city}{t('، ')}{mosque.country}
        </p>
      </div>
    </div>

    <div className="p-5 space-y-3 flex-1">
      <div className="grid gap-1.5">
        <Info icon={<BookOpen className="w-3.5 h-3.5" />} label={t('الرواية المطلوبة')} value={t(mosque.riwayaRequired)} />
        <Info icon={<Home className="w-3.5 h-3.5" />} label={t('السكن')} value={mosque.housingProvided ? t('متوفر') : t('غير متوفر')} />
        <Info icon={<Users className="w-3.5 h-3.5" />} label={t('الراتب والمزايا')} value={mosque.salaryAndBenefits} />
      </div>
      {mosque.details.trim() && <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{mosque.details}</p>}
      {contactBlock}
    </div>

    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-2">
      <button
        onClick={onOpen}
        className="flex-1 bg-[#e8f6ee] hover:bg-[#d3eedf] text-[#0b5e37] font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs cursor-pointer"
      >
        <FileText className="w-4 h-4" />
        {t('الإعلان الكامل')}
      </button>
      {apply && (
        <button
          onClick={apply.onClick}
          disabled={apply.done}
          className={`flex-1 font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs cursor-pointer ${
            apply.done ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-[#0b5e37] hover:bg-[#12804c] text-white'
          }`}
        >
          {apply.done ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          {apply.label}
        </button>
      )}
      <button
        onClick={onReport}
        title={t('إبلاغ الإدارة')}
        className="px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl border border-red-200 cursor-pointer flex items-center gap-1 text-xs font-bold"
      >
        <Flag className="w-3.5 h-3.5" />
        {t('إبلاغ')}
      </button>
    </div>
  </article>
);

// ---------------------------------------------------------------------------
// Smaller ways to show the imams list (medium cards and a list), with the key facts only:
// name, title / job, country, riwaya, certificates, recitation sample, availability.
// ---------------------------------------------------------------------------

const availabilityShort = (imam: ImamProfile) =>
  imam.availabilityState === 'ramadan_only'
    ? { label: t('متاح لرمضان فقط'), cls: 'bg-amber-50 text-amber-900 border-amber-200' }
    : imam.availabilityState === 'busy_ramadan'
    ? { label: t('ملتزم في رمضان ومتاح بعده'), cls: 'bg-amber-50 text-amber-900 border-amber-200' }
    : imam.availabilityState === 'paused'
    ? { label: t('غير متاح حالياً'), cls: 'bg-slate-100 text-slate-600 border-slate-200' }
    : { label: t('متاح حالياً'), cls: 'bg-emerald-50 text-emerald-900 border-emerald-200' };

/** Small pills: certificates, recitation sample, Friday preacher. */
const ImamFacts: React.FC<{ imam: ImamProfile }> = ({ imam }) => (
  <>
    {imam.hasCerts === 'yes' && (
      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full bg-sky-50 text-sky-900 border border-sky-200">
        <Award className="w-3 h-3" /> {t('شواهد وإجازات')}
      </span>
    )}
    {imam.recitationMeta && (
      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
        <Headphones className="w-3 h-3" /> {t('عيّنة تلاوة')}
      </span>
    )}
    {isKhateeb(imam) && (
      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full bg-[#fbf1f4] text-[#6e1d3b] border border-[#8a2a4c]/25">
        <Mic className="w-3 h-3" /> {t('خطيب جمعة')}
      </span>
    )}
  </>
);

/** Medium card: photo, name, title, job, country · riwaya, facts and availability. */
export const ImamCompactCard: React.FC<{ imam: ImamProfile; onOpen: () => void }> = ({ imam, onOpen }) => {
  const tone = IMAM_TONES[imamTone(imam)];
  const av = availabilityShort(imam);
  return (
    <article {...openOnCard(onOpen)} aria-label={t('السيرة الذاتية: {name}', { name: imam.name })}
      className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 overflow-hidden flex flex-col">
      <div className={`h-1.5 bg-gradient-to-l ${tone.band}`} />
      <div className="p-4 flex gap-3 flex-1">
        <img src={getSafeImamAvatar(imam.photo)} alt="" loading="lazy" className={`w-16 h-16 rounded-2xl object-cover border-2 bg-white shrink-0 ${tone.ring}`} />
        <div className="min-w-0 flex-1 space-y-1">
          <h3 dir="auto" className="font-black text-lg font-amiri leading-snug text-slate-900 line-clamp-1">{imam.name}</h3>
          <p className="text-xs font-black text-emerald-800 line-clamp-1">{imamTitle(imam.titles)}</p>
          {imam.currentJob && <p dir="auto" className="text-xs text-slate-600 line-clamp-1 flex items-center gap-1"><Briefcase className="w-3 h-3 shrink-0 text-amber-500" /> {imam.currentJob}</p>}
          <p className="text-xs text-slate-600 line-clamp-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0 text-amber-500" /> <span dir="auto">{imam.country || '—'}</span>
          </p>
          <p className="text-xs text-slate-600 line-clamp-1 flex items-center gap-1"><BookOpen className="w-3 h-3 shrink-0 text-amber-500" /> {t(imam.riwaya)}</p>
        </div>
      </div>
      <div className="px-4 pb-4 flex flex-wrap items-center gap-1.5">
        <span className={`text-[11px] font-black px-2 py-0.5 rounded-full border ${av.cls}`}>{av.label}</span>
        <ImamFacts imam={imam} />
      </div>
    </article>
  );
};

/** One row of the list view. */
export const ImamListRow: React.FC<{ imam: ImamProfile; onOpen: () => void }> = ({ imam, onOpen }) => {
  const tone = IMAM_TONES[imamTone(imam)];
  const av = availabilityShort(imam);
  return (
    <li>
      <div {...openOnCard(onOpen)} aria-label={t('السيرة الذاتية: {name}', { name: imam.name })}
        className="flex items-center gap-3 px-3 sm:px-4 py-3 hover:bg-slate-50 cursor-pointer focus:outline-none focus-visible:bg-amber-50">
        <img src={getSafeImamAvatar(imam.photo)} alt="" loading="lazy" className={`w-11 h-11 rounded-xl object-cover border-2 bg-white shrink-0 ${tone.ring}`} />
        <div className="min-w-0 flex-1 grid sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-0.5 items-center">
          <div className="min-w-0">
            <p dir="auto" className="font-black text-slate-900 line-clamp-1">{imam.name}</p>
            <p className="text-xs text-emerald-800 font-bold line-clamp-1">{imamTitle(imam.titles)}{imam.currentJob ? ' · ' : ''}<span dir="auto" className="text-slate-500 font-normal">{imam.currentJob}</span></p>
          </div>
          <p className="text-xs text-slate-600 line-clamp-1 flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0 text-amber-500" /> <span dir="auto">{imam.country || '—'}</span></p>
          <p className="text-xs text-slate-600 line-clamp-1 flex items-center gap-1"><BookOpen className="w-3 h-3 shrink-0 text-amber-500" /> {t(imam.riwaya)}</p>
          <div className="sm:col-span-3 flex flex-wrap gap-1.5 mt-1">
            <span className={`text-[11px] font-black px-2 py-0.5 rounded-full border ${av.cls}`}>{av.label}</span>
            <ImamFacts imam={imam} />
          </div>
        </div>
        <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" />
      </div>
    </li>
  );
};
