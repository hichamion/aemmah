import React, { useState } from 'react';
import { MessageSquarePlus, X } from 'lucide-react';
import { t } from '../i18n';

const KEY = 'aemmah-admin-contact-hint';

/** Reminds imams and mosques that they can write to the platform team (suggestions, questions). */
export const AdminContactNotice: React.FC<{ onWrite: () => void }> = ({ onWrite }) => {
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(KEY) === 'hidden';
    } catch {
      return false;
    }
  });
  if (hidden) return null;
  const hide = () => {
    setHidden(true);
    try {
      localStorage.setItem(KEY, 'hidden');
    } catch {
      // ignore
    }
  };
  return (
    <div className="relative flex flex-wrap items-center gap-3 bg-sky-50 border border-sky-200 rounded-2xl p-4 pe-10 text-sky-950" role="note">
      <span className="w-10 h-10 shrink-0 rounded-xl bg-sky-600 text-white flex items-center justify-center">
        <MessageSquarePlus className="w-5 h-5" />
      </span>
      <div className="flex-1 min-w-48">
        <p className="font-black text-sm">{t('إدارة المنصة في خدمتك')}</p>
        <p className="text-xs leading-relaxed text-sky-900/85">
          {t('لديك اقتراح أو استفسار أو واجهتك مشكلة؟ راسل إدارة منصة أئمة مباشرة من هنا، ويصلك الرد في علبة رسائلك.')}
        </p>
      </div>
      <button type="button" onClick={onWrite}
        className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-black cursor-pointer">
        <MessageSquarePlus className="w-4 h-4" /> {t('مراسلة الإدارة')}
      </button>
      <button type="button" onClick={hide} aria-label={t('إخفاء هذا التنبيه')}
        className="absolute top-2 end-2 w-7 h-7 rounded-full text-sky-700 hover:bg-sky-100 flex items-center justify-center cursor-pointer">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
