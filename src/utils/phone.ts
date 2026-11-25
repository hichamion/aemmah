/*
 * International phone numbers. Imams pick a country (its dial code is shown) and type the rest of the
 * number; it is stored as «+<code><number>» so WhatsApp links (wa.me) work. Old numbers typed without
 * the code are fixed with the dial code of the country the imam lives in, dropping the leading 0.
 */

/** [ISO code, dial code, names used to recognise the country in free text (Arabic and Latin)]. */
export const DIAL_COUNTRIES: [string, string, string[]][] = [
  ['MA', '212', ['المغرب', 'مغرب', 'morocco', 'maroc', 'marokko', 'fas']],
  ['DZ', '213', ['الجزائر', 'algeria', 'algérie', 'algerie', 'algerien', 'cezayir']],
  ['TN', '216', ['تونس', 'tunisia', 'tunisie', 'tunesien', 'tunus']],
  ['EG', '20', ['مصر', 'egypt', 'égypte', 'egypte', 'ägypten', 'mısır']],
  ['LY', '218', ['ليبيا', 'libya', 'libye', 'libyen']],
  ['MR', '222', ['موريتانيا', 'mauritania', 'mauritanie']],
  ['SD', '249', ['السودان', 'sudan', 'soudan']],
  ['SN', '221', ['السنغال', 'senegal', 'sénégal']],
  ['ML', '223', ['مالي', 'mali']],
  ['DE', '49', ['ألمانيا', 'المانيا', 'germany', 'allemagne', 'deutschland', 'almanya']],
  ['FR', '33', ['فرنسا', 'france', 'frankreich', 'fransa']],
  ['BE', '32', ['بلجيكا', 'belgium', 'belgique', 'belgien', 'belçika']],
  ['NL', '31', ['هولندا', 'netherlands', 'pays-bas', 'niederlande', 'hollanda']],
  ['ES', '34', ['إسبانيا', 'اسبانيا', 'spain', 'espagne', 'spanien', 'ispanya']],
  ['IT', '39', ['إيطاليا', 'ايطاليا', 'italy', 'italie', 'italien', 'italya']],
  ['GB', '44', ['المملكة المتحدة', 'بريطانيا', 'انجلترا', 'إنجلترا', 'united kingdom', 'uk', 'england', 'royaume-uni', 'großbritannien']],
  ['CH', '41', ['سويسرا', 'switzerland', 'suisse', 'schweiz', 'isviçre']],
  ['AT', '43', ['النمسا', 'austria', 'autriche', 'österreich', 'avusturya']],
  ['SE', '46', ['السويد', 'sweden', 'suède', 'schweden', 'isveç']],
  ['NO', '47', ['النرويج', 'norway', 'norvège', 'norwegen', 'norveç']],
  ['DK', '45', ['الدنمارك', 'denmark', 'danemark', 'dänemark', 'danimarka']],
  ['FI', '358', ['فنلندا', 'finland', 'finlande', 'finnland', 'finlandiya']],
  ['IE', '353', ['أيرلندا', 'ايرلندا', 'ireland', 'irlande', 'irland', 'irlanda']],
  ['PT', '351', ['البرتغال', 'portugal', 'portekiz']],
  ['LU', '352', ['لوكسمبورغ', 'luxembourg', 'luxemburg', 'lüksemburg']],
  ['PL', '48', ['بولندا', 'poland', 'pologne', 'polen', 'polonya']],
  ['GR', '30', ['اليونان', 'greece', 'grèce', 'griechenland', 'yunanistan']],
  ['BA', '387', ['البوسنة', 'bosnia', 'bosnie', 'bosnien']],
  ['AL', '355', ['ألبانيا', 'albania', 'albanie', 'albanien']],
  ['XK', '383', ['كوسوفو', 'kosovo']],
  ['TR', '90', ['تركيا', 'turkey', 'turquie', 'türkei', 'türkiye']],
  ['SA', '966', ['السعودية', 'saudi', 'arabie saoudite', 'saudi-arabien']],
  ['AE', '971', ['الإمارات', 'الامارات', 'emirates', 'uae', 'émirats']],
  ['QA', '974', ['قطر', 'qatar', 'katar']],
  ['KW', '965', ['الكويت', 'kuwait', 'koweït']],
  ['BH', '973', ['البحرين', 'bahrain', 'bahreïn']],
  ['OM', '968', ['عمان', 'عُمان', 'oman']],
  ['JO', '962', ['الأردن', 'الاردن', 'jordan', 'jordanie', 'jordanien']],
  ['PS', '970', ['فلسطين', 'palestine', 'palästina', 'filistin']],
  ['LB', '961', ['لبنان', 'lebanon', 'liban', 'libanon', 'lübnan']],
  ['SY', '963', ['سوريا', 'سورية', 'syria', 'syrie', 'syrien', 'suriye']],
  ['IQ', '964', ['العراق', 'iraq', 'irak']],
  ['YE', '967', ['اليمن', 'yemen', 'yémen', 'jemen']],
  ['SO', '252', ['الصومال', 'somalia', 'somalie']],
  ['NG', '234', ['نيجيريا', 'nigeria']],
  ['PK', '92', ['باكستان', 'pakistan']],
  ['BD', '880', ['بنغلاديش', 'bangladesh']],
  ['ID', '62', ['إندونيسيا', 'اندونيسيا', 'indonesia', 'indonésie']],
  ['MY', '60', ['ماليزيا', 'malaysia', 'malaisie']],
  ['US', '1', ['الولايات المتحدة', 'أمريكا', 'امريكا', 'usa', 'united states', 'états-unis', 'usa']],
  ['CA', '1', ['كندا', 'canada', 'kanada']],
];

