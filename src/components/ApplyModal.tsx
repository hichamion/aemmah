import React, { useEffect, useState } from 'react';
import { MosqueJob, ImamProfile } from '../types';
import { getSafeImamAvatar } from '../utils/helpers';
import { X, Send, ShieldCheck, Loader2 } from 'lucide-react';
import { useDialog } from '../lib/useDialog';

interface ApplyModalProps {
  mosque: MosqueJob | null;
  imam: ImamProfile | null;
  onClose: () => void;
  onConfirmApply: (note: string) => Promise<void>;
}

const DEFAULT_NOTE =
  'السلام عليكم ورحمة الله وبركاته، أتشرف بالتقدم بملفي لشغل هذه الإمامة لدى جمعيتكم الموقرة.';

export const ApplyModal: React.FC<ApplyModalProps> = ({ mosque, imam, onClose, onConfirmApply }) => {
  const [coverNote, setCoverNote] = useState(DEFAULT_NOTE);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (mosque) setCoverNote(DEFAULT_NOTE);
  }, [mosque?.id]);

  const dialogRef = useDialog(!!mosque && !!imam, onClose);

  if (!mosque || !imam) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await onConfirmApply(coverNote);
    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" role="dialog" ref={dialogRef} tabIndex={-1} aria-modal="true">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl my-8 text-xs space-y-5">
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-xl font-bold">✉️</div>
            <div>
              <h3 className="text-base font-black text-slate-900 font-amiri">تأكيد التقديم</h3>
              <p className="text-xs text-slate-500">إرسال ملفك إلى لجنة المسجد</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="إغلاق" className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-1">
          <span className="bg-amber-200/80 text-amber-950 font-bold px-2 py-0.5 rounded text-xs">المسجد والجهة المعلنة:</span>
          <h4 className="font-black text-slate-900 text-sm font-amiri pt-1">
            {mosque.mosqueName} ({mosque.city} — {mosque.country})
          </h4>
          <p className="text-xs text-slate-600">
            نوع الاحتياج: {mosque.lookingType} | الرواية: {mosque.riwayaRequired}
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center gap-3.5">
          <img src={getSafeImamAvatar(imam.photo)} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-600 shadow" />
          <div className="space-y-0.5">
            <h5 className="font-black text-slate-900 text-sm font-amiri">{imam.name}</h5>
            <p className="text-xs text-slate-500">
              {imam.degree || '—'} | رواية {imam.riwaya}
            </p>
            <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>سيطّلع المسجد على ملفك العام (السيرة، التلاوة) وبيانات تواصلك بعد توثيقه.</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apply-note" className="block font-bold text-slate-700 mb-1">رسالة إلى لجنة المسجد (اختياري):</label>
            <textarea
              id="apply-note"
              rows={3}
              maxLength={2000}
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3 bg-white text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>

          <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={sending}
              className="bg-emerald-700 hover:bg-emerald-600 text-white font-black px-6 py-2.5 rounded-xl shadow-lg transition cursor-pointer flex items-center gap-2 disabled:opacity-60"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>إرسال طلب الترشح</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
