import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Mic,
  Flag,
  Briefcase,
  Heart,
  Award,
  Globe2,
  CalendarClock,
  GraduationCap,
  Languages,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plane,
  User,
  Video,
} from 'lucide-react';
import { ImamContact, ImamProfile } from '../types';
import {
  formatPreferredLocations,
  getSafeImamAvatar,
  imamLanguages,
  imamTitle,
  LANGUAGE_LEVELS,
  MARITAL_LABELS,
  safeHttpUrl,
  visaStatusText,
} from '../utils/helpers';
import { LogoMark } from './Logo';

/*
 * CV-style imam profile: a dark side column (photo in a gold ring, personal info, Qur'an qualifications,
 * languages) and a main column (name, bio in quotes, ribbon-titled sections), with the platform logo and
 * site link at the bottom as discreet promotion.
 * layout="screen" adapts to the window; layout="print" is a fixed A4 page used to export PNG / PDF.
 */

/** The site's address as shown on CVs and cards (taken from the current URL, so it follows a rename). */
export const SITE_URL =
  typeof window !== 'undefined'
    ? `${window.location.host}${window.location.pathname}`.replace(/\/(index\.html)?$/, '')
    : 'hichamion.github.io/aemmah';

const AVAILABILITY: Record<ImamProfile['availabilityState'], string> = {
  available_now: 'متاح فوراً لصلاة التراويح أو للتعاقد الدائم',
  busy_ramadan: 'ملتزم في رمضان، ومتاح للتعاقد بعده',
  paused: 'غير متاح حالياً',
};


const splitList = (v: string) =>
  v
    .split(/[،,;\n]+/)
    .map((x) => x.trim())
    .filter(Boolean);

interface Props {
  imam: ImamProfile;
  /** Contact details, only when the viewer may see them. */
  contact: ImamContact | null;
  layout: 'screen' | 'print';
  /** Public profile link for the QR code (approved profiles only). */
  profileUrl?: string;
  /** Screen layout: replaces the contact rows (e.g. the interactive contact block or a "locked" notice). */
  contactSlot?: React.ReactNode;
  /** Screen layout: replaces the recitation link (e.g. an embedded video). */
  recitationSlot?: React.ReactNode;
  /** Screen layout: the audio recitation sample (player or a privacy notice). */
  audioSlot?: React.ReactNode;
}

export const SideTitle: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <div className="flex items-center gap-2.5 border-b border-white/15 pb-2">
    <span className="w-9 h-9 rounded-xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-amber-300">
      {icon}
    </span>
    <h3 className="text-amber-300 font-black text-base">{children}</h3>
  </div>
);

/** Section title on a coloured ribbon with a line running to the edge. `tone` is the ribbon colour. */
export const Ribbon: React.FC<{ icon: React.ReactNode; children: React.ReactNode; tone?: string }> = ({
  icon,
  children,
  tone = '#0b3a4f',
}) => (
  <div className="flex items-center gap-3">
    <h3
      className="inline-flex items-center gap-2 text-white font-black text-sm px-4 py-2 rounded-l-2xl rounded-tr-2xl shadow-sm"
      style={{ backgroundColor: tone }}
    >
      <span className="text-amber-300">{icon}</span>
      {children}
    </h3>
    <span className="h-px flex-1 opacity-30" style={{ backgroundColor: tone }} />
    <span className="w-2 h-2 rounded-full opacity-50" style={{ backgroundColor: tone }} />
  </div>
);

/** Gold and coloured wave at the bottom of the sheet, with the platform logo and link (discreet promotion). */
export const CvFooter: React.FC<{ tone?: string }> = ({ tone = '#0b3a4f' }) => (
  <footer className="absolute bottom-0 inset-x-0 h-28" aria-label="منصة أئمة">
    <svg viewBox="0 0 500 110" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden>
      <path d="M0 40 C 150 95, 330 0, 500 55 L500 110 L0 110 Z" fill="#f2a12c" />
      <path d="M0 58 C 160 110, 330 15, 500 72 L500 110 L0 110 Z" fill={tone} />
    </svg>
    <div className="absolute bottom-3 inset-x-5 flex items-center justify-between gap-3 text-white">
      <div className="flex items-center gap-2">
        <LogoMark className="w-9 h-9" />
        <div className="leading-tight">
          <p className="font-black text-sm">منصة أئمة</p>
          <p className="text-[11px] text-white/80">تربط الأئمة والقرّاء بالمساجد في أوروبا</p>
        </div>
      </div>
      <p className="text-xs font-bold text-amber-300" dir="ltr">
        {SITE_URL}
      </p>
    </div>
  </footer>
);

