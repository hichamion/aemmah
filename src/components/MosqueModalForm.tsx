import React, { useState, useEffect } from 'react';
import { MosqueContact, MosqueJob } from '../types';
import type { MosqueEditableFields } from '../lib/db';
import { useContact } from '../lib/db';
import { DEFAULT_MOSQUE_IMAGE, getSafeMosquePhoto, isValidEmail, isValidPhone } from '../utils/helpers';
import { compressImage } from '../lib/image';
import { X, Loader2, Upload, RotateCcw } from 'lucide-react';
import { useDialog } from '../lib/useDialog';

interface MosqueModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  /** Should throw on failure so the form stays open. */
  onSave: (fields: MosqueEditableFields, contact: Omit<MosqueContact, 'ownerUid'>) => Promise<void>;
  initialData: MosqueJob | null;
}

const AVAILABLE_REQUIREMENTS = [
  'مقيم حالياً في أوروبا ولديه أوراق إقامة',
  'لديه تأشيرة شنغن جاهزة لصلاة التراويح',
  'حاصل على شهادة اللغة الألمانية A2 أو أعلى',
  'يتحدث اللغة الفرنسية أو الإنجليزية للتواصل مع الشباب',
  'حاصل على شهادة جامعية شرعية وإجازة بالسند',
  'المسجد يتكفل بإجراءات الاستقدام وتأشيرة العمل',
  'خبرة في إدارة الحلقات القرآنية للأطفال والناشئة',
  'إتقان العمل المكتبي وتنظيم الفعاليات الاجتماعية',
];

// New ads start EMPTY: no city, benefits or housing is assumed on the mosque's behalf.
const EMPTY_FIELDS: MosqueEditableFields = {
  mosqueName: '',
  legalName: '',
  country: '',
  city: '',
  fullAddress: '',
  lookingType: 'نبحث عن إمام رسمي بعقد دائم',
  riwayaRequired: 'ورش عن نافع',
  activeState: 'active',
  requirements: [],
  details: '',
  salaryAndBenefits: '',
  housingProvided: false,
  photo: '',
};

const EMPTY_CONTACT = { contactPerson: '', phone: '', whatsapp: '', email: '' };

