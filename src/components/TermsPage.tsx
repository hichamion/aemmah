import React from 'react';
import { ArrowRight, Scale } from 'lucide-react';
import { CONTACT_EMAIL } from '../config';

export const TermsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <section className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
    <button onClick={onBack} className="text-brass-300 hover:text-brass-200 font-bold text-xs flex items-center gap-1 mb-4 cursor-pointer">
      <ArrowRight className="w-4 h-4" />
      <span>العودة للرئيسية</span>
    </button>

    <article className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 text-sm text-slate-700 leading-relaxed">
      <header className="space-y-2 border-b border-slate-100 pb-4">
        <h1 className="text-2xl font-black text-slate-900 font-amiri flex items-center gap-2">
          <Scale className="w-6 h-6 text-emerald-700" />
          شروط الاستخدام
        </h1>
        <p className="text-xs text-slate-500">آخر تحديث: 2026-11-16</p>
      </header>

      <section className="space-y-2">
        <h2 className="font-black text-slate-900">1. عن المنصة</h2>
        <p>منصة أئمة بوابة للتواصل والربط بين الأئمة والقرّاء والمساجد والجمعيات. توضّح هذه الشروط قواعد استخدام المنصة وخدماتها.</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-black text-slate-900">2. الحساب والبيانات</h2>
        <p>يرجى تقديم معلومات صحيحة وتحديثها عند الحاجة، واستخدام الحساب المناسب لصفتك، والمحافظة على أمان وسيلة الدخول. لا يجوز انتحال شخصية شخص أو جهة أخرى.</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-black text-slate-900">3. الاستخدام المقبول</h2>
        <p>يجب احترام المستخدمين والقوانين المعمول بها. لا يجوز نشر محتوى مخالف للقانون أو مضلل أو مسيء، أو إرسال رسائل مزعجة، أو محاولة الوصول غير المصرّح به إلى حسابات الآخرين أو بياناتهم.</p>
        <p>لا تستخدم بيانات التواصل التي تصل إليها إلا للغرض الذي أتيحت من أجله، ولا تنشر معلومات أو وثائق تخص آخرين دون إذن مناسب.</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-black text-slate-900">4. المحتوى والمراجعة</h2>
        <p>أنت مسؤول عن المعلومات والملفات والرسائل التي ترسلها، وعن امتلاك الحق في مشاركتها. قد تراجع الإدارة الملفات والإعلانات والبلاغات، وقد ترفض المحتوى المخالف أو تزيله أو تتخذ إجراءً مناسباً لحماية المنصة ومستخدميها.</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-black text-slate-900">5. التواصل والاتفاقات</h2>
        <p>المنصة ليست وكالة توظيف أو جهة للهجرة، ولا تصدر التأشيرات أو تتولى إجراءاتها، ولا تضمن الحصول على فرصة أو عقد أو تأشيرة. تقع مسؤولية التحقق من المعلومات والاتفاقات والمتطلبات والإجراءات الرسمية على الأطراف المعنية.</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-black text-slate-900">6. الخصوصية وحذف الحساب</h2>
        <p>
          توضح <a href="#/privacy" className="text-emerald-700 underline">سياسة الخصوصية</a> كيفية التعامل مع البيانات وخياراتك بشأنها.
          يمكنك طلب حذف حسابك وبياناتك من قائمة الحساب أو التواصل مع الإدارة. يُخفى الحساب فوراً ويُحذف نهائياً بعد سبعة أيام، ويمكنك استرجاعه قبل ذلك بتسجيل الدخول.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-black text-slate-900">7. توفر الخدمة والتغييرات</h2>
        <p>قد تتغير المنصة أو تتوقف بعض خدماتها مؤقتاً للصيانة أو لأسباب خارجة عن السيطرة. قد تُحدّث هذه الشروط عند الحاجة، ويُعرض تاريخ آخر تحديث في أعلى الصفحة، مع مراعاة أي إشعار تقتضيه القوانين المعمول بها.</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-black text-slate-900">8. التواصل</h2>
        <p>
          للاستفسارات أو الإبلاغ عن مشكلة، استخدم صفحة <a href="#/contact" className="text-emerald-700 underline">راسل الإدارة</a> أو البريد الإلكتروني:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} dir="ltr" className="text-emerald-700 underline">{CONTACT_EMAIL}</a>.
        </p>
      </section>
    </article>
  </section>
);
