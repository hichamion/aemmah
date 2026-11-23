import React from 'react';
import { Lock, Mail, MessageSquare, Phone, Loader2 } from 'lucide-react';
import { useContact } from '../lib/db';
import { ImamContact, MosqueContact } from '../types';
import { telLink, whatsappLink } from '../utils/helpers';

interface ContactBlockProps {
  kind: 'imam' | 'mosque';
  id: string;
  /** Whether the current user is expected to have access (avoids pointless requests for visitors). */
  canView: boolean;
  /** Text shown when access is not allowed. */
  lockedText: string;
  /** Optional action for the locked state (e.g. open the login modal). */
  onLockedClick?: () => void;
  lockedActionText?: string;
  /** 'card' = compact block inside list cards, 'inline' = one text line (admin lists). */
  variant?: 'card' | 'inline';
  emailSubject?: string;
}

/**
 * Loads contact details from the protected collections (imamContacts / mosqueContacts).
 * The data never reaches the browser unless the security rules allow it.
 */
export const ContactBlock: React.FC<ContactBlockProps> = ({
  kind,
  id,
  canView,
  lockedText,
  onLockedClick,
  lockedActionText = 'دخول',
  variant = 'card',
  emailSubject,
}) => {
  const { contact, loading, denied } = useContact<ImamContact | MosqueContact>(kind, id, canView);

  if (!canView || denied) {
    if (variant === 'inline') {
      return <span className="text-slate-400 text-xs">{lockedText}</span>;
    }
    return (
      <button
        type="button"
        onClick={onLockedClick}
        disabled={!onLockedClick}
        className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between transition text-xs cursor-pointer disabled:cursor-default"
      >
        <span className="text-slate-600 font-semibold flex items-center gap-1.5 text-start">
          <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span>{lockedText}</span>
        </span>
        {onLockedClick && <span className="text-emerald-800 font-bold underline shrink-0">{lockedActionText}</span>}
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-400 p-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>جاري تحميل بيانات التواصل…</span>
      </div>
    );
  }

  if (!contact) {
    return <span className="text-slate-400 text-xs">لم تُضف بيانات تواصل بعد.</span>;
  }

  const wa = whatsappLink(contact.whatsapp || contact.phone);
  const tel = telLink(contact.phone || contact.whatsapp);
  const mail = contact.email
    ? `mailto:${contact.email}${emailSubject ? `?subject=${encodeURIComponent(emailSubject)}` : ''}`
    : undefined;
  const person = 'contactPerson' in contact ? contact.contactPerson : '';

  if (variant === 'inline') {
    return (
      <span className="text-emerald-900 font-bold text-xs" dir="ltr">
        📞 {contact.phone || contact.whatsapp || '—'} | ✉️ {contact.email || '—'}
      </span>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
      <div className="text-xs text-slate-700 font-semibold space-y-0.5">
        {person && <p>المسؤول: {person}</p>}
        <p dir="ltr" className="text-right">
          {[contact.phone || contact.whatsapp, contact.email].filter(Boolean).join(' · ')}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-2 rounded-lg text-xs flex items-center justify-center gap-1 transition"
          >
            <MessageSquare className="w-3 h-3" />
            <span>واتساب</span>
          </a>
        ) : (
          <span />
        )}
        {tel ? (
          <a
            href={tel}
            className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-1.5 px-2 rounded-lg text-xs flex items-center justify-center gap-1 transition"
          >
            <Phone className="w-3 h-3" />
            <span>هاتف</span>
          </a>
        ) : (
          <span />
        )}
        {mail ? (
          <a
            href={mail}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 px-2 rounded-lg text-xs flex items-center justify-center gap-1 transition"
          >
            <Mail className="w-3 h-3" />
            <span>إيميل</span>
          </a>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
};
