import React from 'react';
import { BookOpen, Briefcase, Flag, FileText, Globe2, Home, Languages, MapPin, Plane, Send, Check, Star, Users } from 'lucide-react';
import { ImamProfile, MosqueJob } from '../types';
import { formatPreferredLocations, getSafeImamAvatar, getSafeMosquePhoto, imamLanguages, imamTitle, visaStatusText } from '../utils/helpers';

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
  const busy = imam.availabilityState === 'busy_ramadan';
  const languages = imamLanguages(imam).map((l) => l.name).join('، ');

  return (
    <article {...openOnCard(onOpen)} aria-label={`السيرة الذاتية: ${imam.name}`} className={cardCls}>
      {/* Header band in the CV colours, photo in a gold ring */}
      <div className="relative bg-gradient-to-l from-[#1aa3bf] via-[#0e4d64] to-[#0b3a4f] px-5 pt-5 pb-4 flex items-center gap-4">
        <div className="p-1 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shrink-0 shadow-lg">
          <img
            src={getSafeImamAvatar(imam.photo)}
            alt=""
            loading="lazy"
            className="w-20 h-20 rounded-full object-cover border-[3px] border-[#0b3a4f] bg-white"
          />
        </div>
        <div className="min-w-0 text-white">
          <h3 className="font-black text-2xl sm:text-[1.7rem] font-amiri leading-snug line-clamp-2">{imam.name}</h3>
          <p className="text-amber-300 text-sm font-black">{imamTitle(imam.titles)}</p>
          {imam.isVerified && <span className="inline-block mt-1 text-[11px] font-black bg-emerald-500/90 px-2 py-0.5 rounded-full">✓ موثق</span>}
        </div>
      </div>

      <div className="p-5 space-y-3 flex-1">
        <div className="grid gap-1.5">
          <Info icon={<Globe2 className="w-3.5 h-3.5" />} label="الجنسية" value={imam.nationality} />
          <Info icon={<MapPin className="w-3.5 h-3.5" />} label="الإقامة" value={imam.country} />
          <Info icon={<BookOpen className="w-3.5 h-3.5" />} label="الرواية" value={imam.riwaya} />
          <Info icon={<Languages className="w-3.5 h-3.5" />} label="اللغات" value={languages} />
          <Info icon={<Briefcase className="w-3.5 h-3.5" />} label="الوظيفة الحالية" value={imam.currentJob} />
          <Info icon={<Star className="w-3.5 h-3.5" />} label="يفضّل" value={formatPreferredLocations(imam.preferredLocations)} />
          <Info icon={<Plane className="w-3.5 h-3.5" />} label="الإقامة في أوروبا" value={visaStatusText(imam)} />
        </div>

        <p
          className={`px-3 py-2 rounded-xl text-xs font-bold ${
            busy ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
          }`}
        >
          {busy
            ? `ملتزم في رمضان — متاح للتعاقد: ${imam.availableAfterDate || 'بعد العيد'}`
            : imam.availabilityState === 'paused'
            ? 'غير متاح حالياً'
            : 'متاح حالياً لصلاة التراويح أو التعاقد الدائم'}
        </p>

        {contactBlock}
      </div>

      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
        <button
          onClick={onOpen}
          className="flex-1 bg-[#0b3a4f] hover:bg-[#0e4d64] text-white font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          السيرة الكاملة والتلاوة
        </button>
        <button
          onClick={onReport}
          title="إبلاغ الإدارة"
          className="px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl border border-red-200 cursor-pointer flex items-center gap-1 text-xs font-bold"
        >
          <Flag className="w-3.5 h-3.5" />
          إبلاغ
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
  <article {...openOnCard(onOpen)} aria-label={`إعلان ${mosque.mosqueName}`} className={cardCls}>
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
        <h3 className="font-black text-2xl sm:text-[1.7rem] font-amiri leading-snug line-clamp-2">{mosque.mosqueName}</h3>
        <p className="text-amber-300 text-xs font-black line-clamp-1">{mosque.lookingType}</p>
        <p className="text-white/80 text-xs mt-0.5 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {mosque.city}، {mosque.country}
        </p>
      </div>
    </div>

    <div className="p-5 space-y-3 flex-1">
      <div className="grid gap-1.5">
        <Info icon={<BookOpen className="w-3.5 h-3.5" />} label="الرواية المطلوبة" value={mosque.riwayaRequired} />
        <Info icon={<Home className="w-3.5 h-3.5" />} label="السكن" value={mosque.housingProvided ? 'متوفر' : 'غير متوفر'} />
        <Info icon={<Users className="w-3.5 h-3.5" />} label="الراتب والمزايا" value={mosque.salaryAndBenefits} />
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
        الإعلان الكامل
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
        title="إبلاغ الإدارة"
        className="px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl border border-red-200 cursor-pointer flex items-center gap-1 text-xs font-bold"
      >
        <Flag className="w-3.5 h-3.5" />
        إبلاغ
      </button>
    </div>
  </article>
);
