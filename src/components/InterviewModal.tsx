import React, { useEffect, useState } from 'react';
import { Application, ImamProfile, MosqueJob, MosqueContact } from '../types';
import { useContact } from '../lib/db';
import { X, Phone, Mail, MessageSquare, Send, Loader2 } from 'lucide-react';
import { useDialog } from '../lib/useDialog';

export interface InterviewDetails {
  mosque: MosqueJob;
  imamUid: string;
  imamId: string;
  imamName: string;
  dateTime: string;
  methodLabel: string;
  contactDetail: string;
  notes: string;
}

interface InterviewModalProps {
  /** Either an application (mosque → applicant) or an imam picked from the list. */
  target: { application: Application | null; imam: ImamProfile | null } | null;
  /** The current mosque account's APPROVED mosques. */
  myMosques: MosqueJob[];
  imams: ImamProfile[];
  onClose: () => void;
  onConfirm: (details: InterviewDetails) => Promise<void>;
}

type Method = 'whatsapp' | 'phone' | 'email';
const METHOD_LABEL: Record<Method, string> = {
  whatsapp: 'الواتساب (WhatsApp)',
  phone: 'الاتصال الهاتفي',
  email: 'البريد الإلكتروني',
};

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export const InterviewModal: React.FC<InterviewModalProps> = ({ target, myMosques, imams, onClose, onConfirm }) => {
  const application = target?.application ?? null;
  const fixedMosqueId = application?.mosqueId;

  const [mosqueId, setMosqueId] = useState<string>('');
  const [interviewDate, setInterviewDate] = useState(tomorrow());
  const [interviewTime, setInterviewTime] = useState('19:00');
  const [contactMethod, setContactMethod] = useState<Method>('whatsapp');
  const [contactDetail, setContactDetail] = useState('');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);

  // The contact detail sent to the imam is the MOSQUE's own contact (not the imam's).
  const { contact: mosqueContact } = useContact<MosqueContact>('mosque', mosqueId || undefined, !!target && !!mosqueId);

  useEffect(() => {
    if (!target) return;
    setMosqueId(fixedMosqueId || myMosques[0]?.id || '');
    setInterviewDate(tomorrow());
    setInterviewTime('19:00');
    setContactMethod('whatsapp');
    setNotes('يسر لجنة المسجد التواصل مع فضيلتكم لمناقشة تفاصيل العمل والعقد والسكن.');
  }, [target]);

  useEffect(() => {
    if (!mosqueContact) return;
    setContactDetail(
      contactMethod === 'email'
        ? mosqueContact.email
        : contactMethod === 'phone'
        ? mosqueContact.phone
        : mosqueContact.whatsapp || mosqueContact.phone
    );
  }, [mosqueContact, contactMethod]);

  const dialogRef = useDialog(!!target, onClose);

  if (!target) return null;

  const imamFromApp = application ? imams.find((i) => i.id === application.imamId) : null;
  const imam = target.imam ?? imamFromApp ?? null;
  const imamName = application?.imamName ?? imam?.name ?? '';
  const imamUid = application?.imamUid ?? imam?.ownerUid ?? '';
  const imamId = application?.imamId ?? imam?.id ?? '';
  const mosque = myMosques.find((m) => m.id === mosqueId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mosque || !imamUid || !contactDetail.trim()) return;
    setSending(true);
    await onConfirm({
      mosque,
      imamUid,
      imamId,
      imamName,
      dateTime: `${interviewDate} الساعة ${interviewTime}`,
      methodLabel: METHOD_LABEL[contactMethod],
      contactDetail: contactDetail.trim(),
      notes,
    });
    setSending(false);
  };

  const methodBtn = (m: Method, icon: React.ReactNode, active: string) => (
    <button
      type="button"
      onClick={() => setContactMethod(m)}
      aria-pressed={contactMethod === m}
      className={`p-2.5 rounded-xl border font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
        contactMethod === m ? active : 'border-slate-200 text-slate-600 hover:bg-slate-50'
      }`}
    >
      {icon}
      <span>{METHOD_LABEL[m].split(' (')[0]}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" role="dialog" ref={dialogRef} tabIndex={-1} aria-modal="true">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-7 shadow-2xl my-8 text-xs space-y-5">
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-xl font-bold">📞</span>
            <div>
              <h4 className="text-base font-black text-slate-900 font-amiri">طلب تواصل رسمي مع الشيخ</h4>
              <p className="text-xs text-slate-500">المرشح: {imamName}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="إغلاق" className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {myMosques.length === 0 ? (
          <p className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 font-bold">
            يجب أن يكون لديك إعلان مسجد معتمد من الإدارة لإرسال طلبات التواصل.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!fixedMosqueId && myMosques.length > 1 && (
              <div>
                <label htmlFor="iv-mosque" className="block font-bold text-slate-700 mb-1">باسم أي مسجد؟ *</label>
                <select
                  id="iv-mosque"
                  value={mosqueId}
                  onChange={(e) => setMosqueId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white font-bold"
                >
                  {myMosques.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.mosqueName} ({m.city})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="iv-date" className="block font-bold text-slate-700 mb-1">التاريخ المقترح *</label>
                <input id="iv-date" type="date" required min={new Date().toISOString().split('T')[0]} value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white" />
              </div>
              <div>
                <label htmlFor="iv-time" className="block font-bold text-slate-700 mb-1">التوقيت المقترح *</label>
                <input id="iv-time" type="time" required value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white" />
              </div>
            </div>

            <div>
              <p className="block font-bold text-slate-700 mb-1">وسيلة التواصل المفضلة *</p>
              <div className="grid grid-cols-3 gap-2">
                {methodBtn('whatsapp', <MessageSquare className="w-4 h-4 text-emerald-600" />, 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm')}
                {methodBtn('phone', <Phone className="w-4 h-4 text-sky-600" />, 'border-sky-600 bg-sky-50 text-sky-950 shadow-sm')}
                {methodBtn('email', <Mail className="w-4 h-4 text-amber-600" />, 'border-amber-500 bg-amber-50 text-amber-950 shadow-sm')}
              </div>
            </div>

            <div>
              <label htmlFor="iv-contact" className="block font-bold text-slate-700 mb-1">
                {contactMethod === 'email' ? 'بريد المسجد الذي سيتواصل عليه الشيخ *' : 'رقم المسجد الذي سيتواصل عليه الشيخ *'}
              </label>
              <input id="iv-contact" type="text" required maxLength={200} value={contactDetail}
                onChange={(e) => setContactDetail(e.target.value)}
                placeholder={contactMethod === 'email' ? 'contact@mosque.org' : '+49 176...'}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white" dir="ltr" />
            </div>

            <div>
              <label htmlFor="iv-notes" className="block font-bold text-slate-700 mb-1">رسالة للإمام</label>
              <textarea id="iv-notes" rows={3} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-3 bg-white leading-relaxed text-xs" />
            </div>

            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-900">
              سيتم إرسال الموعد ووسيلة التواصل إلى علبة رسائل الإمام داخل المنصة.
            </div>

            <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 cursor-pointer">
                إلغاء
              </button>
              <button
                type="submit"
                disabled={sending || !mosque || !imamUid}
                className="bg-emerald-700 hover:bg-emerald-600 text-white font-black px-6 py-2 rounded-xl shadow cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>إرسال طلب التواصل</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
