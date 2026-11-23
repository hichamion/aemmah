import React, { useState } from 'react';
import { Loader2, LogOut, RotateCcw, Trash2 } from 'lucide-react';
import { UserProfile } from '../types';
import { accountDeletionDate } from '../lib/db';
import { useDialog } from '../lib/useDialog';
import { locale, t } from '../i18n';

/** Arabic date such as «الأربعاء 25 نوفمبر 2026». */
export const formatDeletionDate = (d: Date) =>
  d.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Shown to a user who asked to delete the account and signed in again during the grace week:
 * restore everything, delete for good right now, or just sign out.
 */
export const DeletionPendingModal: React.FC<{
  profile: UserProfile;
  onRestore: () => Promise<void>;
  onDeleteNow: () => Promise<void>;
  onSignOut: () => void;
}> = ({ profile, onRestore, onDeleteNow, onSignOut }) => {
  const dialogRef = useDialog(true);
  const [busy, setBusy] = useState<'' | 'restore' | 'delete'>('');
  const due = accountDeletionDate(profile.deletionRequestedAt!);
  const overdue = due.getTime() <= Date.now();

  const run = async (kind: 'restore' | 'delete', fn: () => Promise<void>) => {
    setBusy(kind);
    try {
      await fn();
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] overflow-y-auto">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="del-title"
        tabIndex={-1}
        className="keep-light bg-white text-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <Trash2 className="w-7 h-7" />
        </div>
        <h2 id="del-title" className="text-xl font-black text-center text-slate-900">
          {t('حسابك في طريقه إلى الحذف')}
        </h2>
        <p className="text-sm leading-relaxed text-center text-slate-600">
          {t('طلبت حذف حسابك، فأخفينا ملفك وإعلاناتك عن الجميع.')}{' '}
          {overdue ? (
            <>{t('انتهت مهلة الأسبوع، وسيُحذف الحساب نهائياً قريباً.')}</>
          ) : (
            <>
              {t('سيُحذف الحساب وكل بياناته نهائياً يوم')} <b className="text-slate-900">{formatDeletionDate(due)}</b>.
            </>
          )}
        </p>
        <p className="text-sm leading-relaxed text-center text-slate-600">{t('هل غيّرت رأيك؟ يمكنك استرجاع حسابك كما كان.')}</p>

        <div className="space-y-2 pt-1">
          <button
            onClick={() => run('restore', onRestore)}
            disabled={!!busy}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black cursor-pointer disabled:opacity-60"
          >
            {busy === 'restore' ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5" />}
            {t('استرجاع حسابي')}
          </button>
          <button
            onClick={() => run('delete', onDeleteNow)}
            disabled={!!busy}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-black cursor-pointer disabled:opacity-60"
          >
            {busy === 'delete' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
            {t('احذفه الآن نهائياً')}
          </button>
          <button
            onClick={onSignOut}
            disabled={!!busy}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-slate-500 hover:bg-slate-100 font-bold text-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            {t('تسجيل الخروج وترك الحذف كما هو')}
          </button>
        </div>
      </div>
    </div>
  );
};