/** QR code (data URL) pointing to `target`, generated on demand. */
export function useQrCode(target: string, dark = '#0b3a4f') {
  const [qr, setQr] = useState('');
  useEffect(() => {
    let cancelled = false;
    import('qrcode')
      .then((QR) => QR.toDataURL(target, { margin: 1, width: 220, color: { dark, light: '#ffffff' } }))
      .then((url) => !cancelled && setQr(url))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [target, dark]);
  return qr;
}

export const Row: React.FC<{ label: string; value: string }> = ({ label, value }) =>
  value.trim() ? (
    <div className="flex gap-3 text-sm leading-relaxed">
      <span className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0" />
      <span className="font-black text-slate-800 shrink-0">{label}:</span>
      <span className="text-slate-700 break-words min-w-0">{value}</span>
    </div>
  ) : null;

export const ContactLine: React.FC<{ icon: React.ReactNode; value: string; ltr?: boolean }> = ({ icon, value, ltr }) =>
  value.trim() ? (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-8 h-8 rounded-full bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-amber-300 shrink-0">
        {icon}
      </span>
      <span dir={ltr ? 'ltr' : undefined} className="break-all">
        {value}
      </span>
    </div>
  ) : null;

export const ImamCvSheet = React.forwardRef<HTMLDivElement, Props>(
  ({ imam, contact, layout, profileUrl, contactSlot, recitationSlot, audioSlot }, ref) => {
    const print = layout === 'print';
    const qrTarget = profileUrl || `https://${SITE_URL}/`;
    const qr = useQrCode(qrTarget);

    const langs = imamLanguages(imam);
    const dotsFor = (level?: string) => LANGUAGE_LEVELS.find((l) => l.value === level)?.dots ?? 0;
    const yearRange = (from: string, to: string) => (from || to ? `${from || '…'} – ${to || 'حتى الآن'}` : '');
    const youtube = safeHttpUrl(imam.youtubeUrl);

    const qualifications = [
      `رواية ${imam.riwaya}`,
      ...splitList(imam.degree),
      imam.hasCerts === 'yes' ? 'حاصل على شواهد / إجازات' : '',
    ].filter(Boolean);

    return (
      <div
        ref={ref}
        dir="rtl"
        className={`keep-light relative bg-[#f7f9fa] text-slate-900 overflow-hidden flex ${
          print ? 'w-[794px] min-h-[1123px] flex-row' : 'w-full flex-col md:flex-row rounded-3xl'
        }`}
        style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}
      >
        {/* ---------------- Side column ---------------- */}
        <aside
          className={`relative z-10 bg-gradient-to-b from-[#0e4d64] via-[#0b3a4f] to-[#082a3a] text-white px-6 py-8 space-y-7 shrink-0 ${
            print ? 'w-[290px] rounded-bl-[2.5rem]' : 'w-full md:w-[290px] md:rounded-bl-[2.5rem]'
          }`}
        >
          {/* Photo in a gold ring */}
          <div className="flex justify-center">
            <div className="relative p-1.5 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shadow-xl">
              <img
                src={getSafeImamAvatar(imam.photo)}
                alt={imam.name}
                className="w-40 h-40 rounded-full object-cover border-4 border-[#0b3a4f] bg-white"
              />
              {imam.isVerified && (
                <span className="absolute bottom-2 right-2 bg-emerald-500 text-white text-xs font-black px-2 py-0.5 rounded-full ring-2 ring-[#0b3a4f]">
                  ✓ موثق
                </span>
              )}
            </div>
          </div>

          <section className="space-y-3">
            <SideTitle icon={<User className="w-5 h-5" />}>المعلومات الشخصية</SideTitle>
            <ContactLine icon={<User className="w-4 h-4" />} value={imam.age ? `${imam.age} سنة` : ''} />
            <ContactLine icon={<Flag className="w-4 h-4" />} value={imam.nationality ? `الجنسية: ${imam.nationality}` : ''} />
            <ContactLine icon={<MapPin className="w-4 h-4" />} value={imam.country ? `مقيم في: ${imam.country}` : ''} />
            <ContactLine icon={<Heart className="w-4 h-4" />} value={imam.maritalStatus ? MARITAL_LABELS[imam.maritalStatus] ?? '' : ''} />
            {contactSlot ?? (
              <>
                <ContactLine icon={<Phone className="w-4 h-4" />} value={contact?.phone ?? ''} ltr />
                <ContactLine icon={<MessageCircle className="w-4 h-4" />} value={contact?.whatsapp ?? ''} ltr />
                <ContactLine icon={<Mail className="w-4 h-4" />} value={contact?.email ?? ''} ltr />
              </>
            )}
          </section>

          <section className="space-y-3">
            <SideTitle icon={<BookOpen className="w-5 h-5" />}>المؤهلات القرآنية</SideTitle>
            <ul className="space-y-2 text-sm">
              {qualifications.map((q) => (
                <li key={q} className="flex gap-2.5 leading-relaxed">
                  <span className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </section>

          {langs.length > 0 && (
            <section className="space-y-3">
              <SideTitle icon={<Languages className="w-5 h-5" />}>اللغات</SideTitle>
              <ul className="space-y-2.5 text-sm">
                {langs.map((l) => {
                  const dots = dotsFor(l.level);
                  return (
                    <li key={l.name} className="flex items-center justify-between gap-3">
                      <span className="flex gap-2.5 items-center">
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        <span>
                          {l.name}
                          {l.level === 'native' && <span className="text-white/70 text-xs"> (اللغة الأم)</span>}
                        </span>
                      </span>
                      {dots > 0 && (
                        <span className="flex gap-1.5 shrink-0" aria-label={`المستوى ${dots} من 5`}>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <span key={i} className={`w-2.5 h-2.5 rounded-full ${i <= dots ? 'bg-amber-400' : 'bg-white/20'}`} />
                          ))}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {(imam.preferredLocations?.length ?? 0) > 0 && (
            <section className="space-y-3">
              <SideTitle icon={<Globe2 className="w-5 h-5" />}>يفضّل الإمامة في</SideTitle>
              <ul className="space-y-2 text-sm">
                {imam.preferredLocations!.map((l) => (
                  <li key={l.country} className="flex gap-2.5 leading-relaxed">
                    <span className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                    <span>
                      {l.country}
                      {l.area.trim() && <span className="text-white/75"> — {l.area}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {qr && (
            <section className="pt-2 flex flex-col items-center gap-2 text-center">
              <img data-qr src={qr} alt="رمز QR لملف الإمام على منصة أئمة" className="w-28 h-28 rounded-xl bg-white p-1.5" />
              <p className="text-xs text-white/80 leading-relaxed">امسح الرمز لعرض الملف كاملاً على منصة أئمة</p>
            </section>
          )}
        </aside>

        {/* ---------------- Main column ---------------- */}
        <main className={`relative flex-1 flex flex-col gap-7 px-7 pt-9 ${print ? 'pb-36' : 'pb-32'}`}>
          <header className="text-center space-y-2">
            <h1 className="text-4xl font-black text-[#0b3a4f] leading-tight font-amiri">{imam.name}</h1>
            <p className="text-xl font-black text-amber-600">{imamTitle(imam.titles)}</p>
            <div className="flex items-center justify-center gap-2" aria-hidden>
              <span className="h-0.5 w-16 bg-amber-400 rounded" />
              <span className="w-8 h-2 rounded-b-full bg-amber-500" />
              <span className="h-0.5 w-16 bg-amber-400 rounded" />
            </div>
          </header>

          {imam.cvText.trim() && (
            <blockquote className="relative px-8 text-slate-700 text-sm leading-loose whitespace-pre-line">
              <span className="absolute -top-3 right-0 text-5xl leading-none text-amber-500 font-serif" aria-hidden>
                “
              </span>
              {imam.cvText}
              <span className="absolute -bottom-6 left-0 text-5xl leading-none text-amber-500 font-serif" aria-hidden>
                ”
              </span>
            </blockquote>
          )}

          {(imam.currentJob?.trim() || (imam.experiences?.length ?? 0) > 0) && (
            <section className="space-y-3">
              <Ribbon icon={<Briefcase className="w-5 h-5" />}>الخبرات العملية</Ribbon>
              <div className="space-y-2 pr-2">
                <Row label="الوظيفة الحالية" value={imam.currentJob || ''} />
              </div>
              {(imam.experiences?.length ?? 0) > 0 && (
                <ol className="relative border-r-2 border-amber-300 mr-3 pr-5 space-y-3">
                  {imam.experiences!.map((e, i) => (
                    <li key={i} className="relative text-sm leading-relaxed">
                      <span className="absolute -right-[27px] top-1.5 w-3 h-3 rounded-full bg-amber-400 ring-4 ring-[#f7f9fa]" />
                      <p className="font-black text-slate-800">
                        {e.title}
                        {e.place && <span className="font-normal text-slate-600"> — {e.place}</span>}
                      </p>
                      {yearRange(e.from, e.to) && <p className="text-xs font-bold text-[#0e4d64]">{yearRange(e.from, e.to)}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}

          <section className="space-y-3">
            <Ribbon icon={<GraduationCap className="w-5 h-5" />}>المؤهل العلمي</Ribbon>
            <div className="space-y-2 pr-2">
              <Row label="المؤهل" value={imam.degree} />
              <Row label="الرواية" value={imam.riwaya} />
              {!(imam.certificates?.length) && <Row label="الشواهد والإجازات" value={imam.hasCerts === 'yes' ? 'نعم' : 'لا'} />}
            </div>
          </section>

          {(imam.certificates?.length ?? 0) > 0 && (
            <section className="space-y-3">
              <Ribbon icon={<Award className="w-5 h-5" />}>الشهادات والإجازات</Ribbon>
              <ul className="space-y-2 pr-2 text-sm">
                {imam.certificates!.map((c, i) => (
                  <li key={i} className="flex gap-3 leading-relaxed">
                    <span className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                    <span>
                      <span className="font-black text-slate-800">{c.name}</span>
                      {c.issuer && <span className="text-slate-600"> — {c.issuer}</span>}
                      {c.year && <span className="text-xs font-bold text-[#0e4d64]"> ({c.year})</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="space-y-3">
            <Ribbon icon={<Plane className="w-5 h-5" />}>الإقامة والتأشيرة</Ribbon>
            <div className="space-y-2 pr-2">
              <Row
                label="الوضع"
                value={visaStatusText(imam)}
              />
              <Row label="التفاصيل" value={imam.hasVisa === 'yes' || imam.livesInEurope ? imam.visaDetails : ''} />
              <Row label="الدول المفضلة" value={formatPreferredLocations(imam.preferredLocations)} />
            </div>
          </section>

          <section className="space-y-3">
            <Ribbon icon={<CalendarClock className="w-5 h-5" />}>التفرغ</Ribbon>
            <div className="space-y-2 pr-2">
              <Row label="الحالة" value={AVAILABILITY[imam.availabilityState] ?? ''} />
              <Row label="الالتزام في رمضان" value={imam.ramadanNote} />
              <Row label="متاح للتعاقد ابتداءً من" value={imam.availableAfterDate} />
            </div>
          </section>

          {audioSlot && (
            <section className="space-y-3">
              <Ribbon icon={<Mic className="w-5 h-5" />}>عيّنة التلاوة</Ribbon>
              {audioSlot}
            </section>
          )}

          {(recitationSlot || youtube) && (
            <section className="space-y-3">
              <Ribbon icon={<Video className="w-5 h-5" />}>نموذج من التلاوة</Ribbon>
              {recitationSlot ?? (
                <p className="text-sm text-slate-700 pr-2 break-all" dir="ltr">
                  {youtube}
                </p>
              )}
            </section>
          )}

          <div className="mt-auto" aria-hidden />

          <CvFooter />
        </main>
      </div>
    );
  }
);
ImamCvSheet.displayName = 'ImamCvSheet';
