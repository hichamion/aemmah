import React, { useState } from 'react';
import { ArrowRight, Check, Copy, HeartHandshake, Landmark, Wallet } from 'lucide-react';
import { SUPPORT } from '../config';

/** Optional support page: bank transfer and/or PayPal, as configured in src/config.ts. */
export const SupportPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [copied, setCopied] = useState('');
  const { bank, paypalUrl } = SUPPORT;

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value.replace(/\s+/g, label === 'iban' ? '' : ' '));
      setCopied(label);
      window.setTimeout(() => setCopied(''), 2000);
    } catch {
      // Clipboard not available: the value is visible and selectable anyway.
    }
  };

  const bankRows = [
    { key: 'holder', label: 'صاحب الحساب', value: bank.holder },
    { key: 'iban', label: 'IBAN', value: bank.iban, ltr: true },
    { key: 'bic', label: 'BIC', value: bank.bic, ltr: true },
    { key: 'bankName', label: 'البنك', value: bank.bankName },
    { key: 'reference', label: 'سبب التحويل', value: bank.reference },
  ].filter((r) => r.value);

  return (
    <section className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full space-y-4">
      <button onClick={onBack} className="text-brass-300 hover:text-brass-200 font-bold text-sm flex items-center gap-1 cursor-pointer">
        <ArrowRight className="w-4 h-4" />
        <span>العودة للرئيسية</span>
      </button>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-amiri flex items-center gap-2">
            <HeartHandshake className="w-7 h-7 text-emerald-700" />
            ادعم منصة أئمة
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            المنصة مجانية للأئمة والمساجد. الدعم اختياري تماماً، ويساعد على تغطية تكاليف التشغيل والتطوير. جزاكم الله
            خيراً.
          </p>
        </header>

        {bank.iban && (
          <div className="border border-slate-200 rounded-2xl p-5 space-y-3">
            <h2 className="font-black text-slate-900 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-emerald-700" />
              التحويل البنكي
            </h2>
            <dl className="space-y-2 text-sm">
              {bankRows.map((r) => (
                <div key={r.key} className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 rounded-xl px-3.5 py-2.5">
                  <dt className="text-slate-500 font-bold">{r.label}</dt>
                  <dd className="flex items-center gap-2">
                    <span dir={r.ltr ? 'ltr' : undefined} className="font-bold text-slate-900 select-all">
                      {r.value}
                    </span>
                    <button
                      onClick={() => copy(r.key, r.value)}
                      aria-label={`نسخ ${r.label}`}
                      className="text-slate-400 hover:text-emerald-700 p-1 cursor-pointer"
                    >
                      {copied === r.key ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {paypalUrl && (
          <div className="border border-slate-200 rounded-2xl p-5 space-y-3">
            <h2 className="font-black text-slate-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-sky-700" />
              PayPal
            </h2>
            <a
              href={paypalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#0070ba] hover:bg-[#005ea6] text-white font-black px-6 py-3 rounded-xl text-sm"
            >
              الدعم عبر PayPal
            </a>
          </div>
        )}
      </div>
    </section>
  );
};
