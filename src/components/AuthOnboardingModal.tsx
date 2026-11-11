import React, { useEffect, useState } from 'react';
import { MosqueIcon } from './MosqueIcon';
import type { User } from 'firebase/auth';
import { X, CheckCircle2, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { createUserProfile, nowIso } from '../lib/db';
import { signInWith, signOutUser } from '../lib/auth';
import { DEFAULT_IMAM_SILHOUETTE_AVATAR } from '../utils/helpers';
import { LogoMark } from './Logo';
import { useDialog } from '../lib/useDialog';
import { EmailPhoneAuth } from './EmailPhoneAuth';
import { AUTH_METHODS } from '../config';

interface AuthOnboardingModalProps {
  isOpen: boolean;
  /** Signed in with Google/Facebook but no Aemmah profile yet. */
  needsOnboarding: boolean;
  firebaseUser: User | null;
  onClose: () => void;
  onError: (err: unknown) => void;
  onInfo: (msg: string) => void;
  onOnboardingComplete: (role: 'imam' | 'mosque') => void;
}

/**
 * Step 1: sign in with Google, Facebook, e-mail or phone (whichever AUTH_METHODS enables).
 * Step 2 (first sign-in only): choose the account type and accept the privacy policy.
 * The admin role cannot be chosen here — it is granted in the Firebase console (see README).
 */
export const AuthOnboardingModal: React.FC<AuthOnboardingModalProps> = ({
  isOpen,
  needsOnboarding,
  firebaseUser,
  onClose,
  onError,
  onInfo,
  onOnboardingComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [customName, setCustomName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'imam' | 'mosque'>('imam');
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  useEffect(() => {
    if (needsOnboarding && firebaseUser) {
      setCustomName(firebaseUser.displayName || '');
      setAcceptedPrivacy(false);
    }
  }, [needsOnboarding, firebaseUser?.uid]);

  const dialogRef = useDialog(isOpen, needsOnboarding ? undefined : onClose);

  if (!isOpen) return null;

  const step: 'login' | 'choose_role' = needsOnboarding && firebaseUser ? 'choose_role' : 'login';

  const handleSocialLogin = async (providerType: 'google' | 'facebook') => {
    setLoading(true);
    try {
      await signInWith(providerType);
      // If the user already has a profile, the auth listener in App takes over and we just close.
      onClose();
    } catch (err) {
      onError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOnboarding = async () => {
    // A signed-in user without a profile has no role; signing out keeps the state consistent.
    await signOutUser().catch(() => {});
    onClose();
  };

  const handleFinishOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !acceptedPrivacy) return;
    const name = customName.trim();
    if (!name) return;
    setLoading(true);
    try {
      const providerId = firebaseUser.providerData[0]?.providerId || '';
      await createUserProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: name.slice(0, 120),
        ...(firebaseUser.photoURL ? { photoURL: firebaseUser.photoURL } : {}),
        provider: providerId.includes('facebook')
          ? 'facebook'
          : providerId === 'password'
          ? 'password'
          : providerId === 'phone'
          ? 'phone'
          : 'google',
        role: selectedRole,
        verified: false,
        createdAt: nowIso(),
        privacyAcceptedAt: nowIso(),
      });
      onClose();
      onOnboardingComplete(selectedRole);
    } catch (err) {
      onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      ref={dialogRef}
      tabIndex={-1}
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl my-6 text-xs">
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <LogoMark className="w-11 h-11" />
            <div>
              <h3 className="text-lg sm:text-xl font-black font-amiri">
                {step === 'login' ? 'تسجيل الدخول إلى حسابك' : 'إكمال إنشاء حسابك'}
              </h3>
              <p className="text-xs text-slate-300">منصة أئمة للأئمة والمساجد</p>
            </div>
          </div>
          <button
            onClick={step === 'login' ? onClose : handleCancelOnboarding}
            aria-label="إغلاق"
            className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {step === 'login' ? (
            <div className="space-y-5">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-slate-700 leading-relaxed">
                <p className="font-extrabold text-slate-900 flex items-center gap-1.5 text-sm">
                  <Lock className="w-4 h-4 text-emerald-700" />
                  <span>تسجيل الدخول الآمن</span>
                </p>
                <p className="text-xs text-slate-600">
                  نستخدم اسمك ووسيلة الدخول فقط لإنشاء حسابك في المنصة، ولا نشاركها مع أحد.
                </p>
              </div>

              <div className="space-y-3">
                {AUTH_METHODS.google && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSocialLogin('google')}
                  className="w-full bg-white hover:bg-slate-50 text-slate-900 font-black py-3.5 px-4 rounded-2xl border-2 border-slate-300 shadow-xs hover:border-emerald-600 transition flex items-center justify-center gap-3 cursor-pointer text-sm disabled:opacity-60 disabled:cursor-wait"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z" />
                      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z" />
                      <path fill="#FBBC05" d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z" />
                      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 21.4 7.4 24 12 24z" />
                    </svg>
                  )}
                  <span>المتابعة باستخدام حساب جوجل (Google)</span>
                </button>
                )}

                {AUTH_METHODS.facebook && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSocialLogin('facebook')}
                  className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white font-black py-3.5 px-4 rounded-2xl shadow-sm transition flex items-center justify-center gap-3 cursor-pointer text-sm disabled:opacity-60 disabled:cursor-wait"
                >
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>المتابعة باستخدام فيسبوك (Facebook)</span>
                </button>
                )}
              </div>

              <EmailPhoneAuth
                showEmail={AUTH_METHODS.email}
                showPhone={AUTH_METHODS.phone}
                onSignedIn={onClose}
                onError={onError}
                onInfo={onInfo}
              />
            </div>
          ) : (
            <form onSubmit={handleFinishOnboarding} className="space-y-5">
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {selectedRole === 'mosque' ? (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-blue-700 text-white flex items-center justify-center shadow shrink-0">
                      <MosqueIcon className="w-6 h-6" />
                    </div>
                  ) : (
                    <img
                      src={DEFAULT_IMAM_SILHOUETTE_AVATAR}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-600 shadow shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-emerald-700">تم تسجيل الدخول بـ:</span>
                    <p className="font-black text-slate-900 text-sm truncate">{customName || 'اسم صاحب الحساب'}</p>
                    <p className="text-xs text-slate-500 truncate" dir="ltr">
                      {firebaseUser?.email}
                    </p>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              </div>

              <div>
                <label htmlFor="onb-name" className="block font-bold text-slate-700 mb-1">
                  الاسم الذي سيظهر في حسابك *
                </label>
                <input
                  id="onb-name"
                  type="text"
                  required
                  maxLength={120}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="مثال: الشيخ يوسف / مسجد النور"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white font-bold text-slate-900"
                />
              </div>

              <div className="space-y-2.5">
                <p className="block font-extrabold text-slate-900 text-sm">ما هي صفتك في المنصة؟</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('imam')}
                    aria-pressed={selectedRole === 'imam'}
                    className={`p-3.5 rounded-2xl border-2 text-right transition cursor-pointer flex items-center gap-3 ${
                      selectedRole === 'imam'
                        ? 'border-emerald-600 bg-emerald-50/90 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <img src={DEFAULT_IMAM_SILHOUETTE_AVATAR} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
                    <div>
                      <div className="font-black text-emerald-950 text-sm">أنا إمام / قارئ</div>
                      <p className="text-xs text-slate-600">إنشاء ملفي والتقديم للمساجد</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('mosque')}
                    aria-pressed={selectedRole === 'mosque'}
                    className={`p-3.5 rounded-2xl border-2 text-right transition cursor-pointer flex items-center gap-3 ${
                      selectedRole === 'mosque'
                        ? 'border-sky-500 bg-sky-50/90 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                      <MosqueIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-black text-sky-950 text-sm">نحن جمعية / مسجد</div>
                      <p className="text-xs text-slate-600">نشر إعلان والبحث عن إمام</p>
                    </div>
                  </button>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  لا يمكن تغيير نوع الحساب لاحقاً. حسابات المساجد ترى أرقام تواصل الأئمة بعد موافقة الإدارة على أول
                  إعلان لها.
                </p>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  قرأت{' '}
                  <a
                    href="#/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-800 font-bold underline"
                  >
                    سياسة الخصوصية
                  </a>{' '}
                  وأوافق على معالجة بياناتي لغرض الربط بين الأئمة والمساجد، وأعلم أنه يمكنني حذف حسابي وبياناتي في أي
                  وقت.
                </span>
              </label>

              <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancelOnboarding}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading || !acceptedPrivacy || !customName.trim()}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white font-black px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>إنشاء الحساب والمتابعة</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
