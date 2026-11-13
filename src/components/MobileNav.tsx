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

/* ---------- Filled icons (colour = currentColor: green, gold when active) ---------- */
type IconProps = { className?: string };
const GOLD = 'currentColor';

const HomeIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path fill={GOLD} d="M12 2.6 1.6 11.3l1.5 1.8L12 5.7l8.9 7.4 1.5-1.8z" />
    <path fill={GOLD} fillRule="evenodd" d="M4.6 12.6 12 6.6l7.4 6V21H4.6zM10 21v-5.2a2 2 0 0 1 4 0V21z" />
  </svg>
);

/** Imam (as in the reference design): tall cap with a small arch, face and beard, V-neck collar.
 *  The thin light lines use the colour of the bar (--nav-cut), so they read as cut-outs. */
const ImamIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    {/* cap with a small arch */}
    <path fill={GOLD} fillRule="evenodd" d="M7.2 7.4V4.7C7.2 3.1 8.7 2.1 12 2.1s4.8 1 4.8 2.6v2.7zM10.6 5.9Q12 3.9 13.4 5.9Q12 5.1 10.6 5.9z" />
    {/* head with beard */}
    <path fill={GOLD} d="M7.3 7.9h9.4v3.3c0 2.8-2.1 4.6-4.7 4.6s-4.7-1.8-4.7-4.6z" />
    {/* face outline and beard line (cut-outs) */}
    <path fill="none" stroke="var(--nav-cut, #f4ece3)" strokeWidth=".7" strokeLinecap="round" d="M8.6 8.2v2.5c0 1.1.7 1.7 1.6 1.7.8 0 1.1-.4 1.8-.4s1 .4 1.8.4c.9 0 1.6-.6 1.6-1.7V8.2" />
    <path fill="none" stroke="var(--nav-cut, #f4ece3)" strokeWidth=".6" strokeLinecap="round" d="M9.6 13.5c.7.5 1.5.8 2.4.8s1.7-.3 2.4-.8" />
    {/* shoulders */}
    <path fill={GOLD} d="M2.9 22.2c0-2 .4-3.5 1.6-4.6 1.7-1.5 4.2-1.9 7.5-1.9s5.8.4 7.5 1.9c1.2 1.1 1.6 2.6 1.6 4.6z" />
    {/* shirt and V-neck collar (cut-outs) */}
    <path fill="var(--nav-cut, #f4ece3)" d="M10.3 15.8 12 18.7l1.7-2.9z" />
    <path fill="none" stroke="var(--nav-cut, #f4ece3)" strokeWidth=".6" strokeLinecap="round" d="M9.8 16.1l2.2 5.4 2.2-5.4" />
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

const SignInIcon: React.FC<IconProps> = ({ className }) => <LogIn className={className} strokeWidth={2.4} />;

/** Faint beige mosque skyline (decoration of the light bar). */
const Skyline: React.FC<{ className?: string; flip?: boolean }> = ({ className, flip }) => (
  <svg viewBox="0 0 200 50" preserveAspectRatio="xMidYMax meet" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden>
    <path
      fill="currentColor"
      d="M0 50V40h8v-4q4-7 8 0v4h6V22l2-5 2 5v18h8v-7q10-17 20 0v7h6V27l2-4 2 4v13h6v-5q6-10 12 0v5h6V18l3-7 3 7v22h8V31q8-14 16 0v9h6V26l2-4 2 4v14h8v-4q4-7 8 0v4h6v10z"
    />
  </svg>
);

