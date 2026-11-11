import React from 'react';
import { Building2, Home, LogIn, User, Users } from 'lucide-react';
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

/** Eight-pointed star (khatam) used on the raised centre button. */
const Khatam: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <g fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
      <path d="M12 2.5l2.8 2.7h3.9v3.9l2.8 2.9-2.8 2.8v3.9h-3.9L12 21.5l-2.8-2.8H5.3v-3.9L2.5 12l2.8-2.9V5.2h3.9z" />
    </g>
    <path d="M9 10.2c0-.7.6-1.2 1.2-1.2h3.6c.7 0 1.2.5 1.2 1.2v2.4c0 .7-.5 1.2-1.2 1.2h-2.3l-1.6 1.3v-1.3h-.1c-.4 0-.8-.5-.8-1.2z" fill="currentColor" />
  </svg>
);

/** App-style bottom bar for phones (hidden on large screens): four tabs and a raised centre button for the community. */
export const MobileNav: React.FC<MobileNavProps> = ({ currentView, role, unreadCount, onHome, onImams, onMosques, onCommunity, onAccount, onSignIn, accountActive = false, communityUnread = 0 }) => {
  const isVisitor = role === 'visitor';
  const side = (items: { key: string; label: string; icon: React.ElementType; active: boolean; onClick: () => void; badge?: number }[]) =>
    items.map(({ key, label, icon: Icon, active, onClick, badge }) => (
      <button
        key={key}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-black transition cursor-pointer ${active ? 'text-brass-300' : 'text-slate-400 hover:text-white'}`}
      >
        <Icon className={`w-[22px] h-[22px] transition-transform ${active ? 'scale-110' : ''}`} />
        <span>{label}</span>
        {active && <span className="absolute top-0 h-0.5 w-6 rounded-full bg-brass-400" aria-hidden />}
        {!!badge && (
          <span className="absolute top-1 left-1/2 ml-2 bg-red-600 text-white text-[10px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center">{badge}</span>
        )}
      </button>
    ));

  const bar = (
    <nav aria-label="التنقل الرئيسي" className="mobile-nav lg:hidden fixed bottom-0 inset-x-0 z-40">
      <div className="relative mx-2 mb-2 rounded-[1.75rem] liquid-glass-dark flex items-stretch px-1">
        {side([
          { key: 'home', label: 'الرئيسية', icon: Home, active: currentView === 'home', onClick: onHome },
          { key: 'imams', label: 'الأئمة', icon: Users, active: currentView === 'mosque' && !accountActive, onClick: onImams },
        ])}
        <div className="w-[4.75rem] shrink-0 flex flex-col items-center">
          <button
            onClick={onCommunity}
            aria-label={communityUnread ? `ملتقى الأئمة (${communityUnread} إشعار جديد)` : 'ملتقى الأئمة'}
            aria-current={currentView === 'community' ? 'page' : undefined}
            className={`relative -mt-6 w-16 h-16 rounded-full p-[3px] bg-gradient-to-br from-brass-200 via-brass-500 to-brass-700 shadow-lg shadow-black/40 cursor-pointer transition active:scale-95 ${currentView === 'community' ? 'ring-4 ring-brass-300/30' : ''}`}
          >
            <span className="w-full h-full rounded-full bg-gradient-to-br from-cedar-600 to-cedar-900 text-brass-100 flex items-center justify-center">
              <Khatam className="w-9 h-9" />
            </span>
            {communityUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[11px] font-black min-w-5 h-5 px-1 rounded-full flex items-center justify-center ring-2 ring-ink">
                {communityUnread}
              </span>
            )}
          </button>
          <span className={`text-[11px] font-black mt-0.5 ${currentView === 'community' ? 'text-brass-300' : 'text-slate-400'}`} aria-hidden>
            الملتقى
          </span>
        </div>
        {side([
          { key: 'mosques', label: 'المساجد', icon: Building2, active: currentView === 'imam' && !accountActive, onClick: onMosques },
          isVisitor
            ? { key: 'signin', label: 'دخول', icon: LogIn, active: false, onClick: onSignIn }
            : { key: 'account', label: 'حسابي', icon: User, active: !isVisitor && accountActive, onClick: onAccount, badge: unreadCount },
        ])}
      </div>
    </nav>
  );
  // Stays inside #root (same layer as the dialogs, which open above it). On phones only #root scrolls,
  // so the browser toolbar never moves and the fixed bar stays glued to the bottom (see index.css).
  return bar;
};
