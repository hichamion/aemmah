import React from 'react';
import { Building2, Home, LogIn, MessagesSquare, User, Users } from 'lucide-react';
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
}

/** App-style bottom navigation for phones (hidden on large screens, where the top bar has the links). */
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
}) => {
  const isVisitor = role === 'visitor';
  const accountActive = !isVisitor && ['admin'].includes(currentView);
  const items = [
    { key: 'home', label: 'الرئيسية', icon: Home, active: currentView === 'home', onClick: onHome },
    { key: 'imams', label: 'الأئمة', icon: Users, active: currentView === 'mosque', onClick: onImams },
    { key: 'mosques', label: 'المساجد', icon: Building2, active: currentView === 'imam', onClick: onMosques },
    { key: 'community', label: 'المجتمع', icon: MessagesSquare, active: currentView === 'community', onClick: onCommunity },
    isVisitor
      ? { key: 'signin', label: 'دخول', icon: LogIn, active: false, onClick: onSignIn }
      : { key: 'account', label: 'حسابي', icon: User, active: accountActive, onClick: onAccount },
  ];

  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="lg:hidden fixed bottom-3 inset-x-3 z-40 glass-light rounded-full px-2 py-1.5 flex items-center justify-between"
    >
      {items.map(({ key, label, icon: Icon, active, onClick }) => (
        <button
          key={key}
          onClick={onClick}
          aria-current={active ? 'page' : undefined}
          className={`relative flex items-center gap-1.5 rounded-full transition cursor-pointer text-xs font-black ${
            active ? 'bg-night text-white px-4 py-2.5 shadow-md' : 'text-slate-500 hover:text-slate-900 px-3 py-2.5'
          }`}
        >
          <Icon className="w-5 h-5" />
          <span className={active ? '' : 'sr-only'}>{label}</span>
          {key === 'account' && unreadCount > 0 && (
            <span className="absolute -top-0.5 right-1 bg-red-600 text-white text-[10px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
};