const byIso = new Map(DIAL_COUNTRIES.map(([iso, code]) => [iso, code]));
export const dialCode = (iso: string) => byIso.get(iso) || '';

const norm = (s: string) => s.toLowerCase().replace(/[ـ]/g, '').trim();

/** Country (ISO) named in a free text such as «فاس، المغرب» or «Köln, Deutschland»; the last part wins. */
export function countryFromText(text: string | undefined): string {
  const parts = (text || '').split(/[،,\-–/|]+/).map(norm).filter(Boolean).reverse();
  for (const part of parts) {
    for (const [iso, , names] of DIAL_COUNTRIES) {
      if (names.some((n) => part === norm(n) || (norm(n).length > 3 && part.includes(norm(n))))) return iso;
    }
  }
  return '';
}

const digits = (s: string) => (s || '').replace(/\D/g, '');

/**
 * «+<code><number>» from what the user typed. Already international (+… or 00…) stays as it is;
 * otherwise the dial code of `iso` is added and leading zeros are dropped. '' if it cannot be done.
 */
export function toInternational(raw: string, iso: string): string {
  const t = (raw || '').trim();
  if (!t) return '';
  if (t.startsWith('+')) return '+' + digits(t);
  if (t.startsWith('00')) return '+' + digits(t).slice(2);
  const code = dialCode(iso);
  if (!code) return '';
  const d = digits(t);
  // Typed with the code but without «+» (e.g. 212612345678).
  if (!d.startsWith('0') && d.startsWith(code) && d.length >= code.length + 8) return '+' + d;
  const local = d.replace(/^0+/, '');
  return local ? `+${code}${local}` : '';
}

/** Splits a stored number into country + national part (for editing); falls back to `fallbackIso`. */
export function splitInternational(raw: string, fallbackIso: string): { iso: string; local: string } {
  const t = (raw || '').trim();
  if (t.startsWith('+') || t.startsWith('00')) {
    const d = t.startsWith('+') ? digits(t) : digits(t).slice(2);
    // Longest dial code first; prefer the fallback country when codes are shared (+1).
    const matches = DIAL_COUNTRIES.filter(([, code]) => d.startsWith(code)).sort((a, b) => b[1].length - a[1].length);
    const best = matches.find(([iso]) => iso === fallbackIso) || matches[0];
    if (best) return { iso: best[0], local: d.slice(best[1].length) };
    return { iso: fallbackIso, local: d };
  }
  return { iso: fallbackIso, local: digits(t).replace(/^0+/, '') };
}

/** Plausible international number: «+» and 8 to 15 digits. */
export const isInternationalPhone = (v: string) => /^\+[1-9]\d{7,14}$/.test((v || '').trim());
