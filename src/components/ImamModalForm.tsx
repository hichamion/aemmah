import React, { useState, useEffect } from 'react';
import { ImamContact, ImamFormFiles, ImamProfile } from '../types';
import type { ImamEditableFields } from '../lib/db';
import { useContact, validateDocumentFile } from '../lib/db';
import { compressImage } from '../lib/image';
import {
  getYoutubeEmbedUrl,
  DEFAULT_IMAM_SILHOUETTE_AVATAR,
  getSafeImamAvatar,
  isValidEmail,
  isValidPhone,
  safeHttpUrl,
  IMAM_TITLE_OPTIONS,
  imamLanguages,
  MARITAL_LABELS,
  splitList,
} from '../utils/helpers';
import { CertificateEditor, ExperienceEditor, LanguagesEditor, PreferredLocationsEditor } from './ImamCvEditor';
import { X, Upload, Video, CheckCircle2, RotateCcw, Loader2 } from 'lucide-react';
import { useDialog } from '../lib/useDialog';

interface ImamModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  /** Should throw on failure so the form stays open. */
  onSave: (fields: ImamEditableFields, contact: Omit<ImamContact, 'ownerUid'>, files: ImamFormFiles) => Promise<void>;
  initialData: ImamProfile | null;
  onError: (message: string) => void;
}

// New profiles start EMPTY: nothing is pre-filled on the user's behalf
// (no visa, degree or video is claimed that the imam did not enter).
const EMPTY_FIELDS: ImamEditableFields = {
  name: '',
  age: 0,
  country: '',
  nationality: '',
  titles: ['إمام'],
  currentJob: '',
  experiences: [],
  certificates: [],
  preferredLocations: [],
  languageList: [],
  maritalStatus: '',
  livesInEurope: false,
  hasVisa: 'no',
  visaDetails: '',
  hasCerts: 'no',
  degree: '',
  riwaya: 'ورش عن نافع',
  languages: '',
  germanLevel: 'none',
  youtubeUrl: '',
  cvText: '',
  availabilityState: 'available_now',
  ramadanNote: '',
  availableAfterDate: '',
};

const EMPTY_CONTACT = { phone: '', whatsapp: '', email: '' };

