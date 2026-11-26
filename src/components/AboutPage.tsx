import React from 'react';
import { ArrowRight, Award, BadgeCheck, Briefcase, Gift, GraduationCap, HeartHandshake, Lock, MessageSquareQuote, Users } from 'lucide-react';
import { t } from '../i18n';

/*
 * «About us»: who founded Aemmah and why, and the principles of the platform (opinions: TestimonialsPage).
 * The founder paragraphs are the founder's own words; keep them as he approves them.
 */
/** [years, what, where / detail] — from the founder's CV; texts are translated where shown. */
type FounderItem = [string, string, string];

const EDUCATION: FounderItem[] = [
  ['1992–1998', 'مدرسة الحسن الداخل', 'صفرو'],
  ['1998–2006', 'حفظ القرآن الكريم', 'مكناس، قرية با محمد'],
  ['2006–2009', 'مدرسة الإمام الهبطي للتعليم العتيق', 'قرية با محمد'],
  ['2009–2012', 'مؤسسة الفتح للتعليم العتيق', 'مكناس'],
  ['2012–2013', 'سنة في كلية الشريعة والقانون', 'فاس'],
  ['2018–2021', 'إجازة في الشريعة وأصول الدين', 'فرنسا'],
];

const CERTIFICATES: FounderItem[] = [
  ['2010', 'شهادة حفظ القرآن الكريم برواية ورش عن نافع', 'المغرب'],
  ['2010', 'شهادة الإمامة', 'المغرب'],
  ['2010', 'شهادة الوعظ والإرشاد', 'المغرب'],
  ['2010', 'شهادة الثانوية العامة في التعليم الإسلامي العتيق', 'المغرب'],
  ['2011', 'شهادة الخطابة', 'المغرب'],
  ['2017', 'إجازة برواية حفص عن عاصم بالسند المتصل إلى رسول الله صلى الله عليه وسلم', 'الإمارات'],
  ['2017', 'إجازة وإسناد في متن الجزرية في تجويد القرآن الكريم', 'الإمارات'],
  ['2021', 'الإجازة في الشريعة وأصول الدين بالعربية', 'فرنسا'],
  ['', 'شهادة من جامعة مونستر', 'ألمانيا'],
];

const EXPERIENCE: FounderItem[] = [
  ['2006–2009', 'تدريس التجويد والخط العربي للطلاب', 'مدرسة الإمام الهبطي للتعليم العتيق، قرية با محمد (تاونات، المغرب)'],
  ['2013–2018', 'إمام وخطيب ومحفّظ ومدرّس بمسجد حمد سهيل الخييلي', 'الهيئة العامة للشؤون الإسلامية والأوقاف (العين، الإمارات)'],
  ['2017–2018', 'تدريس مادة التجويد للأئمة', 'الهيئة العامة للشؤون الإسلامية والأوقاف (العين، الإمارات)'],
  ['2018 – اليوم', 'إمام وخطيب ومحفّظ ومدرّس بمسجد عمر بن الخطاب', 'الجمعية المغربية الإسلامية، دوسلدورف (ألمانيا)'],
];

const FounderList: React.FC<{ icon: React.ReactNode; title: string; items: FounderItem[]; footer?: string }> = ({ icon, title, items, footer }) => (
  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
    <h3 className="font-black text-slate-900 flex items-center gap-2">
      <span className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center">{icon}</span>
      {title}
    </h3>
    <ol className="relative border-s-2 border-amber-300 ms-2 ps-4 space-y-3">
      {items.map(([years, what, where]) => (
        <li key={what} className="relative text-sm leading-relaxed">
          <span className="absolute -start-[23px] top-1.5 w-3 h-3 rounded-full bg-amber-400 ring-4 ring-slate-50" />
          {years && <span className="block text-xs font-black text-[#0e4d64]">{t(years)}</span>}
          <span className="block font-bold text-slate-900">{t(what)}</span>
          {where && <span className="block text-xs text-slate-500">{t(where)}</span>}
        </li>
      ))}
    </ol>
    {footer && <p className="text-xs font-bold text-emerald-800">{footer}</p>}
  </div>
);

