import React from 'react';
import { LogIn } from 'lucide-react';
import { UserRole } from '../types';
import type { View } from '../App';

interface MobileNavProps {
  currentView: View;
  role: UserRole;
  unreadCount: number;
  onHome: () => void;
  onImams: () => void;
  onMosques: () => void;
  onCommunity: () => void;
  onAccount: () => void;
  onSignIn: () => void;
  /** The user is on one of their own pages (profile, applications, messages, admin). */
  accountActive?: boolean;
  /** Unread community notifications (red count on the centre button). */
  communityUnread?: number;
}

/* ---------- Filled golden icons (fill = the shared gold gradient #nav-gold-fill) ---------- */
type IconProps = { className?: string };
const GOLD = 'url(#nav-gold-fill)';

const HomeIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path fill={GOLD} d="M12 2.6 1.6 11.3l1.5 1.8L12 5.7l8.9 7.4 1.5-1.8z" />
    <path fill={GOLD} fillRule="evenodd" d="M4.6 12.6 12 6.6l7.4 6V21H4.6zM10 21v-5.2a2 2 0 0 1 4 0V21z" />
  </svg>
);

const ImamIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path fill={GOLD} d="M7.3 7.2C7.3 4.2 9.4 2.4 12 2.4s4.7 1.8 4.7 4.8z" />
    <rect fill={GOLD} x="6.8" y="7" width="10.4" height="1.6" rx=".8" />
    <path fill={GOLD} d="M8 9.2h8c0 3.2-1.8 5.6-4 5.6S8 12.4 8 9.2z" />
    <path fill={GOLD} fillRule="evenodd" d="M3.4 21.6c.4-3.9 3.6-6.2 8.6-6.2s8.2 2.3 8.6 6.2zM10.6 16.2 12 19.6l1.4-3.4z" />
  </svg>
);

const CommunityIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 32 24" className={className} aria-hidden>
    <circle fill={GOLD} cx="16" cy="6.2" r="4.4" />
    <path fill={GOLD} d="M8.6 22c0-4.6 3.3-7.6 7.4-7.6s7.4 3 7.4 7.6z" />
    <circle fill={GOLD} cx="7" cy="8.6" r="3.3" />
    <path fill={GOLD} d="M1 21.6c0-3.6 2.6-6 6-6 1.2 0 2.3.3 3.2.9C8.6 17.8 7.6 19.6 7.4 21.6z" />
    <circle fill={GOLD} cx="25" cy="8.6" r="3.3" />
    <path fill={GOLD} d="M31 21.6c0-3.6-2.6-6-6-6-1.2 0-2.3.3-3.2.9 1.6 1.3 2.6 3.1 2.8 5.1z" />
  </svg>
);

const MosqueIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path fill={GOLD} d="M12.6 1a1.4 1.4 0 1 0 .4 2.5 1.15 1.15 0 1 1-.4-2.5z" />
    <rect fill={GOLD} x="11.6" y="3.4" width=".8" height="1.6" />
    <path fill={GOLD} d="M6 11c0-3.2 2.8-5 6-6.2 3.2 1.2 6 3 6 6.2z" />
    <path
      fill={GOLD}
      fillRule="evenodd"
      d="M5 11.6h14V21H5zM10.4 21v-3.2a1.6 1.6 0 0 1 3.2 0V21zM7 14.6a.9.9 0 0 1 1.8 0V17H7zM15.2 14.6a.9.9 0 0 1 1.8 0V17h-1.8z"
    />
    <path fill={GOLD} d="M2.2 21v-9.4l.9-2.4.9 2.4V21zM20 21v-9.4l.9-2.4.9 2.4V21z" />
    <rect fill={GOLD} x="1.4" y="21" width="21.2" height="1.4" rx=".5" />
  </svg>
);

const AccountIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <circle cx="12" cy="12" r="10.4" fill="none" stroke={GOLD} strokeWidth="1.5" />
    <circle cx="12" cy="9.3" r="3.3" fill="none" stroke={GOLD} strokeWidth="1.6" />
    <path d="M5.9 18.6c1-2.8 3.3-4.3 6.1-4.3s5.1 1.5 6.1 4.3" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const SignInIcon: React.FC<IconProps> = ({ className }) => <LogIn className={className} color="#d9b46a" strokeWidth={2.2} />;

/** Mosque skylines (dark bronze silhouettes) for the side parts of the bar. */
const SKYLINE =
  'M0 96V80h8v-6q5-8 10 0v6h6V58l2.5-6 2.5 6v22h8v-10q12-22 24 0v10h6V64l2-5 2 5v16h6v-8q8-14 16 0v8h6V50l3-8 3 8v30h10V68q10-18 20 0v12h6V60l2-5 2 5v20h8v-6q5-9 10 0v6h6v16z';
const CURVE = 'M318 118 C366 118 372 26 430 16 C462 8 538 8 570 16 C628 26 634 118 682 118';

/**
 * Phone bottom bar, as in the reference design: one dark pill whose sides warm into bronze-gold with mosque
 * skylines, a green centre framed by two glowing golden curves (the community), and filled golden icons.
 * The active tab glows brighter (smooth gold transition).
 */
