import React, { useEffect, useMemo, useState } from 'react';
import { DIAL_COUNTRIES, dialCode, splitInternational } from '../utils/phone';
import { locale, t } from '../i18n';

/** Countries most imams come from or live in, shown first. */
const FIRST = ['MA', 'DZ', 'TN', 'EG', 'DE', 'FR', 'BE', 'NL', 'ES', 'IT', 'GB'];

/**
 * Phone number in international form: the country (with its dial code) is chosen from a list and only
 * the rest of the number is typed. `value` / `onChange` carry the full number, e.g. «+212612345678».
 */
export const PhoneField: React.FC<{
  id: string;
  value: string;
  onChange: (v: string) => void;
  /** Country used when the number has no code yet (e.g. the imam's country of residence). */
  defaultIso: string;
  required?: boolean;
  className?: string;
}> = ({ id, value, onChange, defaultIso, required, className = '' }) => {
  const [iso, setIso] = useState(() => splitInternational(value, defaultIso).iso);
  const [local, setLocal] = useState(() => splitInternational(value, defaultIso).local);

  // A value loaded later (editing an existing profile) or a residence typed before any number.
  useEffect(() => {
    const s = splitInternational(value, iso || defaultIso);
    const d = local.replace(/\D/g, '').replace(/^0+/, '');
    const mine = iso && d ? `+${dialCode(iso)}${d}` : '';
    if (value !== mine) {
      setIso(s.iso);
      setLocal(s.local);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  useEffect(() => {
    if (!iso && defaultIso) setIso(defaultIso);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultIso]);

  const names = useMemo(() => {
    let dn: Intl.DisplayNames | null = null;
    try {
      dn = new Intl.DisplayNames([locale()], { type: 'region' });
    } catch {
      dn = null;
    }
    const list = DIAL_COUNTRIES.map(([c, code]) => ({ iso: c, code, name: (dn?.of(c === 'XK' ? 'XK' : c) as string) || c }));
    const first = FIRST.map((c) => list.find((x) => x.iso === c)!).filter(Boolean);
    const rest = list.filter((x) => !FIRST.includes(x.iso)).sort((a, b) => a.name.localeCompare(b.name, locale()));
    return { first, rest };
  }, []);

  const emit = (nextIso: string, nextLocal: string) => {
    const d = nextLocal.replace(/\D/g, '').replace(/^0+/, '');
    onChange(nextIso && d ? `+${dialCode(nextIso)}${d}` : '');
  };

  return (
    <div className="flex gap-2" dir="ltr">
      <select
        dir="ltr"
        aria-label={t('الدولة (المفتاح الدولي)')}
        value={iso}
        required={required}
        onChange={(e) => {
          setIso(e.target.value);
          emit(e.target.value, local);
        }}
        className={`${className} !w-auto max-w-[9.5rem] shrink-0 text-start`}
      >
        <option value="">{t('الدولة')}</option>
        {[...names.first, null, ...names.rest].map((c, i) =>
          c ? (
            <option key={c.iso} value={c.iso}>
              +{c.code} {c.name}
            </option>
          ) : (
            <option key={`sep${i}`} disabled>──────────</option>
          )
        )}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        required={required}
        maxLength={20}
        value={local}
        placeholder={iso === 'MA' ? '612345678' : '151 2345678'}
        onChange={(e) => {
          const raw = e.target.value;
          // A whole international number pasted (+212… / 00212…): take its country from it.
          if (/^\s*(\+|00)/.test(raw)) {
            const s = splitInternational(raw, iso);
            setIso(s.iso);
            setLocal(s.local);
            emit(s.iso, s.local);
            return;
          }
          const v = raw.replace(/[^\d\s-]/g, '');
          setLocal(v);
          emit(iso, v);
        }}
        dir="ltr"
        className={`${className} flex-1 min-w-0`}
      />
    </div>
  );
};