export const AboutPage: React.FC<{
  onBack: () => void;
  onOpenContact: () => void;
  onOpenTestimonials: () => void;
}> = ({ onBack, onOpenContact, onOpenTestimonials }) => (
  <section className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8">
    <button onClick={onBack} className="text-brass-300 hover:text-brass-200 font-bold text-xs flex items-center gap-1 cursor-pointer">
      <ArrowRight className="w-4 h-4" />
      <span>{t('العودة للرئيسية')}</span>
    </button>

    <article className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-9 space-y-6 text-slate-700 leading-relaxed">
      <header className="space-y-2">
        <p className="text-xs font-black text-emerald-700 tracking-wide">{t('من نحن')}</p>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 font-amiri">{t('منصة أئمة: جسر بين الأئمة والمساجد')}</h1>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-black text-slate-900">{t('مؤسس المنصة')}</h2>
        <p>{t('أسّس منصة أئمة الشيخ هشام اجحيلل (Hichame Jhilal)، إمام وخطيب ومحفّظ للقرآن الكريم، من مدينة صفرو بالمغرب، ويقيم في دوسلدورف بألمانيا.')}</p>
        <p className="font-bold text-emerald-900 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
          {t('وما زال إلى اليوم إماماً ومحفّظاً للقرآن الكريم في خدمة بيوت الله.')}
        </p>
        <div className="grid lg:grid-cols-3 gap-4">
          <FounderList icon={<GraduationCap className="w-5 h-5" />} title={t('التعليم')} items={EDUCATION} />
          <FounderList icon={<Award className="w-5 h-5" />} title={t('الشواهد المحصّل عليها')} items={CERTIFICATES}
            footer={t('وحاصل على عدة جوائز وشواهد في حفظ القرآن الكريم وتجويده وتدريسه.')} />
          <FounderList icon={<Briefcase className="w-5 h-5" />} title={t('التجارب المهنية')} items={EXPERIENCE} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900">{t('لماذا أنشأت هذه المنصة؟')}</h2>
        <p>{t('رأيتُ عن قرب كيف تبحث المساجد والجمعيات في أوروبا كل عام عن إمام مؤهل، خاصة لصلاة التراويح في رمضان، فلا تجد طريقاً واضحاً إليه إلا المعارف والرسائل المتفرقة. ورأيت في المقابل أئمة وقرّاء متقنين لا يعرفون أي المساجد تحتاج إليهم، ولا ما شروطها، ولا كيف يصلون إليها.')}</p>
        <p>{t('فأنشأت منصة أئمة لتجمع الطرفين في مكان واحد: يعرض الإمام سيرته وتلاوته ومؤهلاته بوضوح، وينشر المسجد احتياجه وشروطه، ويتواصلان مباشرة بثقة واحترام، ومجاناً.')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900">{t('مبادئ المنصة')}</h2>
        <ul className="grid sm:grid-cols-2 gap-3">
          {[
            [<Gift key="g" className="w-5 h-5" />, t('مجانية'), t('التسجيل ونشر الملفات والإعلانات مجاني للأئمة والمساجد.')],
            [<BadgeCheck key="b" className="w-5 h-5" />, t('مراجعة قبل النشر'), t('لا يظهر ملف ولا إعلان للعموم قبل أن تراجعه الإدارة.')],
            [<Lock key="l" className="w-5 h-5" />, t('خصوصية الأرقام'), t('أرقام الأئمة لا تراها إلا المساجد الموثقة.')],
            [<Users key="u" className="w-5 h-5" />, t('ملتقى للأئمة'), t('مساحة يتبادل فيها الأئمة الخطب والدروس والتجارب.')],
          ].map(([icon, title, text], i) => (
            <li key={i} className="flex gap-3 bg-slate-50 rounded-2xl border border-slate-100 p-4">
              <span className="w-10 h-10 shrink-0 rounded-xl bg-emerald-700 text-white flex items-center justify-center">{icon}</span>
              <span>
                <span className="block font-black text-slate-900">{title}</span>
                <span className="text-sm">{text}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-500">{t('المنصة ليست وكالة توظيف ولا جهة هجرة، وإنما بوابة تواصل بين الأئمة والمساجد.')}</p>
      </section>

      <div className="flex flex-wrap items-center gap-3 bg-sky-50 border border-sky-200 rounded-2xl p-4">
        <HeartHandshake className="w-6 h-6 text-sky-700 shrink-0" />
        <p className="flex-1 min-w-48 text-sm text-sky-950">{t('لديك فكرة أو ملاحظة تحسّن المنصة؟ يسعدنا أن نسمع منك.')}</p>
        <button type="button" onClick={onOpenContact} className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-black cursor-pointer">{t('راسل الإدارة')}</button>
      </div>
    </article>

    <button type="button" onClick={onOpenTestimonials}
      className="w-full flex flex-wrap items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/15 rounded-3xl p-5 text-start cursor-pointer transition">
      <MessageSquareQuote className="w-8 h-8 text-amber-400 shrink-0" />
      <span className="flex-1 min-w-48">
        <span className="block text-lg font-black text-white">{t('ماذا قالوا عن منصة أئمة')}</span>
        <span className="block text-sm text-white/70">{t('اقرأ آراء الأئمة والمساجد والزوار، وأضف رأيك.')}</span>
      </span>
      <span className="px-4 py-2 rounded-full bg-amber-400 text-slate-950 font-black text-sm">{t('الآراء')}</span>
    </button>
  </section>
);
