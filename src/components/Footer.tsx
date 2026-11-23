import React from 'react';
import { MosqueIcon } from './MosqueIcon';
import { ShieldCheck, Mic, Info, Scale } from 'lucide-react';
import { LogoMark } from './Logo';
import { CONTACT_EMAIL } from '../config';
import { t } from '../i18n';

interface FooterProps {
  /** List of imams (for mosques). */
  onOpenImamsList: () => void;
  /** List of mosque ads (for imams). */
  onOpenMosquesList: () => void;
  onOpenImamAdd: () => void;
  onOpenMosqueAdd: () => void;
  onOpenHowItWorks: () => void;
  onOpenContact: () => void;
  /** Undefined while no support method is configured. */
  onOpenSupport?: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  /** The signed-in imam already has a profile. */
  hasOwnImamProfile?: boolean;
}

const linkClass = 'hover:text-amber-300 transition cursor-pointer text-right';

export const Footer: React.FC<FooterProps> = ({
  onOpenImamsList,
  onOpenMosquesList,
  onOpenImamAdd,
  onOpenMosqueAdd,
  onOpenHowItWorks,
  onOpenContact,
  onOpenSupport,
  onOpenPrivacy,
  onOpenTerms,
  hasOwnImamProfile = false,
}) => {
  return (
    <footer
      style={{ backgroundImage: `linear-gradient(rgb(8 32 26 / 0.5), rgb(8 32 26 / 0.7)), url(${import.meta.env.BASE_URL}bg-skyline.jpg)` }}
      className="site-footer bg-night bg-cover bg-bottom text-slate-200 border-t border-emerald-900/60 pt-12 pb-28 lg:pb-8 px-4 sm:px-6 lg:px-8 text-sm">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <LogoMark className="w-10 h-10" />
              <span className="text-white text-lg font-black font-amiri tracking-wide">
                {t('منصة أئمة')} <span className="text-amber-400 font-sans text-sm font-bold">Aemmah</span>
              </span>
            </div>
            <p className="leading-relaxed">
              {t('منصة تربط الأئمة والقرّاء بالمساجد والجمعيات الإسلامية في أوروبا.')}
            </p>
            <div className="flex items-center gap-2 text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{t('تراجع الإدارة كل ملف وإعلان قبل نشره')}</span>
            </div>
          </div>

          {/* Imams */}
          <nav className="space-y-3" aria-label={t('للأئمة والقرّاء')}>
            <h2 className="text-white font-extrabold flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>{t('للأئمة والقرّاء')}</span>
            </h2>
            <ul className="space-y-2">
              <li><button onClick={onOpenMosquesList} className={linkClass}>{t('تصفح إعلانات المساجد')}</button></li>
              <li><button onClick={onOpenImamAdd} className={linkClass}>{hasOwnImamProfile ? t('تعديل ملفي كإمام') : t('أنشئ ملفك كإمام')}</button></li>
            </ul>
          </nav>

          {/* Mosques */}
          <nav className="space-y-3" aria-label={t('للمساجد والجمعيات')}>
            <h2 className="text-white font-extrabold flex items-center gap-1.5">
              <MosqueIcon className="w-4 h-4 text-amber-400" />
              <span>{t('للمساجد والجمعيات')}</span>
            </h2>
            <ul className="space-y-2">
              <li><button onClick={onOpenImamsList} className={linkClass}>{t('تصفح الأئمة المتاحين')}</button></li>
              <li><button onClick={onOpenMosqueAdd} className={linkClass}>{t('انشر إعلان مسجدك')}</button></li>
            </ul>
          </nav>

          {/* Platform */}
          <nav className="space-y-3" aria-label={t('عن المنصة')}>
            <h2 className="text-white font-extrabold flex items-center gap-1.5">
              <Info className="w-4 h-4 text-sky-400" />
              <span>{t('عن المنصة')}</span>
            </h2>
            <ul className="space-y-2">
              <li><button onClick={onOpenHowItWorks} className={linkClass}>{t('كيف تعمل المنصة؟')}</button></li>
              <li><button onClick={onOpenContact} className={linkClass}>{t('راسل الإدارة / أرسل اقتراحاً')}</button></li>
              {onOpenSupport && (
                <li><button onClick={onOpenSupport} className={linkClass}>{t('ادعم المنصة')}</button></li>
              )}
              <li><button onClick={onOpenPrivacy} className={linkClass}>{t('سياسة الخصوصية')}</button></li>
              <li><button onClick={onOpenTerms} className={linkClass}>{t('شروط الاستخدام')}</button></li>
              {CONTACT_EMAIL && (
                <li>
                  <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
                    {t('تواصل معنا')}
                  </a>
                </li>
              )}
            </ul>
          </nav>
        </div>

        {/* Disclaimer: compact, readable, on every page. */}
        <section aria-labelledby="disclaimer-title" className="liquid-glass rounded-2xl !border-amber-400/20 px-4 py-3.5 sm:px-5 text-xs leading-relaxed text-slate-400">
          <h2 id="disclaimer-title" className="text-amber-300/90 font-black mb-1.5 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 shrink-0" />
            <span>{t('تنبيه وإخلاء مسؤولية')}</span>
          </h2>
          <p>
            {t('منصة أئمة ليست وكالة توظيف أو جهة للهجرة، ولا تتولى إصدار التأشيرات أو تقديم طلباتها أو متابعة إجراءاتها، كما أنها لا تبحث نيابةً عن المستخدمين عن مسجد أو وظيفة، ولا تضمن الحصول على فرصة عمل أو عقد أو تأشيرة.')}
          </p>
          <p className="mt-1">
            {t('يقتصر دور المنصة على أن تكون بوابة للتواصل وجسرًا للتعارف والربط بين الأئمة والمساجد، وتيسير تبادل المعلومات والخبرات بينهم.')}{' '}
            {t('وتبقى مسؤولية التحقق من المعلومات والبيانات والاتفاقات والإجراءات الرسمية على الأطراف المعنية.')}
          </p>
        </section>

        <div className="pt-6 border-t border-white/15 text-xs text-slate-200 [text-shadow:0_1px_4px_rgb(0_0_0/0.6)]">
          <p>© {new Date().getFullYear()} {t('منصة أئمة (Aemmah). جميع الحقوق محفوظة.')}</p>
        </div>
      </div>
    </footer>
  );
};
