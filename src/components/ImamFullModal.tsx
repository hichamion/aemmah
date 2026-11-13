import React, { useEffect, useRef, useState } from 'react';
import { AdminStatStrip, countProfileView, countRecitationPlay } from '../lib/profileStats';
import { ImamContact, ImamProfile, UserRole } from '../types';
import { getYoutubeEmbedUrl, safeHttpUrl } from '../utils/helpers';
import { ContactBlock } from './ContactBlock';
import { ImamCvSheet, SITE_URL } from './ImamCvSheet';
import { X, ExternalLink, Phone, Edit3, Share2, Flag, Lock, ImageDown, FileDown, Loader2, Link2 } from 'lucide-react';
import { useDialog } from '../lib/useDialog';
import { useContact, useRecitationAudio } from '../lib/db';
import { RecitationPlayer, recitationLabel, VISIBILITY_OPTIONS } from './Recitation';
import { cvFileName, downloadPdf, downloadPng, renderNodeToPng, shareImage, needsSecondTap, pdfBlob } from '../lib/cvExport';
import { ExportReadySheet, ReadyFile } from './ExportReadySheet';

interface ImamFullModalProps {
  imam: ImamProfile | null;
  onClose: () => void;
  currentRole: UserRole;
  /** Owner, admin or verified mosque. Enforced again by Firestore rules. */
  canViewContact: boolean;
  canEdit: boolean;
  isUnverifiedMosque: boolean;
  onEdit: (imam: ImamProfile) => void;
  onRequestInterview: (imam: ImamProfile) => void;
  onReport: (imam: ImamProfile) => void;
  onOpenAuthModal: () => void;
  onCopied: () => void;
  onError?: (msg: string) => void;
}

type ExportKind = 'png' | 'pdf' | 'share';

