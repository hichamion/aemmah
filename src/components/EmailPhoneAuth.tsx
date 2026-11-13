import React, { useState } from 'react';
import type { ConfirmationResult } from 'firebase/auth';
import { Loader2, Mail, Smartphone } from 'lucide-react';
import { resetPassword, sendPhoneCode, signInWithEmail, signUpWithEmail } from '../lib/auth';
import { isValidEmail } from '../utils/helpers';

type Mode = 'email' | 'phone';
type EmailStep = 'signin' | 'signup' | 'reset';

interface Props {
  showEmail: boolean;
  showPhone: boolean;
  /** Called after a successful sign-in; the auth listener in App takes over from there. */
  onSignedIn: () => void;
  onError: (err: unknown) => void;
  onInfo: (msg: string) => void;
}

const field =
  'w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600';
const primary =
  'w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-black py-3 rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer';

/** E-mail/password and phone (SMS) sign-in, shown under the Google/Facebook buttons. */
export const EmailPhoneAuth: React.FC<Props> = ({ showEmail, showPhone, onSignedIn, onError, onInfo }) => {
  const [mode, setMode] = useState<Mode | null>(null);
  const [emailStep, setEmailStep] = useState<EmailStep>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState('');

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setHint('');
    try {
      await fn();
    } catch (err) {
      onError(err);
    } finally {
      setBusy(false);
    }
  };

  const handleEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setHint('البريد الإلكتروني غير صحيح.');
    if (emailStep === 'reset') {
      return run(async () => {
        await resetPassword(email);
        onInfo('أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك.');
        setEmailStep('signin');
      });
    }
    if (password.length < (emailStep === 'signup' ? 8 : 1)) return setHint('كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
    run(async () => {
      if (emailStep === 'signup') {
        await signUpWithEmail(email, password);
        onInfo('تم إنشاء حسابك، وأرسلنا رسالة لتأكيد بريدك.');
      } else {
        await signInWithEmail(email, password);
      }
      onSignedIn();
    });
  };

  const handlePhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmation) {
      const normalized = phone.replace(/[\s\-()]/g, '').replace(/^00/, '+');
      if (!/^\+[1-9]\d{6,14}$/.test(normalized)) {
        return setHint('اكتب الرقم بالصيغة الدولية مع رمز البلد، مثل ‎+49 151 2345678');
      }
      return run(async () => {
        setConfirmation(await sendPhoneCode(normalized, 'recaptcha-container'));
        onInfo('أرسلنا رمز التحقق برسالة SMS.');
      });
    }
    if (!/^\d{6}$/.test(code.trim())) return setHint('رمز التحقق مكوّن من 6 أرقام.');
    run(async () => {
      await confirmation.confirm(code.trim());
      onSignedIn();
    });
  };

  if (!showEmail && !showPhone) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px bg-slate-200 flex-1" />
        <span>أو</span>
        <span className="h-px bg-slate-200 flex-1" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {showEmail && (
          <button
            type="button"
            onClick={() => setMode(mode === 'email' ? null : 'email')}
            aria-expanded={mode === 'email'}
            className={`py-3 rounded-2xl border-2 font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition ${
              mode === 'email' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-300 text-slate-800 hover:border-emerald-600'
            }`}
          >
            <Mail className="w-5 h-5" />
            <span>البريد الإلكتروني</span>
          </button>
        )}
        {showPhone && (
          <button
            type="button"
            onClick={() => setMode(mode === 'phone' ? null : 'phone')}
            aria-expanded={mode === 'phone'}
            className={`py-3 rounded-2xl border-2 font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition ${
              mode === 'phone' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-300 text-slate-800 hover:border-emerald-600'
            }`}
          >
            <Smartphone className="w-5 h-5" />
            <span>رقم الهاتف</span>
          </button>
        )}
      </div>

      {mode === 'email' && (
        <form onSubmit={handleEmail} className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <p className="font-black text-slate-900 text-sm">
            {emailStep === 'signin' ? 'الدخول بالبريد الإلكتروني' : emailStep === 'signup' ? 'إنشاء حساب بالبريد' : 'استعادة كلمة المرور'}
          </p>
          <input
            type="email"
            dir="ltr"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${field} text-left`}
            aria-label="البريد الإلكتروني"
          />
          {emailStep !== 'reset' && (
            <input
              type="password"
              dir="ltr"
              autoComplete={emailStep === 'signup' ? 'new-password' : 'current-password'}
              placeholder={emailStep === 'signup' ? 'كلمة مرور (8 أحرف على الأقل)' : 'كلمة المرور'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${field} text-left`}
              aria-label="كلمة المرور"
            />
          )}
          {hint && <p className="text-red-700 text-xs font-bold">{hint}</p>}
          <button type="submit" disabled={busy} className={primary}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{emailStep === 'signin' ? 'دخول' : emailStep === 'signup' ? 'إنشاء الحساب' : 'إرسال رابط الاستعادة'}</span>
          </button>
          <div className="flex flex-wrap justify-between gap-2 text-xs font-bold">
            {emailStep === 'signin' ? (
              <>
                <button type="button" onClick={() => setEmailStep('signup')} className="text-emerald-800 underline cursor-pointer">
                  ليس لديك حساب؟ أنشئ حساباً
                </button>
                <button type="button" onClick={() => setEmailStep('reset')} className="text-slate-500 underline cursor-pointer">
                  نسيت كلمة المرور؟
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setEmailStep('signin')} className="text-emerald-800 underline cursor-pointer">
                لديك حساب؟ سجّل الدخول
              </button>
            )}
          </div>
        </form>
      )}

      {mode === 'phone' && (
        <form onSubmit={handlePhone} className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <p className="font-black text-slate-900 text-sm">الدخول برقم الهاتف</p>
          {!confirmation ? (
            <input
              type="tel"
              dir="ltr"
              autoComplete="tel"
              placeholder="+49 151 2345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`${field} text-left`}
              aria-label="رقم الهاتف بالصيغة الدولية"
            />
          ) : (
            <input
              inputMode="numeric"
              dir="ltr"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`${field} text-left tracking-widest`}
              aria-label="رمز التحقق"
            />
          )}
          {hint && <p className="text-red-700 text-xs font-bold">{hint}</p>}
          <button type="submit" disabled={busy} className={primary}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{confirmation ? 'تأكيد الرمز والدخول' : 'إرسال رمز التحقق'}</span>
          </button>
          {confirmation && (
            <button
              type="button"
              onClick={() => {
                setConfirmation(null);
                setCode('');
              }}
              className="text-xs font-bold text-slate-500 underline cursor-pointer"
            >
              تغيير الرقم أو إعادة الإرسال
            </button>
          )}
        </form>
      )}

      {/* Invisible reCAPTCHA used by phone sign-in. */}
      <div id="recaptcha-container" />
    </div>
  );
};
