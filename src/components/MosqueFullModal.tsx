import React, { useRef, useState } from 'react';
import { MosqueContact, MosqueJob, UserRole } from '../types';
import { ContactBlock } from './ContactBlock';
import { MosqueCvSheet } from './MosqueCvSheet';
import { SITE_URL } from './ImamCvSheet';
import { X, Edit3, Share2, Flag, Lock, ImageDown, FileDown, Loader2, Link2, Send, Check } from 'lucide-react';
import { useDialog } from '../lib/useDialog';
import { useContact } from '../lib/db';
import { downloadPdf, downloadPng, renderNodeToPng, shareImage } from '../lib/cvExport';

interface MosqueFullModalProps {
  mosque: MosqueJob | null;
  onClose: () => void;
  currentRole: UserRole;
  /** Owner, admin or imam with an approved profile. Enforced again by Firestore rules. */
  canViewContact: boolean;
  canEdit: boolean;
  alreadyApplied: boolean;
  onApply: (mosque: MosqueJob) => void;
  onEdit: (mosque: MosqueJob) => void;
  onReport: (mosque: MosqueJob) => void;
  onOpenAuthModal: () => void;
  onCopied: () => void;
  onError?: (msg: string) => void;
}

type ExportKind = 'png' | 'pdf' | 'share';

export const MosqueFullModal: React.FC<MosqueFullModalProps> = ({
  mosque,
  onClose,
  currentRole,
  canViewContact,
  canEdit,
  alreadyApplied,
  onApply,
  onEdit,
  onReport,
  onOpenAuthModal,
  onCopied,
  onError,
}) => {
  const dialogRef = useDialog(!!mosque, onClose);
  const { contact } = useContact<MosqueContact>('mosque', mosque?.id, !!mosque && canViewContact);
  const printRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<ExportKind | null>(null);

  if (!mosque) return null;

  const isApproved = mosque.approvalStatus === 'approved';
  const shareUrl = isApproved ? `${window.location.origin}${window.location.pathname}#/mosques/${mosque.id}` : undefined;
  const fileName = `Aemmah-Mosque-${mosque.id.replace(/[^\w-]/g, '').slice(0, 10)}`;

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      onCopied();
    } catch {
      window.prompt('انسخ الرابط:', shareUrl);
    }
  };

  const handleExport = async (kind: ExportKind) => {
    setExporting(kind);
    try {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const node = printRef.current;
      if (!node) throw new Error('no node');
      for (let i = 0; i < 30 && !node.querySelector('img[data-qr]'); i++) await new Promise((r) => setTimeout(r, 100));
      const png = await renderNodeToPng(node);
      if (kind === 'png') downloadPng(png, fileName);
      else if (kind === 'pdf') await downloadPdf(png, fileName);
      else
        await shareImage(
          png,
          fileName,
          `${mosque.mosqueName} (${mosque.city}) — ${mosque.lookingType}.\nللتقديم عبر منصة أئمة التي تربط الأئمة بالمساجد في أوروبا:`,
          shareUrl || `https://${SITE_URL}/`
        );
    } catch (err) {
      console.error(err);
      onError?.('تعذر إنشاء ملف الإعلان. حاول مرة أخرى.');
    } finally {
      setExporting(null);
    }
  };

  const contactSlot = canViewContact ? (
    <ContactBlock kind="mosque" id={mosque.id} canView lockedText="تعذر تحميل بيانات التواصل" />
  ) : (
    <div className="glass rounded-2xl p-3.5 space-y-2 text-sm">
      <p className="font-black text-amber-300 flex items-center gap-1.5">
        <Lock className="w-4 h-4" />
        بيانات التواصل محمية
      </p>
      <p className="text-xs text-white/80 leading-relaxed">
        {currentRole === 'imam'
          ? 'تظهر لك أرقام المسجد ومسؤول التواصل بعد أن توافق الإدارة على ملفك كإمام.'
          : 'لا تظهر أرقام المسجد ومسؤول التواصل إلا للأئمة الذين اعتمدت الإدارة ملفاتهم.'}
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

  const btn =
    'inline-flex items-center gap-1.5 font-black text-xs px-3.5 py-2.5 rounded-full transition cursor-pointer disabled:opacity-60 disabled:cursor-wait';

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      ref={dialogRef}
      tabIndex={-1}
      aria-modal="true"
      aria-label={`إعلان ${mosque.mosqueName}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#f6faf7] rounded-[2rem] max-w-4xl w-full overflow-hidden shadow-2xl my-4 max-h-[94vh] flex flex-col">
        {/* Glass toolbar */}
        <div className="glass-card bg-gradient-to-l from-[#2fbf7a] via-[#12804c] to-[#05472b] text-white px-3 sm:px-4 py-3 flex items-center justify-between gap-2 rounded-none">
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
            {shareUrl && (
              <button onClick={handleCopyLink} className={`${btn} glass text-white`} title="نسخ رابط الإعلان">
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

        <div className="overflow-y-auto p-3 sm:p-5">
          {!isApproved && (
            <p className="mb-3 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              {mosque.approvalStatus === 'pending' ? 'هذا الإعلان قيد المراجعة ولا يظهر للعموم بعد.' : 'هذا الإعلان غير معتمد.'}
            </p>
          )}
          <div className="shadow-xl rounded-3xl">
            <MosqueCvSheet
              mosque={mosque}
              contact={canViewContact ? contact : null}
              layout="screen"
              shareUrl={shareUrl}
              contactSlot={contactSlot}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 bg-white border-t border-slate-200 flex flex-wrap justify-between items-center gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(mosque);
                }}
                className={`${btn} bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100`}
              >
                <Edit3 className="w-4 h-4" />
                تعديل الإعلان
              </button>
            )}
            {currentRole !== 'admin' && !canEdit && (
              <button
                onClick={() => {
                  onClose();
                  onReport(mosque);
                }}
                className={`${btn} bg-red-50 text-red-700 border border-red-200 hover:bg-red-100`}
              >
                <Flag className="w-4 h-4" />
                إبلاغ الإدارة
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentRole === 'imam' && isApproved && mosque.activeState !== 'closed' && (
              <button
                onClick={() => {
                  onClose();
                  onApply(mosque);
                }}
                disabled={alreadyApplied}
                className={`${btn} ${alreadyApplied ? 'bg-slate-100 text-slate-500' : 'bg-[#0b5e37] text-white hover:bg-[#12804c] shadow'}`}
              >
                {alreadyApplied ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                {alreadyApplied ? 'تم التقديم' : 'التقديم لهذا المسجد'}
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
                سجّل دخولك للتقديم
              </button>
            )}
            <button onClick={onClose} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-100`}>
              إغلاق
            </button>
          </div>
        </div>
      </div>

      {exporting && (
        <div style={{ position: 'fixed', left: -10000, top: 0 }} aria-hidden>
          <MosqueCvSheet ref={printRef} mosque={mosque} contact={canViewContact ? contact : null} layout="print" shareUrl={shareUrl} />
        </div>
      )}
    </div>
  );
};