export const ImamFullModal: React.FC<ImamFullModalProps> = ({
  imam,
  onClose,
  currentRole,
  canViewContact,
  canEdit,
  isUnverifiedMosque,
  onEdit,
  onRequestInterview,
  onReport,
  onOpenAuthModal,
  onCopied,
  onError,
}) => {
  const dialogRef = useDialog(!!imam, onClose);
  // Contact details go into the exported CV only for viewers allowed to see them (cached, shared with ContactBlock).
  const { contact } = useContact<ImamContact>('imam', imam?.id, !!imam && canViewContact);
  // The audio is fetched only when the profile is opened, and never autoplayed.
  const recitation = useRecitationAudio(imam?.id, !!imam?.recitationMeta, imam?.recitationMeta?.createdAt);
  const printRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<ExportKind | null>(null);
  const [ready, setReady] = useState<ReadyFile | null>(null);
  // Anonymous view counter (not for the owner or admins).
  useEffect(() => {
    if (imam?.id && !canEdit && imam.approvalStatus === 'approved') countProfileView('imam', imam.id);
  }, [imam?.id, canEdit, imam?.approvalStatus]);

  if (!imam) return null;

  const embedUrl = getYoutubeEmbedUrl(imam.youtubeUrl);
  const youtubeHref = safeHttpUrl(imam.youtubeUrl);
  const isApproved = imam.approvalStatus === 'approved';
  const profileUrl = isApproved ? `${window.location.origin}${window.location.pathname}#/imams/${imam.id}` : undefined;

  const handleCopyLink = async () => {
    if (!profileUrl) return;
    try {
      await navigator.clipboard.writeText(profileUrl);
      onCopied();
    } catch {
      window.prompt('انسخ الرابط:', profileUrl);
    }
  };

  const handleExport = async (kind: ExportKind) => {
    setExporting(kind);
    try {
      // The fixed A4 version is rendered off-screen; give React a frame to mount it.
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const node = printRef.current;
      if (!node) throw new Error('no node');
      // The QR code is generated asynchronously; wait for it (up to 3 s) so it is in the image.
      for (let i = 0; i < 30 && !node.querySelector('img[data-qr]'); i++) await new Promise((r) => setTimeout(r, 100));
      const png = await renderNodeToPng(node);
      const name = cvFileName(imam.id);
      const shareText = `السيرة الذاتية للشيخ ${imam.name} — إمام وقارئ (${imam.riwaya}).\nمنصة أئمة تربط الأئمة والقرّاء بالمساجد في أوروبا:\n${profileUrl || `https://${SITE_URL}/`}`;
      // Phones: hand the file over with a second tap (a late download is blocked by the browser).
      if (needsSecondTap()) {
        setReady(kind === 'pdf' ? { blob: await pdfBlob(png), fileName: `${name}.pdf` } : { blob: png, fileName: `${name}.png`, text: kind === 'share' ? shareText : undefined });
        return;
      }
      if (kind === 'png') downloadPng(png, name);
      else if (kind === 'pdf') await downloadPdf(png, name);
      else
        await shareImage(
          png,
          name,
          `السيرة الذاتية للشيخ ${imam.name} — إمام وقارئ (${imam.riwaya}).\nمنصة أئمة تربط الأئمة والقرّاء بالمساجد في أوروبا:`,
          profileUrl || `https://${SITE_URL}/`
        );
    } catch (err) {
      console.error(err);
      onError?.('تعذر إنشاء ملف السيرة الذاتية. حاول مرة أخرى.');
    } finally {
      setExporting(null);
    }
  };

  const contactSlot = canViewContact ? (
    <div className="space-y-2">
      <ContactBlock
        kind="imam"
        id={imam.id}
        canView
        lockedText="تعذر تحميل بيانات التواصل"
        emailSubject={`تواصل من إدارة مسجد عبر منصة أئمة - ${imam.name}`}
      />
    </div>
  ) : (
    <div className="glass rounded-2xl p-3.5 space-y-2 text-sm">
      <p className="font-black text-amber-300 flex items-center gap-1.5">
        <Lock className="w-4 h-4" />
        بيانات التواصل محمية
      </p>
      <p className="text-xs text-white/80 leading-relaxed">
        {isUnverifiedMosque
          ? 'ستظهر لك أرقام التواصل بعد أن توافق الإدارة على إعلان مسجدك.'
          : 'لا تظهر أرقام الهاتف والبريد إلا للمساجد التي وثقتها الإدارة.'}
      </p>
      {currentRole === 'visitor' && (
        <button
          onClick={() => {
            onClose();
            onOpenAuthModal();
          }}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2 rounded-full text-xs cursor-pointer"
        >
          تسجيل الدخول
        </button>
      )}
    </div>
  );

  const recitationSlot = youtubeHref ? (
    embedUrl ? (
      <div className="space-y-2">
        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg">
          <iframe
            className="w-full h-full"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            src={embedUrl}
            title={`تلاوة ${imam.name}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <a
          href={youtubeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-700 font-bold text-xs inline-flex items-center gap-1 underline"
        >
          فتح في يوتيوب <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    ) : (
      <a href={youtubeHref} target="_blank" rel="noopener noreferrer" dir="ltr" className="text-sky-700 font-bold text-sm underline break-all">
        {youtubeHref}
      </a>
    )
  ) : undefined;

  const meta = imam.recitationMeta;
  const audioSlot = meta ? (
    recitation.audio ? (
      <RecitationPlayer src={recitation.audio} title={recitationLabel(meta)} durationSec={meta.durationSec} date={meta.createdAt} onFirstPlay={canEdit ? undefined : () => countRecitationPlay(imam.id)} />
    ) : recitation.loading ? (
      <p className="text-sm text-slate-500">جاري تحميل التسجيل…</p>
    ) : (
      <p className="text-sm text-slate-600 bg-slate-100 rounded-xl px-3 py-2.5 flex items-center gap-2">
        <Lock className="w-4 h-4" />
        {recitationLabel(meta)} — التسجيل متاح لـ «{VISIBILITY_OPTIONS.find((v) => v.value === meta.visibility)?.label}» حسب اختيار الإمام.
        {currentRole === 'visitor' && ' سجّل دخولك للاستماع.'}
      </p>
    )
  ) : undefined;

  const btn =
    'inline-flex items-center gap-1.5 font-black text-xs px-3.5 py-2.5 rounded-full transition cursor-pointer disabled:opacity-60 disabled:cursor-wait';

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      ref={dialogRef}
      tabIndex={-1}
      aria-modal="true"
      aria-label={`السيرة الذاتية: ${imam.name}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#f7f9fa] rounded-[2rem] max-w-4xl w-full overflow-hidden shadow-2xl my-4 max-h-[94vh] flex flex-col">
        {/* Glass toolbar */}
        <div className="glass-card bg-gradient-to-l from-[#4fd1e8] via-[#1aa3bf] to-[#0b5f7a] text-white px-3 sm:px-4 py-3 flex items-center justify-between gap-2 rounded-none">
          <div className="flex items-center gap-1.5 sm:gap-2 relative z-10">
            <button onClick={() => handleExport('share')} disabled={!!exporting} className={`${btn} bg-[#25D366] text-white shadow`}>
              {exporting === 'share' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              <span>
                <span className="hidden sm:inline">مشاركة </span>واتساب
              </span>
            </button>
            <button onClick={() => handleExport('png')} disabled={!!exporting} className={`${btn} glass text-white`} aria-label="تحميل كصورة">
              {exporting === 'png' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageDown className="w-4 h-4" />}
              <span className="hidden sm:inline">صورة</span>
            </button>
            <button onClick={() => handleExport('pdf')} disabled={!!exporting} className={`${btn} glass text-white`} aria-label="تحميل PDF">
              {exporting === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              PDF
            </button>
            {profileUrl && (
              <button onClick={handleCopyLink} className={`${btn} glass text-white`} title="نسخ رابط الملف">
                <Link2 className="w-4 h-4" />
                <span className="hidden sm:inline">نسخ الرابط</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="relative z-10 w-10 h-10 shrink-0 rounded-full glass flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The CV itself */}
        <div className="overflow-y-auto p-3 sm:p-5">
          {!isApproved && (
            <p className="mb-3 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              {imam.approvalStatus === 'pending' ? 'هذا الملف قيد المراجعة ولا يظهر للعموم بعد.' : 'هذا الملف غير معتمد.'}
            </p>
          )}
          <div className="shadow-xl rounded-3xl">
            <ImamCvSheet
              imam={imam}
              contact={canViewContact ? contact : null}
              layout="screen"
              profileUrl={profileUrl}
              contactSlot={contactSlot}
              recitationSlot={recitationSlot}
              audioSlot={audioSlot}
            />
          </div>
          {canEdit && (imam.visaFileName || imam.certsFileName) && (
            <p className="mt-3 text-xs text-slate-500">
              الوثائق المرفوعة (لا يراها غيرك والإدارة): {[imam.visaFileName, imam.certsFileName].filter(Boolean).join('، ')}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 py-3 bg-white border-t border-slate-200 flex flex-wrap justify-between items-center gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {currentRole === 'admin' && <AdminStatStrip kind="imam" id={imam.id} showPlays={!!imam.recitationMeta} />}
            {canEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(imam);
                }}
                className={`${btn} bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100`}
              >
                <Edit3 className="w-4 h-4" />
                تعديل الملف
              </button>
            )}
            {currentRole !== 'admin' && !canEdit && (
              <button
                onClick={() => {
                  onClose();
                  onReport(imam);
                }}
                className={`${btn} bg-red-50 text-red-700 border border-red-200 hover:bg-red-100`}
              >
                <Flag className="w-4 h-4" />
                إبلاغ الإدارة
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentRole === 'mosque' && isApproved && (
              <button onClick={() => onRequestInterview(imam)} className={`${btn} bg-[#0b3a4f] text-white hover:bg-[#0e4d64] shadow`}>
                <Phone className="w-4 h-4" />
                إرسال طلب تواصل للشيخ
              </button>
            )}
            {currentRole === 'visitor' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAuthModal();
                }}
                className={`${btn} bg-amber-400 text-slate-950 hover:bg-amber-300 shadow`}
              >
                <Lock className="w-4 h-4" />
                تسجيل الدخول للتواصل
              </button>
            )}
            <button onClick={onClose} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-100`}>
              إغلاق
            </button>
          </div>
        </div>
      </div>

      {/* Off-screen A4 version, mounted only while exporting */}
      {exporting && (
        <div style={{ position: 'fixed', left: -10000, top: 0 }} aria-hidden>
          <ImamCvSheet
            ref={printRef}
            imam={imam}
            contact={canViewContact ? contact : null}
            layout="print"
            profileUrl={profileUrl}
          />
        </div>
      )}
      <ExportReadySheet file={ready} onClose={() => setReady(null)} />
    </div>
  );
};
