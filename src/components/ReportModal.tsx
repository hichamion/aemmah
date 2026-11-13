import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, Flag, Loader2 } from 'lucide-react';
import { useDialog } from '../lib/useDialog';

interface ReportModalProps {
  target: { type: 'imam' | 'mosque'; id: string; name: string } | null;
  onClose: () => void;
  onConfirmReport: (reason: string, details: string) => Promise<void>;
}

const IMAM_REASONS = [
  'الشيخ لم يعد متاحاً (وجد مسجداً أو عملاً)',
  'معلومات الملف أو الشواهد غير دقيقة أو مضللة',
  'تعذر التواصل / رقم الهاتف لا يعمل',
  'سبب آخر',
];

const MOSQUE_REASONS = [
  'المسجد تعاقد بالفعل مع إمام والإعلان لم يعد متاحاً',
  'شروط العقد أو السكن لا تطابق ما هو معلن',
  'إدارة المسجد لا ترد على المتقدمين',
  'سبب آخر',
];

/**
 * Reports go to the admin only. Unlike the previous version, a report does NOT
 * hide or pause the target automatically (that allowed anyone to take down any profile).
 */
export const ReportModal: React.FC<ReportModalProps> = ({ target, onClose, onConfirmReport }) => {
  const reasons = target?.type === 'mosque' ? MOSQUE_REASONS : IMAM_REASONS;
  const [selectedReason, setSelectedReason] = useState(reasons[0]);
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);

  // Reset whenever a new target is opened (fixes reasons of the wrong type being kept).
  useEffect(() => {
    if (target) {
      setSelectedReason((target.type === 'mosque' ? MOSQUE_REASONS : IMAM_REASONS)[0]);
      setDetails('');
    }
  }, [target?.type, target?.id]);

  const dialogRef = useDialog(!!target, onClose);

  if (!target) return null;
  const isImam = target.type === 'imam';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedReason === 'سبب آخر' && !details.trim()) return;
    setSending(true);
    await onConfirmReport(selectedReason, details);
    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" role="dialog" ref={dialogRef} tabIndex={-1} aria-modal="true">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-7 shadow-2xl my-8 text-xs space-y-5 border-2 border-red-100">
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <Flag className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900 font-amiri">
                {isImam ? `الإبلاغ عن ملف: ${target.name}` : `الإبلاغ عن إعلان: ${target.name}`}
              </h4>
              <p className="text-xs text-slate-500">يُرسل البلاغ إلى الإدارة للمراجعة</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="إغلاق" className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>يتم التعامل مع البلاغات بسرية، ولا يظهر اسمك لصاحب الملف.</p>
          </div>

          <fieldset>
            <legend className="block font-bold text-slate-700 mb-1.5">سبب الإبلاغ *</legend>
            <div className="space-y-2">
              {reasons.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition select-none ${
                    selectedReason === reason
                      ? 'bg-red-50/80 border-red-400 font-bold text-red-950'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="rep-details" className="block font-bold text-slate-700 mb-1">
              تفاصيل إضافية {selectedReason === 'سبب آخر' ? '*' : '(اختياري)'}:
            </label>
            <textarea
              id="rep-details"
              rows={3}
              maxLength={2000}
              required={selectedReason === 'سبب آخر'}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3 bg-white text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 cursor-pointer">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={sending}
              className="bg-red-600 hover:bg-red-500 text-white font-black px-6 py-2 rounded-xl shadow cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
            >
              {sending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>🚩 إرسال البلاغ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
