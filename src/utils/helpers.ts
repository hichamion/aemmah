// Refined, high-clarity vector portrait silhouette of an Imam / Sheikh wearing a traditional white prayer cap (قبعة / طاقية شيخ وإمام)
const imamCapSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
  <defs>
    <linearGradient id="bgEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#065f46" />
      <stop offset="60%" stop-color="#064e3b" />
      <stop offset="100%" stop-color="#022c22" />
    </linearGradient>
    <linearGradient id="goldTrim" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fcd34d" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="capShade" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#e2e8f0" />
    </linearGradient>
  </defs>

  <!-- Soft Rounded Avatar Background -->
  <rect width="240" height="240" rx="40" fill="url(#bgEmerald)" />

  <!-- Subtle Mihrab Arch Halo -->
  <path d="M 44 240 L 44 110 C 44 52 120 22 120 22 C 120 22 196 52 196 110 L 196 240 Z" fill="#10b981" opacity="0.12" />
  <path d="M 44 240 L 44 110 C 44 52 120 22 120 22 C 120 22 196 52 196 110 L 196 240" fill="none" stroke="url(#goldTrim)" stroke-width="1.5" opacity="0.35" />

  <!-- Imam Outer Robe / Bisht (الجبة / البشت) -->
  <path d="M 24 240 C 26 176 64 154 120 154 C 176 154 214 176 216 240 Z" fill="#0f172a" />
  <!-- Inner White Qamis Tunic -->
  <path d="M 86 156 L 120 240 L 154 156 Z" fill="#f8fafc" />
  <!-- Golden Bisht Lapel Embroidery (طراز البشت الذهبي) -->
  <path d="M 86 156 L 114 240" fill="none" stroke="url(#goldTrim)" stroke-width="5" stroke-linecap="round" />
  <path d="M 154 156 L 126 240" fill="none" stroke="url(#goldTrim)" stroke-width="5" stroke-linecap="round" />

  <!-- Neck & Head Silhouette -->
  <rect x="102" y="132" width="36" height="28" rx="10" fill="#cbd5e1" />
  
  <!-- Ears -->
  <circle cx="78" cy="104" r="8" fill="#cbd5e1" />
  <circle cx="162" cy="104" r="8" fill="#cbd5e1" />

  <!-- Head & Face Silhouette (بدون ملامح تفصيلية - خيال وقور) -->
  <path d="M 80 80 C 80 56 160 56 160 80 L 160 112 C 160 138 142 156 120 156 C 98 156 80 138 80 112 Z" fill="#e2e8f0" />

  <!-- Dignified Full Beard Silhouette (اللحية الوقورة) -->
  <path d="M 79 102 C 79 138 96 162 120 164 C 144 162 161 138 161 102 C 153 114 139 122 120 122 C 101 122 87 114 79 102 Z" fill="#334155" />
  <!-- Moustache Subtle Arch -->
  <path d="M 100 115 Q 120 108 140 115" fill="none" stroke="#475569" stroke-width="3.5" stroke-linecap="round" />

  <!-- Traditional Imam Prayer Cap / Kufi (قبعة / طاقية الإمام) -->
  <path d="M 77 84 C 77 48 96 38 120 38 C 144 38 163 48 163 84 Z" fill="url(#capShade)" stroke="#cbd5e1" stroke-width="1.5" />
  <!-- Cap Geometric Quilted Pattern Band (نقش القبعة) -->
  <path d="M 76 74 Q 120 66 164 74 L 164 85 Q 120 77 76 85 Z" fill="url(#goldTrim)" />
  <path d="M 80 62 Q 120 55 160 62" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="5,5" />
</svg>`;

export const DEFAULT_IMAM_SILHOUETTE_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(imamCapSvg)}`;

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
