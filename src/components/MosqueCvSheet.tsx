import React from 'react';
import { MosqueIcon } from './MosqueIcon';
import { ClipboardList, HandCoins, Home, Mail, MapPin, MessageCircle, Phone, User } from 'lucide-react';
import { MosqueContact, MosqueJob } from '../types';
import { getSafeMosquePhoto } from '../utils/helpers';
import { ContactLine, CvFooter, Ribbon, Row, SideTitle, SITE_URL, useQrCode } from './ImamCvSheet';

/*
 * Mosque profile / job ad in the same CV style as the imam sheet, in royal green:
 * side column (photo, location, contact, what the mosque offers) and main column (who they look for,
 * description, requirements). layout="print" is a fixed A4 page used for PNG / PDF export.
 */

const TONE = '#0b5e37';

interface Props {
  mosque: MosqueJob;
  /** Contact details, only when the viewer may see them. */
  contact: MosqueContact | null;
  layout: 'screen' | 'print';
  /** Public link for the QR code. */
  shareUrl?: string;
  /** Screen layout: replaces the contact rows (interactive contact block or a "locked" notice). */
  contactSlot?: React.ReactNode;
}

export const MosqueCvSheet = React.forwardRef<HTMLDivElement, Props>(
  ({ mosque, contact, layout, shareUrl, contactSlot }, ref) => {
    const print = layout === 'print';
    const qr = useQrCode(shareUrl || `https://${SITE_URL}/`, TONE);
    const closed = mosque.activeState === 'closed';

    const offers = [
      mosque.salaryAndBenefits,
      mosque.housingProvided ? 'يتوفر سكن للإمام' : '',
    ].filter((x) => x && x.trim());

    return (
      <div
        ref={ref}
        dir="rtl"
        className={`keep-light relative bg-[#f6faf7] text-slate-900 overflow-hidden flex ${
          print ? 'w-[794px] min-h-[1123px] flex-row' : 'w-full flex-col md:flex-row rounded-3xl'
        }`}
        style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}
      >
        {/* ---------------- Side column ---------------- */}
        <aside
          className={`relative z-10 bg-gradient-to-b from-[#16935a] via-[#0b5e37] to-[#063d24] text-white px-6 py-8 space-y-7 shrink-0 ${
            print ? 'w-[290px] rounded-bl-[2.5rem]' : 'w-full md:w-[290px] md:rounded-bl-[2.5rem]'
          }`}
        >
          <div className="flex justify-center">
            <div className="relative p-1.5 rounded-[2rem] bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shadow-xl">
              <img
                src={getSafeMosquePhoto(mosque.photo)}
                alt={mosque.mosqueName}
                className="w-44 h-36 rounded-[1.6rem] object-cover border-4 border-[#0b5e37] bg-white"
              />
              {mosque.approvalStatus === 'approved' && (
                <span className="absolute -bottom-2 right-3 bg-amber-400 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full ring-2 ring-[#0b5e37]">
                  ✓ معتمد
                </span>
              )}
            </div>
          </div>

          {/* Phones: name and the wanted imam right under the photo (the main column header is hidden there). */}
          {!print && (
            <div className="md:hidden text-center space-y-1">
              {closed && <span className="inline-block bg-white/15 text-white text-xs font-black px-3 py-1 rounded-full">الإعلان مغلق حالياً</span>}
              <h1 className="text-3xl font-black leading-tight font-amiri">{mosque.mosqueName}</h1>
              {mosque.legalName && <p className="text-sm text-white/75">{mosque.legalName}</p>}
              <p className="text-lg font-black text-amber-300">{mosque.lookingType}</p>
            </div>
          )}

          <section className="space-y-3">
            <SideTitle icon={<MapPin className="w-5 h-5" />}>الموقع</SideTitle>
            <ContactLine icon={<MapPin className="w-4 h-4" />} value={`${mosque.city}، ${mosque.country}`} />
            {contact && <ContactLine icon={<Home className="w-4 h-4" />} value={mosque.fullAddress} />}
          </section>

          <section className="space-y-3">
            <SideTitle icon={<User className="w-5 h-5" />}>التواصل</SideTitle>
            {contactSlot ?? (
              <>
                <ContactLine icon={<User className="w-4 h-4" />} value={contact?.contactPerson ?? ''} />
                <ContactLine icon={<Phone className="w-4 h-4" />} value={contact?.phone ?? ''} ltr />
                <ContactLine icon={<MessageCircle className="w-4 h-4" />} value={contact?.whatsapp ?? ''} ltr />
                <ContactLine icon={<Mail className="w-4 h-4" />} value={contact?.email ?? ''} ltr />
                {!contact && (
                  <p className="text-xs text-white/75 leading-relaxed">
                    بيانات التواصل متاحة للأئمة المعتمدين على منصة أئمة.
                  </p>
                )}
              </>
            )}
          </section>

          {offers.length > 0 && (
            <section className="space-y-3">
              <SideTitle icon={<HandCoins className="w-5 h-5" />}>ما يقدمه المسجد</SideTitle>
              <ul className="space-y-2 text-sm">
                {offers.map((o) => (
                  <li key={o} className="flex gap-2.5 leading-relaxed">
                    <span className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                    <span className="whitespace-pre-line">{o}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {qr && (
            <section className="pt-2 flex flex-col items-center gap-2 text-center">
              <img data-qr src={qr} alt="رمز QR لإعلان المسجد على منصة أئمة" className="w-28 h-28 rounded-xl bg-white p-1.5" />
              <p className="text-xs text-white/80 leading-relaxed">امسح الرمز للتقديم على الإعلان عبر منصة أئمة</p>
            </section>
          )}
        </aside>

        {/* ---------------- Main column ---------------- */}
        <main className={`relative flex-1 flex flex-col gap-7 px-7 pt-9 ${print ? 'pb-36' : 'pb-32'}`}>
          <header className={`text-center space-y-2 ${print ? '' : 'hidden md:block'}`}>
            {closed && (
              <span className="inline-block bg-slate-200 text-slate-700 text-xs font-black px-3 py-1 rounded-full">
                الإعلان مغلق حالياً
              </span>
            )}
            <h1 className="text-4xl font-black leading-tight font-amiri" style={{ color: TONE }}>
              {mosque.mosqueName}
            </h1>
            {mosque.legalName && <p className="text-sm text-slate-500">{mosque.legalName}</p>}
            <p className="text-xl font-black text-amber-600">{mosque.lookingType}</p>
            <div className="flex items-center justify-center gap-2" aria-hidden>
              <span className="h-0.5 w-16 bg-amber-400 rounded" />
              <span className="w-8 h-2 rounded-b-full bg-amber-500" />
              <span className="h-0.5 w-16 bg-amber-400 rounded" />
            </div>
          </header>

          {mosque.details.trim() && (
            <blockquote className="relative px-8 text-slate-700 text-sm leading-loose whitespace-pre-line">
              <span className="absolute -top-3 right-0 text-5xl leading-none text-amber-500 font-serif" aria-hidden>
                “
              </span>
              {mosque.details}
              <span className="absolute -bottom-6 left-0 text-5xl leading-none text-amber-500 font-serif" aria-hidden>
                ”
              </span>
            </blockquote>
          )}

          <section className="space-y-3">
            <Ribbon icon={<MosqueIcon className="w-5 h-5" />} tone={TONE}>
              تفاصيل الإعلان
            </Ribbon>
            <div className="space-y-2 pr-2">
              <Row label="المطلوب" value={mosque.lookingType} />
              <Row label="الرواية المطلوبة" value={mosque.riwayaRequired} />
              <Row label="المدينة" value={`${mosque.city}، ${mosque.country}`} />
              <Row label="السكن" value={mosque.housingProvided ? 'متوفر' : 'غير متوفر (أو بدل سكن)'} />
            </div>
          </section>

          {mosque.requirements?.length > 0 && (
            <section className="space-y-3">
              <Ribbon icon={<ClipboardList className="w-5 h-5" />} tone={TONE}>
                الشروط والمؤهلات المطلوبة
              </Ribbon>
              <ul className="space-y-2 pr-2 text-sm text-slate-700">
                {mosque.requirements.map((r) => (
                  <li key={r} className="flex gap-3 leading-relaxed">
                    <span className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {mosque.salaryAndBenefits.trim() && (
            <section className="space-y-3">
              <Ribbon icon={<HandCoins className="w-5 h-5" />} tone={TONE}>
                الراتب والمزايا
              </Ribbon>
              <p className="pr-2 text-sm text-slate-700 leading-relaxed whitespace-pre-line">{mosque.salaryAndBenefits}</p>
            </section>
          )}

          <div className="mt-auto" aria-hidden />

          <CvFooter tone={TONE} />
        </main>
      </div>
    );
  }
);
MosqueCvSheet.displayName = 'MosqueCvSheet';

