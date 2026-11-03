// Default picture for imams without a photo (public/default-imam.jpg).
export const DEFAULT_IMAM_SILHOUETTE_AVATAR = `${import.meta.env.BASE_URL}default-imam.jpg`;

/**
 * Returns a safe avatar URL: an uploaded photo (compressed JPEG data URL) or the default silhouette.
 * Anything else (external URLs, javascript:, etc.) falls back to the default avatar.
 */
export function getSafeImamAvatar(photo?: string): string {
  if (photo && /^data:image\/(jpeg|png|webp);base64,/.test(photo)) return photo;
  return DEFAULT_IMAM_SILHOUETTE_AVATAR;
}

// Default mosque picture: a dome and minaret in gold on royal green.
const mosqueSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#12804c"/><stop offset="1" stop-color="#05472b"/></linearGradient>
  <linearGradient id="o" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde7a9"/><stop offset="1" stop-color="#d9831a"/></linearGradient></defs>
  <rect width="240" height="240" rx="40" fill="url(#g)"/>
  <path d="M60 190 V130 C60 95 120 70 120 70 C120 70 180 95 180 130 V190 Z" fill="url(#o)" opacity=".95"/>
  <path d="M120 52 V70" stroke="url(#o)" stroke-width="4"/><circle cx="120" cy="48" r="6" fill="url(#o)"/>
  <rect x="190" y="80" width="16" height="110" rx="4" fill="url(#o)"/><path d="M186 82 L198 58 L210 82 Z" fill="url(#o)"/>
  <path d="M100 190 V150 C100 136 120 126 120 126 C120 126 140 136 140 150 V190 Z" fill="#05472b"/>
  <rect x="40" y="190" width="170" height="10" rx="3" fill="url(#o)"/>
</svg>`;

export const DEFAULT_MOSQUE_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(mosqueSvg)}`;

/** Safe mosque picture: an uploaded compressed image, or the default illustration. */
export function getSafeMosquePhoto(photo?: string): string {
  if (photo && /^data:image\/(jpeg|png|webp);base64,/.test(photo)) return photo;
  return DEFAULT_MOSQUE_IMAGE;
}

/** Returns the URL only if it is http(s); prevents javascript: links from user input. */
export function safeHttpUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url.trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** Keeps digits only, for wa.me links. */
export function whatsappLink(number?: string): string | undefined {
  const digits = (number || '').replace(/[^0-9]/g, '');
  return digits.length >= 6 ? `https://wa.me/${digits}` : undefined;
}

/** Keeps "+" and digits only, for tel: links. */
export function telLink(number?: string): string | undefined {
  const clean = (number || '').replace(/[^0-9+]/g, '');
  return clean.length >= 6 ? `tel:${clean}` : undefined;
}

/** Basic international phone check: optional "+", 6–20 digits, spaces/dashes allowed. */
export function isValidPhone(value: string): boolean {
  return /^\+?[0-9][0-9\s\-()]{5,24}$/.test(value.trim());
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function getYoutubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11 && /^[\w-]{11}$/.test(match[2])) {
    return `https://www.youtube-nocookie.com/embed/${match[2]}`;
  }
  return null;
}

export function formatDate(dateString?: string, withTime = false): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('ar', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function getRiwayaBadgeStyle(riwaya: string): { bg: string; text: string; border: string } {
  if (riwaya.includes('ورش')) {
    return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' };
  }
  if (riwaya.includes('حفص')) {
    return { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' };
  }
  if (riwaya.includes('العشر')) {
    return { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200' };
  }
  return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' };
}

/** Roles an imam can tick when creating the profile (they can also type their own). */
export const IMAM_TITLE_OPTIONS = ['إمام', 'خطيب', 'محفظ'];

/** Languages offered as quick choices in the imam form ("other" languages can be typed). */
export const LANGUAGE_OPTIONS = ['العربية', 'الفرنسية', 'الألمانية', 'الإنجليزية', 'الهولندية', 'الإسبانية', 'الإيطالية', 'التركية', 'الأمازيغية'];

/** Splits a free-text list ("العربية، الفرنسية") into items. */
export const splitList = (v: string) =>
  (v || '')
    .split(/[،,;\n]+/)
    .map((x) => x.trim())
    .filter(Boolean);

/** The imam's titles for display, e.g. «إمام • خطيب • محفظ» (older profiles: «إمام وقارئ»). */
export function imamTitle(titles?: string[]): string {
  const t = (titles || []).map((x) => x.trim()).filter(Boolean);
  return t.length ? t.join(' • ') : 'إمام وقارئ';
}

/** European countries offered as "preferred countries" (the imam can also type another one). */
export const EUROPEAN_COUNTRIES = [
  'ألمانيا', 'فرنسا', 'بلجيكا', 'هولندا', 'إسبانيا', 'إيطاليا', 'المملكة المتحدة', 'سويسرا', 'النمسا',
  'السويد', 'النرويج', 'الدنمارك', 'فنلندا', 'أيرلندا', 'البرتغال', 'لوكسمبورغ', 'بولندا', 'اليونان',
];

export const LANGUAGE_LEVELS: { value: import('../types').LanguageLevel; label: string; dots: number }[] = [
  { value: 'native', label: 'اللغة الأم', dots: 5 },
  { value: 'excellent', label: 'ممتاز', dots: 5 },
  { value: 'very_good', label: 'جيد جداً', dots: 4 },
  { value: 'good', label: 'جيد', dots: 3 },
  { value: 'basic', label: 'مبتدئ', dots: 2 },
];

export const MARITAL_LABELS: Record<string, string> = {
  single: 'أعزب',
  married: 'متزوج',
  married_children: 'متزوج وله أطفال',
};

/** Visa / immigration line shown on cards and the CV. */
export function visaStatusText(imam: { hasVisa: 'yes' | 'no'; livesInEurope?: boolean }): string {
  if (imam.livesInEurope) return 'مقيم في أوروبا (لا يحتاج إجراءات استقدام)';
  if (imam.hasVisa === 'yes') return 'لديه تأشيرة شنغن / إقامة أوروبية';
  return 'يحتاج إجراءات استقدام إلى أوروبا';
}

/** Languages with levels; older profiles only have the free-text list (and maybe a German level). */
export function imamLanguages(imam: {
  languageList?: import('../types').ImamLanguage[];
  languages: string;
  germanLevel?: string;
}): { name: string; level?: import('../types').LanguageLevel }[] {
  if (imam.languageList?.length) return imam.languageList.filter((l) => l.name.trim());
  const list: { name: string; level?: import('../types').LanguageLevel }[] = splitList(imam.languages).map((name) => ({ name }));
  const de = imam.germanLevel;
  if (de && de !== 'none' && !list.some((l) => l.name.includes('الألمانية'))) {
    list.push({ name: `الألمانية (${de})`, level: de.startsWith('C') || de === 'B2+' ? 'very_good' : de.startsWith('B') ? 'good' : 'basic' });
  }
  return list;
}

/** "ألمانيا (كولونيا)، فرنسا" */
export const formatPreferredLocations = (locs?: import('../types').PreferredLocation[]) =>
  (locs || []).map((l) => (l.area.trim() ? `${l.country} (${l.area.trim()})` : l.country)).join('، ');