export const ImamModalForm: React.FC<ImamModalFormProps> = ({ isOpen, onClose, onSave, initialData, onError }) => {
  const [fields, setFields] = useState<ImamEditableFields>(EMPTY_FIELDS);
  const [contact, setContact] = useState(EMPTY_CONTACT);
  const [customTitles, setCustomTitles] = useState('');
  const allTitles = () =>
    Array.from(new Set([...(fields.titles || []).filter((t) => IMAM_TITLE_OPTIONS.includes(t)), ...splitList(customTitles)]))
      .map((t) => t.slice(0, 40))
      .slice(0, 8);
  // Empty rows are dropped when saving.
  const cleanLanguages = () => (fields.languageList || []).filter((l) => l.name.trim()).map((l) => ({ ...l, name: l.name.trim().slice(0, 40) }));
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoChanged, setPhotoChanged] = useState(false);
  const [visaFile, setVisaFile] = useState<File | null>(null);
  const [certsFile, setCertsFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Existing contact details (only the owner/admin can read them).
  const { contact: existingContact } = useContact<ImamContact>('imam', initialData?.id, isOpen && !!initialData);

  useEffect(() => {
    if (!isOpen) return;
    setFormError(null);
    setVisaFile(null);
    setCertsFile(null);
    setPhotoChanged(false);
    setContact(EMPTY_CONTACT);
    if (initialData) {
      const { name, age, country, nationality, titles, hasVisa, visaDetails, hasCerts, degree, riwaya, languages, germanLevel, youtubeUrl, cvText, availabilityState, ramadanNote, availableAfterDate } = initialData;
      const d = initialData;
      setFields({
        name, age, country, hasVisa, visaDetails, hasCerts, degree, riwaya,
        nationality: nationality || '',
        titles: titles?.length ? titles : ['إمام'],
        currentJob: d.currentJob || '',
        experiences: d.experiences || [],
        certificates: d.certificates || [],
        preferredLocations: d.preferredLocations || [],
        // Older profiles only had a free-text list (and a German level): turn it into rows.
        languageList: imamLanguages(d).map((l) => ({ name: l.name, level: l.level || 'good' })),
        maritalStatus: d.maritalStatus || '',
        livesInEurope: !!d.livesInEurope,
        languages: languages || '',
        germanLevel: germanLevel || 'none',
        youtubeUrl: youtubeUrl || '',
        cvText: cvText || '',
        availabilityState,
        ramadanNote: ramadanNote || '',
        availableAfterDate: availableAfterDate || '',
      });
      setPhotoPreview(initialData.photo || '');
      setCustomTitles((titles || []).filter((t) => !IMAM_TITLE_OPTIONS.includes(t)).join('، '));
    } else {
      setFields(EMPTY_FIELDS);
      setCustomTitles('');
      setContact(EMPTY_CONTACT);
      setPhotoPreview('');
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen && initialData && existingContact) {
      setContact({
        phone: existingContact.phone || '',
        whatsapp: existingContact.whatsapp || '',
        email: existingContact.email || '',
      });
    }
  }, [existingContact, isOpen, initialData]);

  const dialogRef = useDialog(isOpen, onClose);

  if (!isOpen) return null;

  const set = <K extends keyof ImamEditableFields>(key: K, value: ImamEditableFields[K]) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      setPhotoPreview(dataUrl);
      setPhotoChanged(true);
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const pickDocument = (setter: (f: File | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const problem = validateDocumentFile(file);
      if (problem) {
        onError(problem);
        e.target.value = '';
        return;
      }
    }
    setter(file);
  };

  const validate = (): string | null => {
    if (!fields.name.trim()) return 'الاسم مطلوب.';
    // Everything else is optional; the age is checked only when given.
    const age = Number(fields.age || 0);
    if (age !== 0 && (!Number.isFinite(age) || age < 18 || age > 90)) return 'العمر يجب أن يكون بين 18 و 90 سنة (أو اتركه فارغاً).';
    if (!isValidPhone(contact.phone)) return 'رقم الهاتف غير صحيح. اكتبه بالصيغة الدولية مثل +212600000000';
    if (contact.whatsapp && !isValidPhone(contact.whatsapp)) return 'رقم الواتساب غير صحيح.';
    if (!isValidEmail(contact.email)) return 'البريد الإلكتروني غير صحيح.';
    if (fields.youtubeUrl && !safeHttpUrl(fields.youtubeUrl)) return 'رابط اليوتيوب غير صحيح.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setFormError(problem);
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      await onSave(
        {
          ...fields,
          name: fields.name.trim(),
          country: fields.country.trim(),
          nationality: (fields.nationality || '').trim().slice(0, 80),
          titles: allTitles(),
          age: Math.round(Number(fields.age || 0)) || 0,
          currentJob: (fields.currentJob || '').trim().slice(0, 150),
          experiences: (fields.experiences || [])
            .filter((x) => x.title.trim() || x.place.trim())
            .map((x) => ({ title: x.title.trim(), place: x.place.trim(), from: x.from, to: x.to })),
          certificates: (fields.certificates || [])
            .filter((x) => x.name.trim())
            .map((x) => ({ name: x.name.trim(), issuer: x.issuer.trim(), year: x.year })),
          preferredLocations: (fields.preferredLocations || []).map((x) => ({ country: x.country, area: x.area.trim() })),
          languageList: cleanLanguages(),
          youtubeUrl: fields.youtubeUrl.trim(),
          visaDetails: fields.visaDetails.trim(),
          degree: fields.degree.trim(),
          // Kept in sync for search and for older screens.
          languages: cleanLanguages().map((l) => l.name).join('، ').slice(0, 300),
          cvText: fields.cvText.trim(),
        },
        {
          phone: contact.phone.trim(),
          whatsapp: (contact.whatsapp || contact.phone).trim(),
          email: contact.email.trim(),
        },
        {
          photo: photoChanged ? photoPreview : undefined,
          visaFile: fields.hasVisa === 'yes' ? visaFile : null,
          certsFile: fields.hasCerts === 'yes' ? certsFile : null,
        }
      );
    } catch {
      // Error toast is shown by the parent; keep the form open.
    } finally {
      setSaving(false);
    }
  };

  const embedPreview = getYoutubeEmbedUrl(fields.youtubeUrl || '');
  const shownPhoto = getSafeImamAvatar(photoPreview);
  // Ticked titles / languages are kept in fields; what the imam types is kept apart and merged on save.
  const knownTitles = (fields.titles || []).filter((t) => IMAM_TITLE_OPTIONS.includes(t));
  const toggleTitle = (t: string) =>
    set('titles', knownTitles.includes(t) ? knownTitles.filter((x) => x !== t) : [...knownTitles, t]);

  const inputCls = 'w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500';

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      ref={dialogRef}
      tabIndex={-1}
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-8 shadow-2xl my-6 max-h-[92vh] overflow-y-auto text-xs space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <span className="text-emerald-800 font-bold text-xs">
              {initialData ? 'تعديل الملف الحالي' : 'تسجيل ملف إمام جديد'}
            </span>
            <h3 className="text-lg md:text-xl font-black text-slate-900 mt-0.5 font-amiri">
              {initialData ? `تحرير بيانات: ${initialData.name}` : 'إضافة ملف إمام وقارئ جديد'}
            </h3>
          </div>
          <button onClick={onClose} aria-label="إغلاق" className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* SECTION 1 */}
          <div className="bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="font-extrabold text-emerald-950 text-sm">01. المعلومات الشخصية والصورة</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label htmlFor="im-name" className="block font-bold text-slate-700 mb-1">الاسم الكامل *</label>
                <input id="im-name" type="text" required maxLength={120} value={fields.name}
                  onChange={(e) => set('name', e.target.value)} placeholder="مثال: الشيخ يوسف الإدريسي"
                  className={`${inputCls} font-semibold`} />
              </div>
              <div>
                <label htmlFor="im-age" className="block font-bold text-slate-700 mb-1">العمر (بالسنوات)</label>
                <input id="im-age" type="number" min={18} max={90} inputMode="numeric"
                  value={fields.age || ''} onChange={(e) => set('age', Number(e.target.value))}
                  className={inputCls} />
              </div>
              <div>
                <label htmlFor="im-nationality" className="block font-bold text-slate-700 mb-1">الجنسية</label>
                <input id="im-nationality" type="text" maxLength={80} value={fields.nationality || ''}
                  onChange={(e) => set('nationality', e.target.value)} placeholder="مثال: مغربي"
                  className={`${inputCls} font-semibold`} />
              </div>
            </div>

            <div>
              <label htmlFor="im-country" className="block font-bold text-slate-700 mb-1">مكان الإقامة الحالي (المدينة والبلد)</label>
              <input id="im-country" type="text" maxLength={120} value={fields.country}
                onChange={(e) => set('country', e.target.value)} placeholder="مثال: فاس، المغرب — أو: كولونيا، ألمانيا"
                className={`${inputCls} font-semibold`} />
            </div>

            <fieldset className="space-y-2">
              <legend className="block font-bold text-slate-700 mb-1">الصفة (يمكن اختيار أكثر من واحدة)</legend>
              <div className="flex flex-wrap gap-2">
                {IMAM_TITLE_OPTIONS.map((t) => {
                  const on = knownTitles.includes(t);
                  return (
                    <button key={t} type="button" aria-pressed={on} onClick={() => toggleTitle(t)}
                      className={`px-3.5 py-2 rounded-full border-2 font-bold text-xs transition cursor-pointer ${on ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-400'}`}>
                      {on ? '✓ ' : ''}{t}
                    </button>
                  );
                })}
              </div>
              <input type="text" maxLength={120} value={customTitles} onChange={(e) => setCustomTitles(e.target.value)}
                placeholder="صفة أخرى (اختياري)، مثل: مؤذن، واعظ، مدرّس تجويد — افصل بينها بفاصلة"
                aria-label="صفات أخرى" className={inputCls} />
            </fieldset>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="im-job" className="block font-bold text-slate-700 mb-1">الوظيفة / المهنة الحالية</label>
                <input id="im-job" type="text" maxLength={150} value={fields.currentJob || ''}
                  onChange={(e) => set('currentJob', e.target.value)} placeholder="مثال: إمام وخطيب بمسجد الرحمة، طنجة"
                  className={inputCls} />
              </div>
              <div>
                <label htmlFor="im-marital" className="block font-bold text-slate-700 mb-1">الحالة العائلية</label>
                <select id="im-marital" value={fields.maritalStatus || ''} className={inputCls}
                  onChange={(e) => set('maritalStatus', e.target.value as ImamEditableFields['maritalStatus'])}>
                  <option value="">— لا أرغب في ذكرها —</option>
                  {Object.entries(MARITAL_LABELS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/80">
              <p className="block font-bold text-slate-700 mb-2">الصورة الشخصية (اختيارية):</p>
              <div className="flex flex-wrap items-center gap-4">
                <img src={shownPhoto} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-600 shadow-sm" />
                <div className="space-y-2 flex-1">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    إذا لم ترفع صورة تظهر صورة رمزية موحدة. تُصغَّر الصورة تلقائياً قبل الحفظ.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl cursor-pointer text-xs transition flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع صورة من جهازك</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                    {shownPhoto !== DEFAULT_IMAM_SILHOUETTE_AVATAR && (
                      <button type="button"
                        onClick={() => { setPhotoPreview(''); setPhotoChanged(true); }}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-2 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>استعادة الصورة الرمزية</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 space-y-2">
              <p className="text-xs font-bold text-emerald-900">
                بيانات التواصل (محمية: تظهر فقط للمساجد التي وثقتها الإدارة، ولا تظهر للزوار):
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="im-phone" className="block font-bold text-slate-700 mb-1">رقم الهاتف *</label>
                  <input id="im-phone" type="tel" required maxLength={40} value={contact.phone}
                    onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                    placeholder="+212 600 000000" className={inputCls} dir="ltr" />
                </div>
                <div>
                  <label htmlFor="im-wa" className="block font-bold text-slate-700 mb-1">رقم الواتساب (إن اختلف)</label>
                  <input id="im-wa" type="tel" maxLength={40} value={contact.whatsapp}
                    onChange={(e) => setContact((c) => ({ ...c, whatsapp: e.target.value }))}
                    placeholder="+212600000000" className={inputCls} dir="ltr" />
                </div>
                <div>
                  <label htmlFor="im-email" className="block font-bold text-slate-700 mb-1">البريد الإلكتروني *</label>
                  <input id="im-email" type="email" required maxLength={200} value={contact.email}
                    onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                    placeholder="imam@example.com" className={inputCls} dir="ltr" />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2 */}
          <div className="bg-sky-50/70 p-4 md:p-5 rounded-2xl border border-sky-200 space-y-4">
            <h4 className="font-extrabold text-sky-950 text-sm">02. التأشيرة (الفيزا) والقدوم إلى أوروبا</h4>
            <label className="flex items-center gap-2.5 bg-white border border-sky-200 rounded-xl p-3 cursor-pointer">
              <input type="checkbox" checked={!!fields.livesInEurope} onChange={(e) => set('livesInEurope', e.target.checked)}
                className="w-4 h-4 accent-sky-700" />
              <span className="font-bold text-sky-950">أنا مقيم حالياً في دولة أوروبية (لا أحتاج إجراءات استقدام)</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="im-visa" className="block font-bold text-sky-900 mb-1">هل لديك فيزا شنغن أو إقامة أوروبية حالياً؟</label>
                <select id="im-visa" value={fields.hasVisa} onChange={(e) => set('hasVisa', e.target.value as 'yes' | 'no')}
                  className="w-full border border-sky-300 rounded-xl px-3 py-2 bg-white font-bold text-sky-950">
                  <option value="no">لا — ليس لدي فيزا حالياً</option>
                  <option value="yes">نعم — لدي فيزا شنغن سارية أو إقامة أوروبية</option>
                </select>
              </div>
              <div>
                <label htmlFor="im-visa-d" className="block font-bold text-sky-900 mb-1">توضيح حالة التأشيرة أو الجواز</label>
                <input id="im-visa-d" type="text" maxLength={500} value={fields.visaDetails}
                  onChange={(e) => set('visaDetails', e.target.value)}
                  placeholder="مثال: تأشيرة شنغن صالحة حتى 2027 / جواز سفر جاهز"
                  className="w-full border border-sky-300 rounded-xl px-3 py-2 bg-white" />
              </div>
            </div>

            {fields.hasVisa === 'yes' && (
              <div className="bg-white p-3.5 rounded-xl border border-sky-200 space-y-2">
                <label htmlFor="im-visa-file" className="block font-bold text-sky-900">
                  رفع نسخة الفيزا / الإقامة (PDF أو صورة، 5MB كحد أقصى) — تراها الإدارة فقط:
                </label>
                <input id="im-visa-file" type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={pickDocument(setVisaFile)}
                  className="w-full border border-slate-200 rounded-lg p-1.5 bg-slate-50 text-xs" />
                {(visaFile || initialData?.visaFileName) && (
                  <p className="text-xs text-sky-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                    <span>{visaFile ? `سيتم رفع: ${visaFile.name}` : `الملف الحالي: ${initialData?.visaFileName}`}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* SECTION 3 */}
          <div className="bg-emerald-50/70 p-4 md:p-5 rounded-2xl border border-emerald-200 space-y-4">
            <h4 className="font-extrabold text-emerald-950 text-sm">03. الشواهد العلمية، الرواية، واللغات</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label htmlFor="im-certs" className="block font-bold text-emerald-900 mb-1">توفر الشواهد والإجازات</label>
                <select id="im-certs" value={fields.hasCerts} onChange={(e) => set('hasCerts', e.target.value as 'yes' | 'no')}
                  className="w-full border border-emerald-300 rounded-xl px-3 py-2 bg-white font-bold">
                  <option value="no">حافظ لكتاب الله (بدون شهادة)</option>
                  <option value="yes">نعم — لدي شواهد وإجازات</option>
                </select>
              </div>
              <div>
                <label htmlFor="im-degree" className="block font-bold text-emerald-900 mb-1">المؤهل العلمي الرئيسي</label>
                <input id="im-degree" type="text" maxLength={300} value={fields.degree}
                  onChange={(e) => set('degree', e.target.value)} placeholder="مثال: إجازة في الدراسات الإسلامية"
                  className="w-full border border-emerald-300 rounded-xl px-3 py-2 bg-white font-semibold" />
              </div>
              <div>
                <label htmlFor="im-riwaya" className="block font-bold text-emerald-900 mb-1">الرواية القرآنية المتقنة</label>
                <select id="im-riwaya" value={fields.riwaya} onChange={(e) => set('riwaya', e.target.value)}
                  className="w-full border border-emerald-300 rounded-xl px-3 py-2 bg-white font-bold text-emerald-900">
                  <option value="ورش عن نافع">رواية ورش عن نافع</option>
                  <option value="حفص عن عاصم">رواية حفص عن عاصم</option>
                  <option value="قالون عن نافع">رواية قالون عن نافع</option>
                  <option value="القراءات العشر">القراءات العشر</option>
                </select>
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="block font-bold text-emerald-900 mb-1">الشهادات والإجازات (أضف ما شئت)</legend>
              <CertificateEditor value={fields.certificates || []} onChange={(v) => set('certificates', v)} />
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="block font-bold text-emerald-900 mb-1">اللغات ومستواك في كل لغة (أضف ما شئت)</legend>
              <LanguagesEditor value={fields.languageList || []} onChange={(v) => set('languageList', v)} />
            </fieldset>

            {fields.hasCerts === 'yes' && (
              <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-2">
                <label htmlFor="im-certs-file" className="block font-bold text-emerald-900">
                  رفع الشواهد / السند في ملف واحد (PDF أو صورة، 5MB كحد أقصى) — تراها الإدارة فقط:
                </label>
                <input id="im-certs-file" type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={pickDocument(setCertsFile)}
                  className="w-full border border-slate-200 rounded-lg p-1.5 bg-slate-50 text-xs" />
                {(certsFile || initialData?.certsFileName) && (
                  <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{certsFile ? `سيتم رفع: ${certsFile.name}` : `الملف الحالي: ${initialData?.certsFileName}`}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* SECTION: positions held */}
          <div className="bg-amber-50/60 p-4 md:p-5 rounded-2xl border border-amber-200 space-y-3">
            <h4 className="font-extrabold text-amber-950 text-sm">الخبرات والوظائف السابقة</h4>
            <p className="text-xs text-slate-600">أضف كل وظيفة أو مهمة زاولتها، مع سنة البداية وسنة النهاية (أو «حتى الآن»). اختياري.</p>
            <ExperienceEditor value={fields.experiences || []} onChange={(v) => set('experiences', v)} />
          </div>

          {/* SECTION: preferred countries and places */}
          <div className="bg-sky-50/60 p-4 md:p-5 rounded-2xl border border-sky-200 space-y-3">
            <h4 className="font-extrabold text-sky-950 text-sm">الدول والأماكن المفضلة للإمامة</h4>
            <p className="text-xs text-slate-600">اختر دولة أو أكثر، واكتب بجانب كل دولة المدينة أو المنطقة إن أردت، أو اتركها فارغة. اختياري.</p>
            <PreferredLocationsEditor value={fields.preferredLocations || []} onChange={(v) => set('preferredLocations', v)} />
          </div>

          {/* SECTION 4 */}
          <div className="bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="font-extrabold text-slate-900 text-sm">04. فيديو التلاوة، حالة التفرغ، والسيرة الذاتية</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="im-yt" className="block font-bold text-slate-700 mb-1">رابط فيديو تلاوتك على يوتيوب (مستحسن)</label>
                <input id="im-yt" type="url" maxLength={300} value={fields.youtubeUrl}
                  onChange={(e) => set('youtubeUrl', e.target.value)} placeholder="https://www.youtube.com/watch?v=..."
                  className={inputCls} dir="ltr" />
              </div>
              <div>
                <label htmlFor="im-av" className="block font-bold text-slate-700 mb-1">حالة التفرغ *</label>
                <select id="im-av" value={fields.availabilityState}
                  onChange={(e) => set('availabilityState', e.target.value as ImamEditableFields['availabilityState'])}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white font-bold text-slate-900">
                  <option value="available_now">متاح حالياً (لرمضان أو للإمامة الدائمة)</option>
                  <option value="busy_ramadan">ملتزم في رمضان — ومتاح للتعاقد بعده</option>
                  <option value="paused">إيقاف الإعلان مؤقتاً (إخفاء الملف)</option>
                </select>
              </div>
            </div>

            {embedPreview && (
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 text-white space-y-2">
                <span className="text-xs text-amber-400 font-bold flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5" />
                  <span>معاينة فيديو التلاوة:</span>
                </span>
                <div className="aspect-video w-full max-h-48 rounded-xl overflow-hidden bg-black">
                  <iframe src={embedPreview} title="معاينة التلاوة" className="w-full h-full" loading="lazy" allowFullScreen />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="im-cv" className="block font-bold text-slate-700 mb-1">السيرة الذاتية والمسيرة العلمية</label>
              <textarea id="im-cv" rows={4} maxLength={5000} value={fields.cvText}
                onChange={(e) => set('cvText', e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white leading-relaxed" />
              <p className="text-xs text-slate-400 text-left" dir="ltr">{fields.cvText.length}/5000</p>
            </div>
          </div>

          {formError && (
            <p role="alert" className="bg-red-50 border border-red-200 text-red-800 font-bold rounded-xl p-3">
              {formError}
            </p>
          )}

          <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer">
              إلغاء
            </button>
            <button type="submit" disabled={saving}
              className="bg-emerald-700 hover:bg-emerald-600 text-white font-black px-8 py-2.5 rounded-xl shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{saving ? 'جاري الحفظ…' : 'حفظ الملف'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
