import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MosqueIcon } from './MosqueIcon';
import { UserRole } from '../types';
import { HERO_PHOTOS } from '../config';
import { firstNameOf } from '../utils/helpers';
import { prefersStill, useSettings } from '../lib/settings';
import { AnnouncementTarget, useAnnouncements } from '../lib/announcements';
import { ArrowLeft, AudioLines, ChevronLeft, ChevronRight, FileSignature, HandHeart, LogIn, Mail, Mic, PieChart, Plus, HelpCircle, ShieldCheck, Sparkles, UserRound, Users, UsersRound } from 'lucide-react';

interface HeroSectionProps {
  onOpenImamList: () => void;
  onOpenMosqueList: () => void;
  onOpenImamAddModal: () => void;
  onOpenMosqueAddModal: () => void;
  onOpenDashboard: () => void;
  onOpenAuthModal: () => void;
  onOpenAdminPanel: () => void;
  /** Own profile / ads (imam or mosque account). */
  onOpenMyProfile: () => void;
  onOpenCommunity: () => void;
  /** Undefined while no support method is configured. */
  onOpenSupport?: () => void;
  currentRole: UserRole;
  /** Name shown in the greeting (signed-in users only). */
  userName?: string;
  imamsCount: number;
  mosquesCount: number;
  pendingCount: number;
  /** Hide the statistics button until there is enough data. */
  showStats: boolean;
  onOpenContact: () => void;
}

const asset = (f: string) => `${import.meta.env.BASE_URL}${f}`;

