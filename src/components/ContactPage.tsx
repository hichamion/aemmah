import React, { useState } from 'react';
import { ArrowRight, Loader2, MessageSquare, Send } from 'lucide-react';
import { FeedbackKind } from '../types';
import { isValidEmail } from '../utils/helpers';

const KINDS: { value: FeedbackKind; label: string }[] = [
  { value: 'message', label: 'رسالة إلى الإدارة' },
  { value: 'suggestion', label: 'اقتراح لتحسين المنصة' },
  { value: 'problem', label: 'الإبلاغ عن مشكلة تقنية' },
];

interface ContactPageProps {
  defaultName: string;
  defaultEmail: string;
  onBack: () => void;
  onSend: (item: { kind: FeedbackKind; name: string; email: string; message: string }) => Promise<boolean>;
}

/** "Contact the admin / send a suggestion" — open to visitors too (no account needed). */
export const ContactPage: React.FC<ContactPageProps> = ({ defaultName, defaultEmail, onBack, onSend }) => {
  const [kind, setKind] = useState<FeedbackKind>('message');
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot: hidden field that only bots fill in
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (website) return; // silently drop bot submissions
    if (message.trim().length < 10) return setError('اكتب رسالتك في 10 أحرف على الأقل.');
    if (email.trim() && !isValidEmail(email)) return setError('البريد الإلكتروني غير صحيح.');
    setSending(true);
    const ok = await onSend({ kind, name, email, message });
    setSending(false);
    if (ok) {
      setSent(true);
      setMessage('');
    }
  };

  const field = 'w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600';

  return (
    <section className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full space-y-4">
      <button onClick={onBack} className="text-emerald-800 font-bold text-sm flex items-center gap-1 cursor-pointer">
        <ArrowRight className="w-4 h-4" />
        <span>العودة للرئيسية</span>
      </button>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5">
        <header className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-amiri flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-700" />
            راسل الإدارة أو أرسل اقتراحاً
          </h1>
          <p className="text-sm text-slate-600">
            رسالتك تصل إلى إدارة منصة أئمة فقط. اترك بريدك إن أردت أن نرد عليك.
          </p>
        </header>

        {sent ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3 text-sm text-emerald-900">
            <p className="font-bold">شكراً لك، وصلت رسالتك إلى الإدارة.</p>
            <button onClick={() => setSent(false)} className="text-emerald-800 underline font-bold cursor-pointer">
              إرسال رسالة أخرى
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <label className="block space-y-1.5">
              <span className="font-bold text-slate-800">نوع الرسالة</span>
              <select value={kind} onChange={(e) => setKind(e.target.value as FeedbackKind)} className={field}>
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="font-bold text-slate-800">الاسم (اختياري)</span>
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={field} />
              </label>
              <label className="block space-y-1.5">
                <span className="font-bold text-slate-800">البريد الإلكتروني (اختياري، للرد)</span>
                <input
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={200}
                  className={`${field} text-left`}
                />
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="font-bold text-slate-800">رسالتك</span>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                maxLength={3000}
                className={field}
              />
              <span className="block text-xs text-slate-400 text-left">{message.length} / 3000</span>
            </label>

            {/* Honeypot: invisible to people, bots fill it in. */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="hidden"
              name="website"
            />

            {error && <p className="text-red-700 font-bold">{error}</p>}

            <button
              type="submit"
              disabled={sending}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-black px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>إرسال</span>
            </button>
          </form>
        )}
      </div>
    </section>
  );
};