/**
 * Phone bottom bar (reference design): a slim ivory pill with faint mosque skylines and a thin golden
 * line, green tabs, and a round green «الملتقى» button in an ivory and gold ring above a green band.
 * The active tab turns gold (smooth transition).
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
      className={`ivory-tab relative flex-1 flex flex-col items-center justify-center gap-0.5 cursor-pointer ${active ? 'is-active' : ''}`}
    >
      <Icon className="relative w-[24px] h-[24px]" />
      <span className="relative text-[11px] font-black leading-tight">{label}</span>
      {!!badge && (
        <span className="absolute top-1 left-1/2 ml-2 bg-red-600 text-white text-[10px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center">{badge}</span>
      )}
    </button>
  );
  const divider = (k: string) => <span key={k} className="w-px self-center h-7 bg-[#d8cbbb]" aria-hidden />;

  return (
    <nav aria-label="التنقل الرئيسي" className="mobile-nav lg:hidden fixed bottom-0 inset-x-0 z-40">
      <div className="relative mx-3 mb-2.5 h-14">
        {/* the ivory pill */}
        <div className="ivory-bar absolute inset-0 rounded-full overflow-hidden">
          <Skyline className="absolute bottom-0 right-2 h-[62%] w-[26%] text-[#cdbfae]/55" />
          <Skyline className="absolute bottom-0 left-2 h-[62%] w-[26%] text-[#cdbfae]/55" flip />
          <Skyline className="absolute bottom-0 right-[33%] h-[46%] w-[12%] text-[#cdbfae]/45" flip />
          <Skyline className="absolute bottom-0 left-[33%] h-[46%] w-[12%] text-[#cdbfae]/45" />
          {/* green band under the centre, with a golden edge */}
          <svg className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[64%] h-[34%]" viewBox="0 0 400 20" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="ivory-band" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#1f6a50" />
                <stop offset="1" stopColor="#0d3f30" />
              </linearGradient>
              <linearGradient id="ivory-edge" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#c9a24e" stopOpacity="0" />
                <stop offset="0.3" stopColor="#d6ae5c" />
                <stop offset="0.5" stopColor="#f3d998" />
                <stop offset="0.7" stopColor="#d6ae5c" />
                <stop offset="1" stopColor="#c9a24e" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 20 C90 19 150 6 200 4 C250 6 310 19 400 20 Z" fill="url(#ivory-band)" />
            <path d="M0 20 C90 19 150 6 200 4 C250 6 310 19 400 20" fill="none" stroke="url(#ivory-edge)" strokeWidth="1.6" />
          </svg>
          {/* thin golden line along the bottom */}
          <span className="absolute bottom-0 inset-x-6 h-[2px] bg-gradient-to-l from-transparent via-[#c9a24e] to-transparent" aria-hidden />
        </div>

        <div className="relative h-full flex items-stretch px-3">
          {tab('home', 'الرئيسية', HomeIcon, currentView === 'home', onHome)}
          {divider('d1')}
          {tab('imams', 'الأئمة', ImamIcon, currentView === 'mosque' && !accountActive, onImams)}
          <div className="w-[84px] shrink-0" aria-hidden />
          {tab('mosques', 'المساجد', MosqueIcon, currentView === 'imam' && !accountActive, onMosques)}
          {divider('d2')}
          {isVisitor ? tab('signin', 'دخول', SignInIcon, false, onSignIn) : tab('account', 'حسابي', AccountIcon, accountActive, onAccount, unreadCount)}
        </div>

        {/* round «الملتقى» button: ivory ring, thin gold ring, green inside */}
        <button
          onClick={onCommunity}
          aria-label={communityUnread ? `ملتقى الأئمة (${communityUnread} إشعار جديد)` : 'ملتقى الأئمة'}
          aria-current={communityOn ? 'page' : undefined}
          className={`ivory-centre absolute left-1/2 -translate-x-1/2 -top-[11px] w-[74px] h-[74px] rounded-full p-[5px] cursor-pointer ${communityOn ? 'is-active' : ''}`}
        >
          <span className="ivory-centre__gold block w-full h-full rounded-full p-[1.5px]">
            <span className="ivory-centre__green w-full h-full rounded-full flex flex-col items-center justify-center gap-0">
              <CommunityIcon className="w-[28px] h-[20px]" />
              <span className="text-[10.5px] font-black leading-tight mt-0.5">الملتقى</span>
            </span>
          </span>
          {communityUnread > 0 && (
            <span className="absolute top-0 right-0 bg-red-600 text-white text-[11px] font-black min-w-5 h-5 px-1 rounded-full flex items-center justify-center ring-2 ring-[#fbf6f0]">
              {communityUnread}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};