export const HeroSection: React.FC<HeroSectionProps> = (props) => {
  const {
    onOpenImamList,
    onOpenMosqueList,
    onOpenImamAddModal,
    onOpenMosqueAddModal,
    onOpenDashboard,
    onOpenAuthModal,
    onOpenAdminPanel,
    onOpenMyProfile,
    onOpenCommunity,
    onOpenSupport,
    currentRole,
    userName,
    imamsCount,
    mosquesCount,
    pendingCount,
    showStats,
    onOpenContact,
  } = props;
  const firstName = firstNameOf(userName);
  const scrollToHow = () => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });

  // Role-aware main actions of the hero.
  const primary =
    currentRole === 'visitor'
      ? { label: 'سجّل دخولك أو أنشئ حساباً', icon: <LogIn className="w-4 h-4" />, onClick: onOpenAuthModal }
      : currentRole === 'admin'
      ? { label: `لوحة الإدارة${pendingCount ? ` · ${pendingCount} طلب جديد` : ''}`, icon: <ShieldCheck className="w-4 h-4" />, onClick: onOpenAdminPanel }
      : currentRole === 'imam'
      ? { label: 'ملفي الشخصي كإمام', icon: <UserRound className="w-4 h-4" />, onClick: onOpenMyProfile }
      : { label: 'إعلانات مسجدي', icon: <MosqueIcon className="w-4 h-4" />, onClick: onOpenMyProfile };
  const secondary =
    currentRole === 'imam'
      ? { label: 'تصفح إعلانات المساجد', onClick: onOpenMosqueList }
      : currentRole === 'mosque'
      ? { label: 'تصفح الأئمة المتاحين', onClick: onOpenImamList }
      : currentRole === 'admin' && showStats
      ? { label: 'إحصائيات المنصة', onClick: onOpenDashboard }
      : { label: 'كيف تعمل المنصة؟', onClick: scrollToHow };

  const slides: Slide[] = [
    {
      key: 'tarawih',
      chip: 'رمضان والعقود الدائمة',
      title: (
        <>
          مساجد تبحث عن <span className="brass-text">أئمة وقرّاء</span>
        </>
      ),
      text: 'أنشئ ملفك مرة واحدة ليصل إلى المساجد والجمعيات في أوروبا بعد مراجعة الإدارة.',
      cta: currentRole === 'imam' ? 'تصفح الإعلانات' : currentRole === 'mosque' ? 'انشر إعلان مسجدك' : 'سجّل ملفك كإمام',
      onClick: currentRole === 'imam' ? onOpenMosqueList : currentRole === 'mosque' ? onOpenMosqueAddModal : onOpenImamAddModal,
      photo: HERO_PHOTOS.mosques,
    },
    {
      key: 'community',
      chip: 'جديد',
      title: (
        <>
          <span className="brass-text">ملتقى الأئمة</span>: علمٌ يُتبادل
        </>
      ),
      text: 'خطب ودروس ومقالات ونقاشات وتجارب ميدانية بين الأئمة المعتمدين.',
      cta: 'ادخل الملتقى',
      onClick: onOpenCommunity,
      photo: HERO_PHOTOS.imams,
    },
    {
      key: 'mosques',
      chip: 'للمساجد والجمعيات',
      title: (
        <>
          ابحث عن <span className="brass-text">إمامك لرمضان</span>
        </>
      ),
      text: 'انشر إعلان مسجدك بالشروط والمدينة، واستقبل طلبات الأئمة المعتمدين.',
      cta: currentRole === 'imam' ? 'تصفح المساجد' : 'انشر إعلانك',
      onClick: currentRole === 'imam' ? onOpenMosqueList : onOpenMosqueAddModal,
      icon: <MosqueIcon className="w-16 h-16 sm:w-20 sm:h-20" strokeWidth={1.2} />,
    },
    {
      key: 'recitation',
      chip: 'عيّنة التلاوة',
      title: (
        <>
          دع المساجد <span className="brass-text">تسمع تلاوتك</span>
        </>
      ),
      text: 'سجّل الفاتحة أو سورة قصيرة (دقيقة واحدة) وأضفها إلى ملفك.',
      cta: currentRole === 'imam' ? 'أضف تلاوتك' : 'استمع إلى الأئمة',
      onClick: currentRole === 'imam' ? onOpenMyProfile : onOpenImamList,
      icon: <AudioLines className="w-16 h-16 sm:w-20 sm:h-20" strokeWidth={1.2} />,
    },
  ];

  // Announcements written by the admin come first; the built-in slides follow unless the admin hid them.
  const { items: announcements, showDefaults } = useAnnouncements();
  const go: Record<AnnouncementTarget, (() => void) | undefined> = {
    imams: onOpenImamList,
    mosques: onOpenMosqueList,
    community: onOpenCommunity,
    'imam-register': onOpenImamAddModal,
    'mosque-add': onOpenMosqueAddModal,
    contact: onOpenContact,
    url: undefined,
    none: undefined,
  };
  const adminSlides: Slide[] = announcements
    .filter((x) => x.active)
    .map((x) => ({
      key: `ad-${x.id}`,
      chip: x.chip,
      title: x.title,
      text: x.text,
      cta: x.target === 'none' ? '' : x.cta,
      onClick: x.target === 'url' ? () => window.open(x.url, '_blank', 'noopener') : go[x.target] ?? (() => {}),
      image: x.image || undefined,
    }));
  const allSlides = adminSlides.length && !showDefaults ? adminSlides : [...adminSlides, ...slides];

  const services: Service[] = [
    { key: 'khutab', label: 'خطب ودروس', icon: <Mic />, onClick: onOpenCommunity },
    { key: 'recitations', label: currentRole === 'imam' ? 'تلاوتي' : 'تلاوات الأئمة', icon: <AudioLines />, onClick: currentRole === 'imam' ? onOpenMyProfile : onOpenImamList },
    currentRole === 'imam'
      ? { key: 'apply', label: 'التقدّم لإمامة', icon: <FileSignature />, onClick: onOpenMosqueList }
      : { key: 'request', label: 'طلب إمام', icon: <FileSignature />, onClick: onOpenMosqueAddModal },
    ...(showStats ? [{ key: 'stats', label: 'الإحصائيات', icon: <PieChart />, onClick: onOpenDashboard }] : []),
    { key: 'how', label: 'كيف تعمل المنصة؟', icon: <HelpCircle />, onClick: scrollToHow },
    { key: 'contact', label: 'راسل الإدارة', icon: <Mail />, onClick: onOpenContact },
    ...(onOpenSupport ? [{ key: 'support', label: 'ادعم المنصة', icon: <HandHeart />, onClick: onOpenSupport }] : []),
  ];

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="home-hero relative overflow-hidden text-white">
        <div className="khatam-pattern absolute inset-0 pointer-events-none" aria-hidden />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-12 pb-[5.5rem] sm:pb-32 grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3 sm:gap-8 lg:gap-12 items-center">
          {/* Welcome (larger screens only: on phones the banner and the two cards come first) */}
          <div className="hidden sm:block space-y-5 text-center lg:text-right">
            <p className="hidden sm:inline-flex items-center gap-2 rounded-full border border-brass-400/30 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-brass-200">
              <Sparkles className="w-3.5 h-3.5" />
              {firstName ? 'السلام عليكم ورحمة الله' : 'جسر تواصل وربط بين الأئمة والمساجد'}
            </p>
            {firstName ? (
              <h1 className="text-lg sm:text-5xl font-black leading-tight">
                مرحباً بك يا <span className="brass-text">{firstName}</span>
                <span className="sm:block sm:text-3xl text-white/85 font-bold sm:mt-2"> في منصة أئمة</span>
              </h1>
            ) : (
              <>
                <h1 className="sm:hidden text-lg font-black">
                  مرحباً بك في <span className="brass-text">منصة أئمة</span>
                </h1>
                <p className="hidden sm:block text-7xl font-maghribi leading-none drop-shadow-lg" aria-hidden>
                  منصة <span className="brass-text">أئمة</span>
                </p>
              </>
            )}
            <p className="hidden sm:block text-slate-300 text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
              إمام أو قارئ يبحث عن مسجد، أو مسجد يبحث عن إمام لرمضان أو لعقد دائم: ابحث عن إمامك أو مسجدك بخطوات بسيطة.
            </p>

            <div className="hidden sm:flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-2.5">
              <button
                onClick={primary.onClick}
                className="group inline-flex items-center gap-2 bg-gradient-to-l from-brass-300 to-brass-500 text-ink text-sm sm:text-base font-black px-5 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-lg shadow-brass-600/25 hover:shadow-brass-500/40 hover:brightness-105 transition cursor-pointer"
              >
                {primary.icon}
                <span>{primary.label}</span>
              </button>
              <button
                onClick={secondary.onClick}
                className="liquid-glass hidden sm:inline-flex items-center gap-1.5 hover:brightness-110 text-white text-sm sm:text-base font-bold px-4 sm:px-5 py-2.5 sm:py-3 rounded-full transition cursor-pointer"
              >
                <span>{secondary.label}</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            <dl className="hidden sm:flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 pt-1 text-xs">
              <Stat value={imamsCount} label="إمام متاح" dot="bg-emerald-400" />
              <Stat value={mosquesCount} label="مسجد يبحث عن إمام" dot="bg-brass-400" />
            </dl>
          </div>

          {/* Promotional carousel */}
          <PromoCarousel slides={allSlides} />
        </div>

        {/* Soft arch at the bottom of the hero */}
        <svg className="absolute bottom-0 inset-x-0 w-full h-10 sm:h-14 home-arch" viewBox="0 0 1440 56" preserveAspectRatio="none" aria-hidden>
          <path d="M0 56V28C240 4 480 0 720 0s480 4 720 28v28z" fill="currentColor" />
        </svg>
      </section>

      {/* ---------------- Access cards + services ---------------- */}
      <section className="relative">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-[4.5rem] sm:-mt-28 space-y-8 sm:space-y-12 pb-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-7">
            <AccessCard
              tone="imams"
              badge={imamsCount > 0 ? `${imamsCount} إمام متاح` : 'كن أول إمام يسجّل'}
              title="اختر إماماً لمسجدك"
              short="الأئمة والقرّاء المتاحون ومؤهلاتهم"
              text="تصفّح ملفات الأئمة والقرّاء المتاحين: الرواية، والخبرات، والشهادات، وعيّنة التلاوة."
              cta="تصفّح الأئمة"
              onOpen={onOpenImamList}
              secondary={currentRole === 'mosque' ? undefined : { label: currentRole === 'imam' ? 'تعديل ملفي' : 'التسجيل كإمام', onClick: currentRole === 'imam' ? onOpenMyProfile : onOpenImamAddModal }}
              photo="card-imams.jpg"
              focus="72% 30%"
              icon={<Users className="w-6 h-6" />}
            />
            <AccessCard
              tone="mosques"
              badge={mosquesCount > 0 ? `${mosquesCount} مسجد يبحث عن إمام` : 'انشر أول إعلان'}
              title="ابحث عن مسجد مناسب"
              short="مساجد وجمعيات تبحث عن إمام"
              text="استعرض المساجد والجمعيات التي تبحث عن إمام، وشروطها، ومدنها، ثم تقدّم إليها."
              cta="تصفّح المساجد"
              onOpen={onOpenMosqueList}
              secondary={currentRole === 'imam' ? undefined : { label: 'إضافة إعلان مسجد', onClick: onOpenMosqueAddModal }}
              photo="card-mosques.jpg"
              focus="40% 40%"
              icon={<MosqueIcon className="w-6 h-6" />}
            />
          </div>

          <QuickServices services={services} onCommunity={onOpenCommunity} />
        </div>

        <div className="relative px-4 sm:px-6 lg:px-8 pb-16">
          <HowItWorks onOpenContact={onOpenContact} />
        </div>
      </section>
    </>
  );
};

