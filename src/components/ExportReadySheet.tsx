import React, { useEffect, useMemo, useState } from 'react';
import { Check, Download, Share2, X } from 'lucide-react';

export interface ReadyFile {
  blob: Blob;
  fileName: string;
  /** Text and link for the share sheet (WhatsApp…). */
  text?: string;
}

/**
 * «الملف جاهز»: shown on phones after the CV / ad was rendered. The button is a fresh tap, which the
 * browser requires to open the share sheet (Save to Files / Photos, WhatsApp…) or to download.
 */
export const ExportReadySheet: React.FC<{ file: ReadyFile | null; onClose: () => void }> = ({ file, onClose }) => {
  const url = useMemo(() => (file ? URL.createObjectURL(file.blob) : ''), [file]);
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  const [problem, setProblem] = useState('');
  useEffect(() => setProblem(''), [file]);
  if (!file) return null;

  const asFile = new File([file.blob], file.fileName, { type: file.blob.type });
  const canShare = !!navigator.canShare?.({ files: [asFile] });
  const isPdf = file.blob.type === 'application/pdf';

  const share = async () => {
    try {
      await navigator.share({ files: [asFile], title: file.fileName, ...(file.text ? { text: file.text } : {}) });
      onClose();
    } catch (err) {
      if ((err as DOMException)?.name !== 'AbortError') setProblem('تعذرت المشاركة. استعمل زر «فتح الملف» ثم احفظه.');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="الملف جاهز" onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-sm bg-white rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-4 shadow-2xl text-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center"><Check className="w-6 h-6" /></span>
            <div>
              <h2 className="font-black text-lg text-slate-900">الملف جاهز</h2>
              <p className="text-xs text-slate-500" dir="ltr">{file.fileName}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="إغلاق" className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        {canShare && (
          <button onClick={share} className="w-full inline-flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl cursor-pointer">
            <Share2 className="w-5 h-5" /> حفظ أو مشاركة
          </button>
        )}
        <a href={url} download={file.fileName} target="_blank" rel="noopener"
          className={`w-full inline-flex items-center justify-center gap-2 font-black py-3.5 rounded-2xl ${canShare ? 'bg-slate-100 text-slate-800' : 'bg-emerald-800 text-white'}`}>
          <Download className="w-5 h-5" /> {isPdf ? 'فتح ملف PDF' : 'فتح الصورة'}
        </a>
        <p className="text-xs text-slate-500 leading-relaxed">
          {canShare
            ? 'اختر «حفظ في الملفات» أو «حفظ الصورة»، أو أرسله مباشرة عبر واتساب.'
            : 'يُفتح الملف في صفحة جديدة؛ اضغط زر المشاركة في المتصفح ثم «حفظ».'}
        </p>
        {problem && <p role="alert" className="text-sm font-bold text-red-700">{problem}</p>}
      </div>
    </div>
  );
};