export const MosqueModalForm: React.FC<MosqueModalFormProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<MosqueEditableFields>(EMPTY_FIELDS);
  const [contact, setContact] = useState(EMPTY_CONTACT);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { contact: existingContact } = useContact<MosqueContact>('mosque', initialData?.id, isOpen && !!initialData);

  useEffect(() => {
    if (!isOpen) return;
    setFormError(null);
    setContact(EMPTY_CONTACT);
    if (initialData) {
      const { mosqueName, legalName, country, city, fullAddress, lookingType, riwayaRequired, activeState, requirements, details, salaryAndBenefits, housingProvided, photo } = initialData;
      setFormData({
        mosqueName, legalName, country, city,
        fullAddress: fullAddress || '',
        lookingType, riwayaRequired, activeState,
        requirements: requirements || [],
        details: details || '',
        salaryAndBenefits: salaryAndBenefits || '',
        housingProvided: !!housingProvided,
        photo: photo || '',
      });
    } else {
      setFormData(EMPTY_FIELDS);
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen && initialData && existingContact) {
      setContact({
        contactPerson: existingContact.contactPerson || '',
        phone: existingContact.phone || '',
        whatsapp: existingContact.whatsapp || '',
        email: existingContact.email || '',
      });
    }
  }, [existingContact, isOpen, initialData]);

  const dialogRef = useDialog(isOpen, onClose);

  if (!isOpen) return null;

  const handleToggleRequirement = (req: string) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.includes(req)
        ? prev.requirements.filter((r) => r !== req)
        : [...prev.requirements, req],
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      setFormData((prev) => ({ ...prev, photo: dataUrl }));
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  const shownPhoto = getSafeMosquePhoto(formData.photo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mosqueName.trim() || !formData.country.trim() || !formData.city.trim()) {
      setFormError('اسم المسجد والدولة والمدينة حقول مطلوبة.');
      return;
    }
    if (!isValidPhone(contact.phone)) {
      setFormError('رقم الهاتف غير صحيح. اكتبه بالصيغة الدولية مثل +49 176 1234567');
      return;
    }
    if (!isValidEmail(contact.email)) {
      setFormError('البريد الإلكتروني غير صحيح.');
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      await onSave(
        {
          ...formData,
          mosqueName: formData.mosqueName.trim(),
          legalName: formData.legalName.trim(),
          country: formData.country.trim(),
          city: formData.city.trim(),
          fullAddress: formData.fullAddress.trim(),
          details: formData.details.trim(),
          salaryAndBenefits: formData.salaryAndBenefits.trim(),
        },
        {
          contactPerson: contact.contactPerson.trim(),
          phone: contact.phone.trim(),
          whatsapp: (contact.whatsapp || contact.phone).trim(),
          email: contact.email.trim(),
        }
      );
    } catch {
      // Toast shown by parent; keep the form open.
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" role="dialog" ref={dialogRef} tabIndex={-1} aria-modal="true">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl my-8 max-h-[92vh] overflow-y-auto text-xs space-y-6">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <span className="bg-amber-100 text-amber-900 font-extrabold px-3 py-0.5 rounded-full text-xs">
              خاص بإدارات الجمعيات والمساجد
            </span>
            <h3 className="text-lg md:text-xl font-black text-slate-900 mt-1 font-amiri">
              {initialData ? `✏️ تحرير بيانات: ${initialData.mosqueName}` : '➕ إضافة مسجد جديد ونشر شروط طلب إمام'}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="text-slate-400 hover:text-slate-700 text-2xl font-bold p-1 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          
          {/* SECTION 1: Mosque Details & Address */}
          <div className="bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs">1</span>
              <span>معلومات المسجد والعنوان القانوني:</span>
            </h4>

            <div className="flex flex-wrap items-center gap-4">
              <img src={shownPhoto} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-600 shadow-sm" />
              <div className="space-y-2 flex-1">
                <p className="font-bold text-slate-700 text-xs">صورة المسجد (اختيارية): واجهة المسجد أو المحراب أو شعار الجمعية.</p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl cursor-pointer text-xs transition flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع صورة من جهازك</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                  {shownPhoto !== DEFAULT_MOSQUE_IMAGE && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, photo: '' }))}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-2 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>حذف الصورة</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  اسم المسجد / المركز الإسلامي *
                </label>
                <input
                  type="text"
                  required
                  value={formData.mosqueName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, mosqueName: e.target.value }))}
                  placeholder="مثال: مسجد النور والمركز الثقافي"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  الاسم القانوني للجمعية ورقم التسجيل
                </label>
                <input
                  type="text"
                  maxLength={200}
                  value={formData.legalName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, legalName: e.target.value }))}
                  placeholder="مثال: Islamisches Kulturzentrum e.V."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الدولة *</label>
                <input
                  type="text"
                  required
                  value={formData.country || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="ألمانيا / فرنسا / بلجيكا..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المدينة *</label>
                <input
                  type="text"
                  required
                  value={formData.city || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="دوسلدورف / ستراسبورغ..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  العنوان التفصيلي والرمز البريدي
                </label>
                <input
                  type="text"
                  maxLength={300}
                  value={formData.fullAddress || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullAddress: e.target.value }))}
                  placeholder="Kölner Str. 120, 40227 Düsseldorf"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white"
                />
              </div>
            </div>

            {/* Contact details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الشخص المسؤول *</label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={contact.contactPerson}
                  onChange={(e) => setContact((c) => ({ ...c, contactPerson: e.target.value }))}
                  placeholder="مثال: الحاج أحمد (رئيس الجمعية)"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الهاتف / واتساب *</label>
                <input
                  type="text"
                  required
                  maxLength={40}
                  value={contact.phone}
                  onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value, whatsapp: e.target.value }))}
                  placeholder="+49 176..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني للتواصل *</label>
                <input
                  type="email"
                  required
                  maxLength={200}
                  value={contact.email}
                  onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                  placeholder="contact@mosque.de"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Need Type & Riwaya */}
          <div className="bg-amber-50/70 p-4 md:p-5 rounded-2xl border border-amber-200 space-y-4">
            <h4 className="font-extrabold text-amber-950 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">2</span>
              <span>نوع الاحتياج، الرواية القرآنية، وحالة الإعلان:</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-amber-900 mb-1">نوع الاحتياج الحالي *</label>
                <select
                  value={formData.lookingType || 'نبحث عن إمام رسمي بعقد دائم'}
                  onChange={(e) => setFormData(prev => ({ ...prev, lookingType: e.target.value }))}
                  className="w-full border border-amber-300 rounded-xl px-3 py-2 bg-white font-bold text-slate-900 focus:outline-none"
                >
                  <option value="نبحث عن إمام رسمي بعقد دائم">نبحث عن إمام رسمي بعقد دائم</option>
                  <option value="نبحث عن إمام لصلاة التراويح فقط (رمضان)">نبحث عن إمام لصلاة التراويح فقط (رمضان)</option>
                  {formData.lookingType === 'نبحث عن إمام لصلاة التراويح وشهر رمضان' && (
                    <option value="نبحث عن إمام لصلاة التراويح وشهر رمضان">نبحث عن إمام لصلاة التراويح وشهر رمضان</option>
                  )}
                  <option value="نبحث عن إمام يبدأ معنا رسمياً بعد رمضان">نبحث عن إمام يبدأ معنا رسمياً بعد رمضان</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">الرواية القرآنية المطلوبة *</label>
                <select
                  value={formData.riwayaRequired || 'ورش عن نافع'}
                  onChange={(e) => setFormData(prev => ({ ...prev, riwayaRequired: e.target.value }))}
                  className="w-full border border-amber-300 rounded-xl px-3 py-2 bg-white font-bold text-slate-900 focus:outline-none"
                >
                  <option value="ورش عن نافع">رواية ورش عن نافع</option>
                  <option value="حفص عن عاصم">رواية حفص عن عاصم</option>
                  <option value="ورش أو حفص">لا يشترط (ورش أو حفص)</option>
                  <option value="القراءات العشر">القراءات العشر</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">حالة إعلان المسجد *</label>
                <select
                  value={formData.activeState || 'active'}
                  onChange={(e) => setFormData(prev => ({ ...prev, activeState: e.target.value as 'active' | 'closed' }))}
                  className="w-full border border-amber-300 rounded-xl px-3 py-2 bg-white font-black text-slate-900 focus:outline-none"
                >
                  <option value="active">🟢 الإعلان نشط (نستقبل طلبات الترشح)</option>
                  <option value="closed">⏸️ الإعلان متوقف (تم التعاقد مع إمام)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: Requirements Checkboxes & Benefits */}
          <div className="bg-emerald-50/70 p-4 md:p-5 rounded-2xl border border-emerald-200 space-y-4">
            <h4 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs">3</span>
              <span>الشروط الواجب توفرها في الإمام:</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {AVAILABLE_REQUIREMENTS.map((req, idx) => {
                const isChecked = (formData.requirements || []).includes(req);
                return (
                  <label
                    key={idx}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition select-none ${
                      isChecked
                        ? 'bg-emerald-100/80 border-emerald-500 font-bold text-emerald-950'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleRequirement(req)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs leading-tight">{req}</span>
                  </label>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block font-bold text-emerald-900 mb-1">
                  الراتب والمميزات (اختياري)
                </label>
                <input
                  type="text"
                  maxLength={500}
                  value={formData.salaryAndBenefits || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, salaryAndBenefits: e.target.value }))}
                  placeholder="مثال: راتب مجزٍ + سكن وظيفي مستقل ومؤثث بجوار المسجد + تأمين صحي"
                  className="w-full border border-emerald-300 rounded-xl px-3 py-2 bg-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-emerald-900 mb-1">هل يتوفر سكن للإمام؟</label>
                <select
                  value={formData.housingProvided ? 'yes' : 'no'}
                  onChange={(e) => setFormData(prev => ({ ...prev, housingProvided: e.target.value === 'yes' }))}
                  className="w-full border border-emerald-300 rounded-xl px-3 py-2 bg-white font-bold"
                >
                  <option value="no">لا يتوفر سكن / بدل سكن</option>
                  <option value="yes">نعم — يتوفر سكن للإمام</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-emerald-900 mb-1">
                تفاصيل إضافية عن المسجد والمهام المطلوبة من الإمام *
              </label>
              <textarea
                required
                rows={3}
                maxLength={5000}
                value={formData.details || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                placeholder="صف المركز والأنشطة والمهام (الصلوات الخمس، خطبة الجمعة، دروس الناشئة، الفتوى والإرشاد الأسري)..."
                className="w-full border border-emerald-300 rounded-xl px-3 py-2 bg-white leading-relaxed"
              ></textarea>
            </div>
          </div>

          {formError && (
            <p role="alert" className="bg-red-50 border border-red-200 text-red-800 font-bold rounded-xl p-3">
              {formError}
            </p>
          )}

          {/* Form Actions */}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-8 py-2.5 rounded-xl shadow-lg transition cursor-pointer flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{saving ? 'جاري الحفظ…' : initialData ? '💾 حفظ التعديلات' : '💾 إرسال الإعلان للمراجعة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