// ---------------------------------------------------------------------------

const Stat: React.FC<{ value: number; label: string; dot: string }> = ({ value, label, dot }) => (
  <div className="liquid-glass inline-flex items-center gap-2 rounded-full px-3 py-1.5">
    <span className={`w-2 h-2 rounded-full ${dot}`} aria-hidden />
    <dt className="sr-only">{label}</dt>
    <dd className="font-black tabular-nums text-white">{value}</dd>
    <span className="text-slate-300">{label}</span>
  </div>
);

type Slide = {
  key: string;
  chip: string;
  title: React.ReactNode;
  text: string;
  /** Empty = no button. */
  cta: string;
  onClick: () => void;
  photo?: string;
  /** Full image URL (announcements of the admin). */
  image?: string;
  icon?: React.ReactNode;
};

/** Cross-fading banner: auto-advances, pauses on hover / focus, swipe on touch, dots and arrows. */
const PromoCarousel: React.FC<{ slides: Slide[] }> = ({ slides }) => {
  const settings = useSettings();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef<number | null>(null);
  const n = slides.length;
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);

  useEffect(() => {
    const reduce = prefersStill();
    if (paused || reduce) return;
    const t = window.setInterval(() => !document.hidden && go(1), 6500);
    return () => window.clearInterval(t);
  }, [paused, go, settings.reduceMotion]);

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label="إعلانات المنصة"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="relative h-[10.5rem] min-[400px]:h-44 sm:h-[19rem] lg:h-[21rem] rounded-[1.6rem] sm:rounded-[2rem] overflow-hidden border-[3px] border-brass-400/90 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.7),0_0_0_6px_rgba(214,174,92,0.14)] bg-ink-soft touch-pan-y"
        onPointerDown={(e) => (startX.current = e.clientX)}
        onPointerUp={(e) => {
          if (startX.current === null) return;
          const dx = e.clientX - startX.current;
          startX.current = null;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        {slides.map((s, k) => {
          const on = k === i;
          return (
            <div
              key={s.key}
              role="group"
              aria-roledescription="slide"
              aria-label={`${k + 1} من ${n}`}
              aria-hidden={!on}
              className={`absolute inset-0 transition-opacity duration-700 ${on ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'}`}
            >
              {s.image ? (
                <img src={s.image} alt="" className={`absolute inset-0 w-full h-full object-cover opacity-80 ${on ? 'kenburns' : ''}`} />
              ) : s.photo ? (
                <img src={asset(s.photo)} alt="" className={`absolute inset-0 w-full h-full object-cover opacity-55 ${on ? 'kenburns' : ''}`} />
              ) : (
                <div className="absolute inset-0 khatam-pattern bg-gradient-to-br from-lagoon-700 via-ink-soft to-cedar-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-l from-ink/95 via-ink/70 to-ink/10" />
              {s.icon && (
                <div className="absolute left-4 sm:left-10 top-1/2 -translate-y-1/2 w-20 h-20 sm:w-40 sm:h-40 [&>svg]:w-10 [&>svg]:h-10 sm:[&>svg]:w-20 sm:[&>svg]:h-20 rounded-full border border-brass-400/30 bg-white/5 text-brass-300 flex items-center justify-center" aria-hidden>
                  {s.icon}
                </div>
              )}
              {on && (
                <div className="slide-copy relative h-full flex flex-col justify-center items-start gap-1.5 sm:gap-3 px-4 sm:px-10 max-w-[74%] sm:max-w-[70%]">
                  {s.chip && (
                    <span className="liquid-glass inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-brass-200">
                      {s.chip}
                    </span>
                  )}
                  <h2 className="text-lg min-[400px]:text-xl sm:text-[2.1rem] font-kufi leading-snug text-white">{s.title}</h2>
                  <p className="hidden sm:block text-sm text-slate-200/90 leading-relaxed">{s.text}</p>
                  {s.cta && <button
                    onClick={s.onClick}
                    className="mt-1 inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-l from-brass-300 to-brass-500 text-ink text-xs sm:text-sm font-black px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-lg shadow-black/30 hover:brightness-105 transition cursor-pointer"
                  >
                    {s.cta} <ArrowLeft className="w-4 h-4" />
                  </button>}
                </div>
              )}
            </div>
          );
        })}

        <div className="absolute z-20 bottom-3 left-3 hidden sm:flex gap-1.5">
          <button onClick={() => go(-1)} aria-label="الإعلان السابق" className="liquid-glass w-9 h-9 rounded-full hover:brightness-110 flex items-center justify-center cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => go(1)} aria-label="الإعلان التالي" className="liquid-glass w-9 h-9 rounded-full hover:brightness-110 flex items-center justify-center cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex justify-center gap-1.5 mt-2.5 sm:mt-4" role="tablist" aria-label="اختر إعلاناً">
        {slides.map((s, k) => (
          <button
            key={s.key}
            role="tab"
            aria-selected={k === i}
            aria-label={`الإعلان ${k + 1}`}
            onClick={() => setI(k)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${k === i ? 'w-8 bg-brass-400' : 'w-2 bg-white/25 hover:bg-white/45'}`}
          />
        ))}
      </div>
    </div>
  );
};

/** Makes a whole card act like a link (click, Enter or Space), while inner buttons keep their own action. */
const cardLink = (onOpen: () => void) => ({
  role: 'link',
  tabIndex: 0,
  onClick: onOpen,
  onKeyDown: (e: React.KeyboardEvent) => {
    if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onOpen();
    }
  },
});

const stop = (fn: () => void) => (e: React.MouseEvent) => {
  e.stopPropagation();
  fn();
};

const AccessCard: React.FC<{
  tone: 'imams' | 'mosques';
  badge: string;
  title: string;
  text: string;
  /** Shorter text for phones. */
  short: string;
  cta: string;
  onOpen: () => void;
  secondary?: { label: string; onClick: () => void };
  /** Background photo (public/), e.g. card-imams.jpg. */
  photo: string;
  /** CSS object-position of the photo, to keep the subject visible. */
  focus?: string;
  icon: React.ReactNode;
}> = ({ tone, badge, title, text, short, cta, onOpen, secondary, photo, focus = 'center', icon }) => {
  // Brand tint over the photo: transparent at the top (the photo shows), deep at the bottom (the text reads).
  const tint =
    tone === 'imams'
      ? 'from-[#0b3640]/95 via-[#155664]/55 to-[#2a8090]/10'
      : 'from-cedar-900/95 via-cedar-800/50 to-cedar-600/5';
  return (
    <div
      {...cardLink(onOpen)}
      className="lift group relative overflow-hidden isolate rounded-[1.6rem] sm:rounded-[2rem] bg-ink text-white min-h-[17.5rem] sm:min-h-[26rem] p-3.5 sm:p-8 shadow-xl shadow-ink/25 hover:shadow-2xl hover:shadow-ink/35 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-brass-300 flex flex-col justify-end ring-1 ring-white/10"
    >
      <div className="absolute inset-0 -z-10" aria-hidden>
        <img
          src={asset(photo)}
          alt=""
          loading="eager"
          style={{ objectPosition: focus }}
          className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${tint}`} />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Top row (larger screens): glass icon and count */}
      <div className="hidden sm:flex absolute top-6 inset-x-6 items-start justify-between gap-3">
        <span className="liquid-glass w-12 h-12 rounded-2xl flex items-center justify-center text-white">{icon}</span>
        <span className="liquid-glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black tabular-nums">
          <span className={`w-1.5 h-1.5 rounded-full ${tone === 'imams' ? 'bg-emerald-300' : 'bg-brass-300'}`} aria-hidden /> {badge}
        </span>
      </div>
      <span className="sm:hidden liquid-glass absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black tabular-nums">
        <span className={`w-1.5 h-1.5 rounded-full ${tone === 'imams' ? 'bg-emerald-300' : 'bg-brass-300'}`} aria-hidden /> {badge}
      </span>

      <div className="space-y-1 sm:space-y-2 text-center sm:text-right [text-shadow:0_2px_12px_rgba(0,0,0,0.65)]">
        <h2 className="text-[1.02rem] min-[400px]:text-lg sm:text-[2.6rem] font-kufi leading-snug">{title}</h2>
        <p className="sm:hidden text-[11px] font-bold text-white leading-relaxed">{short}</p>
        <p className="hidden sm:block text-[0.95rem] font-semibold text-white leading-relaxed max-w-md">{text}</p>
      </div>

      <div className="mt-3 sm:mt-6 flex flex-wrap items-center gap-2.5">
        <button
          onClick={stop(onOpen)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-l from-brass-200 to-brass-400 text-ink text-[13px] sm:text-base font-black px-3 sm:px-5 py-2.5 sm:py-3 rounded-full shadow-lg shadow-black/30 hover:brightness-105 transition cursor-pointer"
        >
          {cta}
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        </button>
        {secondary && (
          <button
            onClick={stop(secondary.onClick)}
            className="liquid-glass hidden sm:inline-flex items-center gap-1.5 text-white text-sm font-bold px-4 py-3 rounded-full transition hover:brightness-110 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {secondary.label}
          </button>
        )}
      </div>
    </div>
  );
};

type Service = { key: string; label: string; icon: React.ReactElement; onClick: () => void };

/** Round shortcuts with a brass ring (wraps on phones, one row on wide screens). */
const QuickServices: React.FC<{ services: Service[]; onCommunity: () => void }> = ({ services, onCommunity }) => (
  <nav aria-label="خدمات سريعة" className="liquid-glass-light rounded-[2rem] px-3 sm:px-6 py-5 sm:py-6 space-y-5">
    {/* Featured: the imams' community (its own colours and shape, not one more circle) */}
    <button onClick={onCommunity}
      className="group relative w-full overflow-hidden rounded-[1.6rem] text-right cursor-pointer bg-gradient-to-l from-[#0f3127] via-cedar-700 to-[#2f7a63] text-white px-4 sm:px-6 py-4 flex items-center gap-4 shadow-[0_14px_30px_-14px_rgba(15,49,39,0.8)] ring-2 ring-brass-400/70 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-brass-300">
      <span className="absolute inset-0 khatam-pattern opacity-70" aria-hidden />
      <span className="absolute -left-10 -top-12 w-40 h-40 rounded-full bg-brass-300/20 blur-2xl" aria-hidden />
      <span className="relative w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-brass-200 via-brass-400 to-brass-600 text-ink flex items-center justify-center shadow-lg">
        <UsersRound className="w-7 h-7" />
      </span>
      <span className="relative flex-1 min-w-0">
        <span className="block font-kufi text-xl sm:text-2xl leading-tight">ملتقى الأئمة</span>
        <span className="block text-xs sm:text-sm text-white/85 mt-0.5">خطب ودروس ونقاشات وتجارب بين الأئمة المعتمدين</span>
      </span>
      <span className="relative shrink-0 inline-flex items-center gap-1 bg-gradient-to-l from-brass-200 to-brass-400 text-ink text-xs sm:text-sm font-black px-3.5 py-2 rounded-full">
        ادخل <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
      </span>
    </button>

    <ul className="flex flex-wrap justify-center gap-x-2 gap-y-5 sm:gap-x-4">
      {services.map((s) => (
        <li key={s.key} className="w-[31%] sm:w-auto sm:min-w-[6.5rem]">
          <button onClick={s.onClick} className="group w-full flex flex-col items-center gap-2 cursor-pointer focus:outline-none">
            <span className="relative w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-full p-[3px] bg-gradient-to-br from-brass-200 via-brass-500 to-brass-700 shadow-md transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-focus-visible:ring-4 group-focus-visible:ring-brass-300">
              <span className="w-full h-full rounded-full bg-gradient-to-br from-cedar-600 to-cedar-900 text-brass-100 flex items-center justify-center [&>svg]:w-7 [&>svg]:h-7 [&>svg]:transition-transform group-hover:[&>svg]:scale-110">
                {s.icon}
              </span>
            </span>
            <span className="text-[12px] sm:text-sm font-black text-ink text-center leading-tight">{s.label}</span>
          </button>
        </li>
      ))}
    </ul>
  </nav>
);

const STEPS = [
  {
    title: 'سجّل دخولك واختر نوع حسابك',
    text: 'بحساب جوجل أو بالبريد الإلكتروني. اختر «إمام / قارئ» أو «مسجد / جمعية».',
  },
  {
    title: 'أنشئ ملفك أو إعلانك',
    text: 'الإمام: السيرة والرواية وعيّنة التلاوة وحالة التأشيرة. المسجد: المدينة ونوع الإمام المطلوب والشروط.',
  },
  {
    title: 'تراجعه الإدارة ثم يُنشر',
    text: 'لا يظهر أي ملف أو إعلان للعموم قبل موافقة الإدارة، حفاظاً على جدية المنصة.',
  },
  {
    title: 'تواصلوا مباشرة',
    text: 'يتقدم الإمام للإعلان، أو يطلب المسجد مقابلة. أرقام الأئمة لا تظهر إلا للمساجد الموثقة.',
  },
];

const FAQ = [
  { q: 'هل التسجيل مجاني؟', a: 'نعم، التسجيل ونشر الملفات والإعلانات مجاني.' },
  { q: 'من يرى رقم هاتفي كإمام؟', a: 'لا يظهر رقمك ولا بريدك للزوار. تراه فقط حسابات المساجد التي وثقتها الإدارة، والإدارة نفسها.' },
  { q: 'متى يصبح حساب المسجد موثقاً؟', a: 'عندما توافق الإدارة على أول إعلان له. عندها يمكنه رؤية بيانات تواصل الأئمة المعتمدين.' },
  { q: 'هل يمكنني حذف حسابي؟', a: 'نعم، في أي وقت من قائمة الحساب. تُحذف ملفاتك وإعلاناتك ورسائلك نهائياً.' },
];

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-center space-y-2">
    <h2 className="text-3xl sm:text-4xl font-kufi text-parchment drop-shadow-sm">{children}</h2>
    <div className="flex items-center justify-center gap-2 text-brass-500" aria-hidden>
      <span className="h-px w-10 bg-gradient-to-l from-brass-400 to-transparent" />
      <span className="w-2 h-2 rotate-45 bg-brass-400" />
      <span className="h-px w-10 bg-gradient-to-r from-brass-400 to-transparent" />
    </div>
  </div>
);

const HowItWorks: React.FC<{ onOpenContact: () => void }> = ({ onOpenContact }) => (
  <div id="how-it-works" className="max-w-6xl mx-auto mt-14 space-y-14 scroll-mt-24">
    <div className="space-y-8">
      <SectionTitle>كيف تعمل المنصة؟</SectionTitle>
      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {STEPS.map((step, i) => (
          <li key={step.title} className="lift relative bg-white rounded-3xl p-6 ring-1 ring-sand shadow-sm hover:shadow-lg hover:shadow-cedar-900/5 overflow-hidden">
            <span className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-cedar-600 to-cedar-800 text-brass-100 font-black flex items-center justify-center text-sm shadow">
              {i + 1}
            </span>
            <h3 className="relative font-black text-ink mt-4">{step.title}</h3>
            <p className="relative text-sm text-slate-600 leading-relaxed mt-1.5">{step.text}</p>
          </li>
        ))}
      </ol>
    </div>

    <div className="space-y-6 max-w-3xl mx-auto">
      <SectionTitle>أسئلة شائعة</SectionTitle>
      <div className="space-y-2.5">
        {FAQ.map((item) => (
          <details key={item.q} className="group bg-white rounded-2xl ring-1 ring-sand px-5 py-4 open:shadow-md transition-shadow">
            <summary className="font-bold text-ink cursor-pointer list-none flex justify-between items-center gap-3">
              <span>{item.q}</span>
              <span className="w-7 h-7 shrink-0 rounded-full bg-brass-100 text-brass-700 flex items-center justify-center text-lg transition-transform duration-300 group-open:rotate-45" aria-hidden>
                +
              </span>
            </summary>
            <p className="text-sm text-slate-600 leading-relaxed pt-3">{item.a}</p>
          </details>
        ))}
      </div>
      <p className="text-center text-sm text-white/75 pt-2">
        لم تجد جواب سؤالك؟{' '}
        <button onClick={onOpenContact} className="text-brass-300 font-bold underline decoration-brass-400 underline-offset-4 cursor-pointer">
          راسل الإدارة أو أرسل اقتراحاً
        </button>
      </p>
    </div>
  </div>
);
