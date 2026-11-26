import React from 'react';
import { ArrowRight, BadgeCheck, Gift, HeartHandshake, Lock, MessageSquareQuote, Users } from 'lucide-react';
import { t } from '../i18n';

/*
 * «About us»: who founded Aemmah and why, and the principles of the platform (opinions: TestimonialsPage).
 * The founder paragraphs are the founder's own words; keep them as he approves them.
 */
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

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900">{t('مؤسس المنصة')}</h2>
        <p>{t('أسّس منصة أئمة الشيخ هشام اجحيلل (Hicham Jhilal)، إمام وقارئ للقرآن الكريم، أمّ المصلين في صلاة التراويح في مساجد بأوروبا، منها مسجد عمر بن الخطاب في دوسلدورف بألمانيا.')}</p>
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
