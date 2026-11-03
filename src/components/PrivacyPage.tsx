import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';

/**
 * Privacy policy (GDPR / DSGVO oriented).
 * IMPORTANT: Fill in the operator details below (OPERATOR) and have the text reviewed
 * by a lawyer for your country before going live. This is a template, not legal advice.
 */
const OPERATOR = {
  name: '[اسم المسؤول عن المنصة أو الجمعية]',
  address: '[العنوان البريدي الكامل]',
  email: '[بريد التواصل الخاص بالخصوصية]',
};

const LAST_UPDATED = '2026-10-30';

export const PrivacyPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <section className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
      <button onClick={onBack} className="text-emerald-800 font-bold text-xs flex items-center gap-1 mb-4 cursor-pointer">
        <ArrowRight className="w-4 h-4" />
        <span>العودة للرئيسية</span>
      </button>

      <article className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 text-sm text-slate-700 leading-relaxed">
        <header className="space-y-2 border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-black text-slate-900 font-amiri flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-700" />
            سياسة الخصوصية وحماية البيانات
          </h1>
          <p className="text-xs text-slate-500">آخر تحديث: {LAST_UPDATED}</p>
        </header>

        <section className="space-y-2">
          <h2 className="font-black text-slate-900">1. الجهة المسؤولة</h2>
          <p>
            المسؤول عن معالجة البيانات في منصة «أئمة» هو: {OPERATOR.name}، {OPERATOR.address}. للتواصل بخصوص بياناتك:{' '}
            <span dir="ltr">{OPERATOR.email}</span>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-black text-slate-900">2. البيانات التي نجمعها</h2>
          <ul className="list-disc pr-5 space-y-1">
            <li>بيانات الحساب: الاسم، والبريد الإلكتروني أو رقم الهاتف المستعمل للدخول، والصورة الرمزية التي يرسلها جوجل أو فيسبوك عند الدخول بهما. كلمات المرور تحفظها خدمة Firebase Authentication مشفّرة، ولا نطّلع عليها.</li>
            <li>ملف الإمام: الاسم، العمر، البلد، المؤهلات، الرواية، اللغات، حالة التأشيرة، السيرة الذاتية، رابط التلاوة، وصورة اختيارية.</li>
            <li>بيانات التواصل: رقم الهاتف، الواتساب، البريد الإلكتروني.</li>
            <li>وثائق اختيارية: نسخة التأشيرة/الإقامة والشواهد العلمية.</li>
            <li>إعلانات المساجد، طلبات الترشح، الرسائل داخل المنصة، والبلاغات.</li>
            <li>رسائل نموذج «راسل الإدارة» والاقتراحات: الاسم والبريد (اختياريان) ونص الرسالة، ولا تطّلع عليها إلا الإدارة.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-black text-slate-900">3. الغرض والأساس القانوني</h2>
          <p>
            نعالج البيانات فقط لغرض الربط بين الأئمة والمساجد وتشغيل المنصة، على أساس موافقتك (المادة 6(1)(أ) من اللائحة
            العامة لحماية البيانات GDPR) وتنفيذ خدمة المنصة التي طلبتها (المادة 6(1)(ب)). لا نبيع البيانات ولا نستخدمها
            للإعلانات.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-black text-slate-900">4. من يرى بياناتك</h2>
          <ul className="list-disc pr-5 space-y-1">
            <li>الملف العام للإمام (بدون أرقام التواصل) يظهر للجميع بعد موافقة الإدارة.</li>
            <li>أرقام هاتف الإمام وبريده تظهر فقط لحسابات المساجد التي وثقتها الإدارة، وللإدارة.</li>
            <li>بيانات تواصل المساجد تظهر للمستخدمين المسجلين فقط.</li>
            <li>الوثائق المرفوعة (التأشيرة والشواهد) لا يراها إلا صاحبها والإدارة.</li>
            <li>الرسائل لا يراها إلا المرسل والمستقبل.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-black text-slate-900">5. مزودو الخدمة</h2>
          <p>
            تُستضاف صفحات الموقع على GitHub Pages (شركة GitHub التابعة لـ Microsoft)، وقد يسجّل خادمها عنوان IP لأغراض
            الأمان والتشغيل. وتُحفظ بيانات المنصة لدى Google Firebase (شركة Google) كمعالج بيانات نيابة عنا. قد تُعالَج بعض البيانات
            خارج الاتحاد الأوروبي وفق البنود التعاقدية القياسية المعتمدة. تُعرض مقاطع التلاوة عبر YouTube عند فتح ملف
            الإمام.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-black text-slate-900">6. مدة الاحتفاظ</h2>
          <p>
            نحتفظ ببياناتك ما دام حسابك قائماً. عند حذف حسابك تُحذف فوراً من قاعدة البيانات ملفاتك وإعلاناتك وطلبات
            الترشح (المرسلة والمستلمة) ورسائلك، وتُحذف الرسالة كذلك من صندوق الطرف الآخر. أما البلاغات التي أرسلتها
            فتحتفظ بها الإدارة للمدة اللازمة لمعالجتها فقط.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-black text-slate-900">7. حقوقك</h2>
          <p>
            لك الحق في الاطلاع على بياناتك وتصحيحها وحذفها ونقلها، والاعتراض على معالجتها، وسحب موافقتك في أي وقت. يمكنك
            حذف حسابك بنفسك من قائمة الحساب ← «حذف حسابي وبياناتي نهائياً»، أو مراسلتنا على البريد أعلاه. ولك الحق في تقديم
            شكوى لدى سلطة حماية البيانات في بلدك.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-black text-slate-900">8. ملفات تعريف الارتباط والتخزين المحلي</h2>
          <p>
            تستخدم المنصة فقط التخزين الضروري لتسجيل الدخول (Firebase Authentication). لا نستخدم ملفات تعريف ارتباط
            إعلانية أو أدوات تتبع.
          </p>
        </section>
      </article>
    </section>
  );
};
