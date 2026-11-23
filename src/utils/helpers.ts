import type { ImamProfile, KhateebInfo } from '../types';
import { locale, t as tr } from '../i18n';
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
  return d.toLocaleDateString(locale(), {
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
/** «إمام وخطيب» = leads the prayer and preaches in the same mosque; «خطيب فقط» = Friday preacher only (lives in Europe). */
export const TITLE_IMAM = 'إمام وخطيب';
export const TITLE_KHATEEB = 'خطيب فقط';
export const IMAM_TITLE_OPTIONS = [TITLE_IMAM, TITLE_KHATEEB, 'محفظ'];

/** The imam's role, also for profiles saved before the titles changed («إمام», «خطيب»). */
export function imamRole(titles?: string[]): 'imam' | 'khateeb' | null {
  const t = (titles || []).map((x) => x.trim());
  if (t.includes(TITLE_KHATEEB)) return 'khateeb';
  if (t.includes(TITLE_IMAM) || t.includes('إمام')) return 'imam';
  if (t.includes('خطيب')) return 'khateeb';
  return null;
}

/** Turns the old titles into the current ones: «إمام» → «إمام وخطيب», «خطيب» alone → «خطيب فقط». */
export function normalizeTitles(titles?: string[]): string[] {
  const t = (titles || []).map((x) => x.trim()).filter(Boolean);
  const role = imamRole(t);
  const rest = t.filter((x) => ![TITLE_IMAM, TITLE_KHATEEB, 'إمام', 'خطيب'].includes(x));
  return [...(role === 'imam' ? [TITLE_IMAM] : role === 'khateeb' ? [TITLE_KHATEEB] : []), ...rest];
}

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
  const t = normalizeTitles(titles);
  return t.length ? t.map((x) => tr(x)).join(' • ') : tr('إمام وقارئ');
}

/** Country part of a residence written as «المدينة، البلد» (or the whole text when there is no comma). */
export function residenceCountry(place: string): string {
  const parts = (place || '').split(/[،,]/).map((x) => x.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : '';
}


/**
 * A Friday preacher only («خطيب فقط») who lives in Europe and filled the preacher section.
 * An «إمام وخطيب» preaches in his own mosque, so he has no separate preacher details.
 */
export function isKhateeb(imam: Pick<ImamProfile, 'khateeb' | 'titles' | 'livesInEurope'>): boolean {
  return !!imam.khateeb && !!imam.livesInEurope && imamRole(imam.titles) === 'khateeb';
}

export const KHATEEB_TERM_LABELS: Record<KhateebInfo['term'], string> = {
  temporary: 'خطيب مؤقت (بديل أو لجُمَع محددة)',
  permanent: 'خطيب دائم',
  both: 'مؤقت أو دائم',
};

/** Where the khateeb can preach, in one line. */
export function khateebArea(k: KhateebInfo, residence?: string): string {
  if (k.mode === 'radius') return tr('في حدود {n} كم من مكان سكنه', { n: k.radiusKm || 0 }) + (residence ? ` (${residence})` : '');
  return k.regions.trim() || tr('لم تُحدَّد المناطق');
}

export type ImamTone = 'imam' | 'khateeb' | 'imam_khateeb' | 'tarawih' | 'khateeb_tarawih';

/**
 * Profile kind used for its colours and picture: Friday preacher, imam who is also a Friday preacher,
 * Ramadan / tarawih only, preacher and tarawih, or a regular imam.
 */
export function imamTone(imam: Pick<ImamProfile, 'khateeb' | 'titles' | 'availabilityState' | 'livesInEurope'>): ImamTone {
  const kh = isKhateeb(imam);
  const tar = imam.availabilityState === 'ramadan_only';
  if (kh && tar) return 'khateeb_tarawih';
  if (kh) return 'khateeb';
  return tar ? 'tarawih' : 'imam';
}

/**
 * Colours of each profile kind (Tailwind classes written out in full so they are generated):
 * teal for imams, wine red for preachers, teal to wine for imams who also preach,
 * royal gold / orange for tarawih imams, wine to gold for preacher and tarawih.
 */
export const IMAM_TONES: Record<ImamTone, { band: string; side: string; ring: string; button: string; title: string; card: string }> = {
  imam: {
    band: 'from-[#1aa3bf] via-[#0e4d64] to-[#0b3a4f]',
    side: 'from-[#0e4d64] via-[#0b3a4f] to-[#082a3a]',
    ring: 'border-[#0b3a4f]',
    button: 'bg-[#0b3a4f] hover:bg-[#0e4d64]',
    title: 'text-amber-300',
    card: '',
  },
  khateeb: {
    band: 'from-[#b23a62] via-[#7a1f43] to-[#4f1029]',
    side: 'from-[#8a2a4c] via-[#6e1d3b] to-[#4f1029]',
    ring: 'border-[#4f1029]',
    button: 'bg-[#6e1d3b] hover:bg-[#8a2a4c]',
    title: 'text-amber-300',
    card: 'khateeb-card',
  },
  imam_khateeb: {
    band: 'from-[#1aa3bf] via-[#0e4d64] to-[#7a1f43]',
    side: 'from-[#0e4d64] via-[#0b3a4f] to-[#6e1d3b]',
    ring: 'border-[#0b3a4f]',
    button: 'bg-[#0b3a4f] hover:bg-[#0e4d64]',
    title: 'text-amber-300',
    card: '',
  },
  tarawih: {
    band: 'from-[#f2b631] via-[#d9821f] to-[#a24f0c]',
    side: 'from-[#d9921f] via-[#b9650f] to-[#7f3c08]',
    ring: 'border-[#8a4309]',
    button: 'bg-[#a8560c] hover:bg-[#c26a12]',
    title: 'text-[#fff1c7]',
    card: 'tarawih-card',
  },
  khateeb_tarawih: {
    band: 'from-[#e3a02a] via-[#9c3448] to-[#4f1029]',
    side: 'from-[#c98420] via-[#7a1f43] to-[#4f1029]',
    ring: 'border-[#4f1029]',
    button: 'bg-[#7a1f43] hover:bg-[#9c3448]',
    title: 'text-[#ffe4a3]',
    card: 'khateeb-card',
  },
};

/**
 * Transparent picture of each profile kind, cut from the reference image: minbar (preacher), lantern and
 * crescent (tarawih), mosque with crescent (preacher and tarawih), mihrab (every other imam, including
 * imams who also preach).
 */
export function imamRoleArt(imam: Pick<ImamProfile, 'khateeb' | 'titles' | 'availabilityState' | 'livesInEurope'>): { src: string; label: string } {
  const base = import.meta.env.BASE_URL;
  const t = imamTone(imam);
  if (t === 'khateeb_tarawih') return { src: `${base}art-mosque.webp`, label: tr('خطيب جمعة وإمام تراويح') };
  if (t === 'imam_khateeb') return { src: `${base}art-mihrab.webp`, label: tr('إمام وخطيب جمعة') };
  if (t === 'khateeb') return { src: `${base}art-minbar.webp`, label: tr('خطيب جمعة') };
  if (t === 'tarawih') return { src: `${base}art-lantern.webp`, label: tr('إمام تراويح لرمضان') };
  return { src: `${base}art-mihrab.webp`, label: tr('إمام') };
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
  if (imam.livesInEurope) return tr('مقيم في أوروبا (لا يحتاج إجراءات استقدام)');
  if (imam.hasVisa === 'yes') return tr('لديه تأشيرة شنغن / إقامة أوروبية');
  return tr('يحتاج إجراءات استقدام إلى أوروبا');
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
  (locs || []).map((l) => (l.area.trim() ? `${tr(l.country)} (${l.area.trim()})` : tr(l.country))).join(tr('، '));

/** First name for greetings: drops a leading title and keeps compound names whole (عبد الله، أبو بكر…). */
export function firstNameOf(fullName: string | undefined): string {
  const w = (fullName || '').replace(/^(الشيخ|الإمام|القارئ|الأستاذ|د\.)\s+/, '').trim().split(/\s+/).filter(Boolean);
  if (!w.length) return '';
  return /^(عبد|عبدال|أبو|ابو|أبي|بن)$/.test(w[0]) && w[1] ? `${w[0]} ${w[1]}` : w[0];
}
