import React, { useState } from 'react';
import { getStatsConsent, setStatsConsent } from '../lib/visits';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { CONTACT_EMAIL } from '../config';
import { t } from '../i18n';

/**
 * Privacy policy (GDPR / DSGVO oriented).
 * IMPORTANT: Fill in the operator details below (OPERATOR) and have the text reviewed
 * by a lawyer for your country before going live. This is a template, not legal advice.
 */
const OPERATOR = {
  name: '[اسم المسؤول عن المنصة أو الجمعية]',
  address: '[العنوان البريدي الكامل]',
};

const LAST_UPDATED = '2026-11-16';

export const PrivacyPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [consent, setConsent] = useState(getStatsConsent);
  return (
    <section className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
      <button onClick={onBack} className="text-brass-300 hover:text-brass-200 font-bold text-xs flex items-center gap-1 mb-4 cursor-pointer">
        <ArrowRight className="w-4 h-4" />
        <span>{t('العودة للرئيسية')}</span>
      </button>

      <article className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 text-sm text-slate-700 leading-relaxed">
        <header className="space-y-2 border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-black text-slate-900 font-amiri flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-700" />
            {t('سياسة الخصوصية وحماية البيانات')}
          </h1>
          <p className="text-xs text-slate-500">{t('آخر تحديث: {d}', { d: LAST_UPDATED })}</p>
        </header>

        <section className="space-y-2">
          <h2 className="font-black text-slate-900">{t('1. الجهة المسؤولة')}</h2>
          <p>
            {t('المسؤول عن معالجة البيانات في منصة «أئمة» هو: {name}، {address}. للتواصل بخصوص بياناتك:', { name: t(OPERATOR.name), address: t(OPERATOR.address) })}{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} dir="ltr" className="text-emerald-700 underline">{CONTACT_EMAIL}</a>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-black text-slate-900">{t('2. البيانات التي نجمعها')}</h2>
          <ul className="list-disc ps-5 space-y-1">
            <li>{t('بيانات الحساب: الاسم، والبريد الإلكتروني أو رقم الهاتف المستعمل للدخول، والصورة الرمزية التي يرسلها جوجل عند الدخول به. كلمات المرور تحفظها خدمة Firebase Authentication مشفّرة، ولا نطّلع عليها.')}</li>
            <li>{t('ملف الإمام: الاسم، العمر، البلد، المؤهلات، الرواية، اللغات، حالة التأشيرة، السيرة الذاتية، رابط التلاوة، وصورة اختيارية.')}</li>
            <li>{t('بيانات التواصل: رقم الهاتف، الواتساب، البريد الإلكتروني.')}</li>
            <li>{t('وثائق اختيارية: نسخة التأشيرة/الإقامة والشواهد العلمية.')}</li>
            <li>{t('إعلانات المساجد، طلبات الترشح، الرسائل داخل المنصة، والبلاغات.')}</li>
            <li>{t('رسائل نموذج «راسل الإدارة» والاقتراحات: الاسم والبريد (اختياريان) ونص الرسالة، ولا تطّلع عليها إلا الإدارة.')}</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-black text-slate-900">{t('3. الغرض والأساس القانوني')}</h2>
          <p>
            {t('نعالج البيانات فقط لغرض الربط بين الأئمة والمساجد وتشغيل المنصة، على أساس موافقتك (المادة 6(1)(أ) من اللائحة العامة لحماية البيانات GDPR) وتنفيذ خدمة المنصة التي طلبتها (المادة 6(1)(ب)). لا نبيع البيانات ولا نستخدمها للإعلانات.')}
          </p>
          <p>
            {t('قد تراسلك إدارة المنصة على رقمك (عبر واتساب أو الهاتف) في ما يخص حسابك وملفك فقط: شكر، أو تذكير بتحديث الملف، أو تنبيه مهم. إن لم ترغب في ذلك فأخبرنا، فنتوقف عن مراسلتك.')}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-black text-slate-900">{t('4. من يرى بياناتك')}</h2>
          <ul className="list-disc ps-5 space-y-1">
            <li>{t('الملف العام للإمام (بدون أرقام التواصل) يظهر للجميع بعد موافقة الإدارة.')}</li>
            <li>{t('أرقام هاتف الإمام وبريده تظهر فقط لحسابات المساجد التي وثقتها الإدارة، وللإدارة.')}</li>
            <li>{t('بيانات تواصل المساجد تظهر للمستخدمين المسجلين فقط.')}</li>
            <li>{t('الوثائق المرفوعة (التأشيرة والشواهد) لا يراها إلا صاحبها والإدارة.')}</li>
            <li>{t('الرسائل لا يراها إلا المرسل والمستقبل.')}</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-black text-slate-900">{t('5. مزودو الخدمة')}</h2>
          <p>
            {t('تُستضاف صفحات الموقع على GitHub Pages (شركة GitHub التابعة لـ Microsoft)، وقد يسجّل خادمها عنوان IP لأغراض الأمان والتشغيل. وتُحفظ بيانات المنصة لدى Google Firebase (شركة Google) كمعالج بيانات نيابة عنا. قد تُعالَج بعض البيانات خارج الاتحاد الأوروبي وفق البنود التعاقدية القياسية المعتمدة. تُعرض مقاطع التلاوة عبر YouTube عند فتح ملف الإمام.')}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-black text-slate-900">{t('6. مدة الاحتفاظ')}</h2>
          <p>
            {t('نحتفظ ببياناتك ما دام حسابك قائماً. عند طلب حذف حسابك يُخفى ملفك وإعلاناتك فوراً، ويبقى الحساب سبعة أيام يمكنك خلالها استرجاعه بتسجيل الدخول؛ ثم تُحذف نهائياً من قاعدة البيانات ملفاتك وإعلاناتك وطلبات الترشح (المرسلة والمستلمة) ورسائلك، وتُحذف الرسالة كذلك من صندوق الطرف الآخر. ويمكنك اختيار «احذفه الآن نهائياً» خلال هذه المدة فيتم الحذف فوراً. أما البلاغات التي أرسلتها فتحتفظ بها الإدارة للمدة اللازمة لمعالجتها فقط.')}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-black text-slate-900">{t('7. حقوقك')}</h2>
          <p>
            {t('لك الحق في الاطلاع على بياناتك وتصحيحها وحذفها ونقلها، والاعتراض على معالجتها، وسحب موافقتك في أي وقت. يمكنك حذف حسابك بنفسك من قائمة الحساب ← «حذف حسابي وبياناتي» (نهائياً بعد سبعة أيام، أو فوراً إن اخترت ذلك)، أو مراسلتنا على البريد أعلاه. ولك الحق في تقديم شكوى لدى سلطة حماية البيانات في بلدك.')}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-black text-slate-900">{t('8. ملفات تعريف الارتباط والتخزين المحلي')}</h2>
          <p>
            {t('تستخدم المنصة التخزين الضروري لتسجيل الدخول (Firebase Authentication) ولحفظ اختيارك بخصوص الإحصاء. لا نستخدم ملفات تعريف ارتباط إعلانية ولا أدوات تتبع من أطراف ثالثة ولا «بصمة المتصفح».')}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-black text-slate-900">{t('9. إحصاء الزيارات')}</h2>
          <p>
            {t('لمعرفة عدد زوار المنصة نسجّل عند كل فتحة جديدة للموقع سجلاً مجهولاً لا يحتوي إلا على وقت الزيارة (لا عنوان IP، ولا اسم، ولا معرّف للجهاز). لا يُحتسب تحديث الصفحة. لا يطّلع على هذه الأرقام إلا مدير المنصة (المادة 6/1/و من اللائحة العامة لحماية البيانات: مصلحة مشروعة في معرفة مدى استعمال المنصة).')}
          </p>
          <p>
            {t('بموافقتك فقط (المادة 25 من قانون TDDDG الألماني) نحفظ في متصفحك رقماً عشوائياً لا يدل عليك، لنعرف عدد الزوار المميزين تقريبياً. يمكنك سحب الموافقة في أي وقت بالزر أدناه، فيُحذف الرقم من متصفحك.')}
          </p>
          <button onClick={() => { setStatsConsent(consent === 'yes' ? 'no' : 'yes'); setConsent(getStatsConsent()); }}
            className="inline-flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-full border border-emerald-700 text-emerald-800 hover:bg-emerald-50 cursor-pointer">
            {consent === 'yes' ? t('سحب الموافقة على إحصاء الزوار المميزين') : t('الموافقة على إحصاء الزوار المميزين')}
          </button>
        </section>
      </article>
    </section>
  );
};