export const MobileNav: React.FC<MobileNavProps> = ({
  currentView,
  role,
  unreadCount,
  onHome,
  onImams,
  onMosques,
  onCommunity,
  onAccount,
  onSignIn,
  accountActive = false,
  communityUnread = 0,
}) => {
  const isVisitor = role === 'visitor';
  const communityOn = currentView === 'community';

  const tab = (key: string, label: string, Icon: React.FC<IconProps>, active: boolean, onClick: () => void, badge?: number) => (
    <button
      key={key}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`gold-tab relative flex-1 flex flex-col items-center justify-center gap-0.5 pt-1 cursor-pointer ${active ? 'is-active' : ''}`}
    >
      <span className="gold-tab__glow" aria-hidden />
      <Icon className="relative w-[25px] h-[25px]" />
      <span className="gold-tab__label relative text-[11.5px] font-black leading-tight">{label}</span>
      {!!badge && (
        <span className="absolute top-0.5 left-1/2 ml-2.5 bg-red-600 text-white text-[10px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center">{badge}</span>
      )}
    </button>
  );

  return (
    <nav aria-label="التنقل الرئيسي" className="mobile-nav lg:hidden fixed bottom-0 inset-x-0 z-40">
      <div className="relative mx-2 mb-2 h-[4.25rem]">
        {/* The whole bar is one drawing, stretched to the width (its proportions match the design). */}
        <svg className="gold-bar absolute -top-[13px] inset-x-0 w-full h-[calc(100%+13px)]" viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="nav-gold-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f6dfa0" />
              <stop offset="0.5" stopColor="#d9b46a" />
              <stop offset="1" stopColor="#a8803f" />
            </linearGradient>
            {/* sides: near black at the ends, warming to bronze-gold towards the centre */}
            <linearGradient id="nav-side" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#050304" />
              <stop offset="0.16" stopColor="#0b0807" />
              <stop offset="0.3" stopColor="#3a2b1b" />
              <stop offset="0.4" stopColor="#8a6a3e" />
              <stop offset="0.44" stopColor="#a8854f" />
              <stop offset="0.56" stopColor="#a8854f" />
              <stop offset="0.6" stopColor="#8a6a3e" />
              <stop offset="0.7" stopColor="#3a2b1b" />
              <stop offset="0.84" stopColor="#0b0807" />
              <stop offset="1" stopColor="#050304" />
            </linearGradient>
            <linearGradient id="nav-shade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity="0.45" />
            </linearGradient>
            <linearGradient id="nav-green" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2b6f58" />
              <stop offset="0.5" stopColor="#1d5443" />
              <stop offset="1" stopColor="#123b2f" />
            </linearGradient>
            <linearGradient id="nav-edge" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#c99a4e" />
              <stop offset="0.5" stopColor="#fff0c2" />
              <stop offset="1" stopColor="#c99a4e" />
            </linearGradient>
            <linearGradient id="nav-sky-l" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#140d07" stopOpacity="0.15" />
              <stop offset="0.45" stopColor="#140d07" stopOpacity="0.85" />
              <stop offset="1" stopColor="#140d07" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id="nav-sky-r" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0" stopColor="#140d07" stopOpacity="0.15" />
              <stop offset="0.45" stopColor="#140d07" stopOpacity="0.85" />
              <stop offset="1" stopColor="#140d07" stopOpacity="0.55" />
            </linearGradient>
            <filter id="nav-glow" x="-20%" y="-60%" width="140%" height="220%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
            <clipPath id="nav-pill">
              <rect x="0" y="14" width="1000" height="104" rx="52" />
            </clipPath>
          </defs>

          {/* the pill */}
          <g clipPath="url(#nav-pill)">
            <rect x="0" y="14" width="1000" height="104" fill="url(#nav-side)" />
            <path d={SKYLINE} transform="translate(178 4) scale(1.22 1.18)" fill="url(#nav-sky-l)" />
            <path d={SKYLINE} transform="translate(822 4) scale(-1.22 1.18)" fill="url(#nav-sky-r)" />
            <rect x="0" y="14" width="1000" height="104" fill="url(#nav-shade)" />
          </g>
          <rect x="0.8" y="14.8" width="998.4" height="102.4" rx="51.2" fill="none" stroke="#d6ae5c" strokeOpacity="0.28" strokeWidth="1.2" />

          {/* green centre: narrow at the top (rising above the bar), wide at the bottom, golden S-curves */}
          <path d={`${CURVE} Z`} fill="url(#nav-green)" />
          <path d={CURVE} fill="none" stroke="url(#nav-edge)" strokeWidth="5" opacity="0.55" filter="url(#nav-glow)" />
          <path d={CURVE} fill="none" stroke="url(#nav-edge)" strokeWidth="2.2" />
        </svg>

        <div className="relative h-full flex items-stretch px-2">
          {tab('home', 'الرئيسية', HomeIcon, currentView === 'home', onHome)}
          {tab('imams', 'الأئمة', ImamIcon, currentView === 'mosque' && !accountActive, onImams)}
          <div className="w-[34%] shrink-0 flex justify-center">
            <button
              onClick={onCommunity}
              aria-label={communityUnread ? `ملتقى الأئمة (${communityUnread} إشعار جديد)` : 'ملتقى الأئمة'}
              aria-current={communityOn ? 'page' : undefined}
              className={`gold-tab gold-tab--centre relative -mt-2.5 flex flex-col items-center justify-center gap-0.5 px-3 cursor-pointer ${communityOn ? 'is-active' : ''}`}
            >
              <span className="gold-tab__glow" aria-hidden />
              <CommunityIcon className="relative w-[42px] h-[30px]" />
              <span className="gold-tab__label relative text-[14px] font-black leading-tight">الملتقى</span>
              {communityUnread > 0 && (
                <span className="absolute top-0 -right-0.5 bg-red-600 text-white text-[11px] font-black min-w-5 h-5 px-1 rounded-full flex items-center justify-center ring-2 ring-[#1d5443]">
                  {communityUnread}
                </span>
              )}
            </button>
          </div>
          {tab('mosques', 'المساجد', MosqueIcon, currentView === 'imam' && !accountActive, onMosques)}
          {isVisitor ? tab('signin', 'دخول', SignInIcon, false, onSignIn) : tab('account', 'حسابي', AccountIcon, accountActive, onAccount, unreadCount)}
        </div>
      </div>
    </nav>
  );
};
