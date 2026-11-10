import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '../types';
import type { View } from '../App';
import { DEFAULT_IMAM_SILHOUETTE_AVATAR, getSafeImamAvatar } from '../utils/helpers';
import { LogoMark } from './Logo';
import {
  Building2,
  MessagesSquare,
  Menu,
  X,
  ShieldCheck,
  LogIn,
  LogOut,
  User as UserIcon,
  Edit3,
  Mail,
  ChevronDown,
  Trash2,
  Settings as SettingsIcon,
} from 'lucide-react';

interface NavbarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  currentRole: UserRole;
  userName: string;
  userEmail: string;
  userPhoto?: string;
  authReady: boolean;
  onOpenAuthModal: () => void;
  onOpenMyProfile: () => void;
  onEditMyProfile: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  imamsCount: number;
  mosquesCount: number;
  pendingCount: number;
  unreadCount?: number;
  /** Hide the statistics link until there is enough data to show. */
  showStats?: boolean;
  onOpenInbox?: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  currentRole,
  userName,
  userEmail,
  userPhoto,
  authReady,
  onOpenAuthModal,
  onOpenMyProfile,
  onEditMyProfile,
  onLogout,
  onDeleteAccount,
  imamsCount,
  mosquesCount,
  pendingCount,
  unreadCount = 0,
  showStats = true,
  onOpenInbox,
  onOpenSettings,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = currentRole !== 'visitor';

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayUserName = userName;
  const displayEmail = userEmail;

  const roleBadgeText =
    currentRole === 'admin'
      ? 'مدير المنصة'
      : currentRole === 'imam'
      ? 'حساب إمام'
      : currentRole === 'mosque'
      ? 'حساب مسجد/جمعية'
      : 'زائر';

  const avatarUrl =
    currentRole === 'imam'
      ? getSafeImamAvatar(userPhoto)
      : userPhoto && /^https:\/\//.test(userPhoto)
      ? userPhoto
      : DEFAULT_IMAM_SILHOUETTE_AVATAR;
  const showMosqueIcon = currentRole === 'mosque' && !userPhoto;

  return (
    <header className="bg-night text-white border-b border-white/10 sticky top-0 z-40 shadow-lg shadow-black/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-6">
          
          {/* Zone 1: Single Clean Brand Wordmark */}
          <button
            onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}
            className="flex items-center gap-2.5 text-right cursor-pointer whitespace-nowrap shrink-0 focus:outline-none"
          >
            <LogoMark className="w-10 h-10 shadow-xs rounded-xl" />
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-amiri">
              منصة أئمة
            </span>
          </button>

          {/* Zone 2: Clean Single-Line Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-bold text-slate-300">
            <button
              onClick={() => setCurrentView('home')}
              className={`py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 border-b-2 ${
                currentView === 'home'
                  ? 'border-amber-400 text-white font-black'
                  : 'border-transparent hover:text-white'
              }`}
            >
              الرئيسية
            </button>

            <button
              onClick={() => setCurrentView('mosque')}
              className={`py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 border-b-2 ${
                currentView === 'mosque'
                  ? 'border-amber-400 text-white font-black'
                  : 'border-transparent hover:text-white'
              }`}
            >
              الأئمة المتاحون
            </button>

            <button
              onClick={() => setCurrentView('imam')}
              className={`py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 border-b-2 ${
                currentView === 'imam'
                  ? 'border-amber-400 text-white font-black'
                  : 'border-transparent hover:text-white'
              }`}
            >
              إعلانات المساجد
            </button>

            <button
              onClick={() => setCurrentView('community')}
              className={`py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 border-b-2 inline-flex items-center gap-1.5 ${
                currentView === 'community'
                  ? 'border-amber-400 text-white font-black'
                  : 'border-transparent hover:text-white'
              }`}
            >
              <MessagesSquare className="w-4 h-4 text-amber-300" />
              المجتمع
            </button>

            {showStats && (
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 border-b-2 ${
                currentView === 'dashboard'
                  ? 'border-amber-400 text-white font-black'
                  : 'border-transparent hover:text-white'
              }`}
            >
              الإحصائيات
            </button>
            )}

            {currentRole === 'admin' && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 border-b-2 flex items-center gap-1.5 ${
                  currentView === 'admin'
                    ? 'border-amber-400 text-amber-300 font-black'
                    : 'border-transparent text-amber-400 hover:text-amber-300'
                }`}
              >
                <span>لوحة الإدارة</span>
                {pendingCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 text-xs font-black px-1.5 py-0.2 rounded-full tabular-nums">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Zone 3: User Account Avatar & Profile Menu (like Google / Facebook / Gemini) OR Login Button */}
          <div className="flex items-center gap-3 shrink-0" ref={dropdownRef}>
            
            {isLoggedIn ? (
              <div className="relative">
                {/* Account Pill Button (Avatar + Name + Role like Google/Facebook) */}
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/15 rounded-full py-1.5 pl-3 pr-1.5 transition cursor-pointer focus:outline-none"
                >
                  <div className="relative">
                    {showMosqueIcon ? (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-blue-700 text-white flex items-center justify-center shadow-xs">
                        <Building2 className="w-5 h-5" />
                      </div>
                    ) : (
                      <img
                        src={avatarUrl}
                        alt={displayUserName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-emerald-600/50 shadow-xs"
                      />
                    )}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-black w-4 h-4 rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="text-right hidden md:block max-w-[150px]">
                    <p className="text-xs font-black text-white truncate leading-tight">
                      {displayUserName}
                    </p>
                    <p className="text-xs font-bold text-amber-300 truncate">
                      {roleBadgeText}
                    </p>
                  </div>

                  <ChevronDown className="w-4 h-4 text-slate-300" />
                </button>

                {/* Google / Gemini / Facebook Style Profile Popover Menu */}
                {profileMenuOpen && (
                  <div className="absolute left-0 mt-2.5 w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 z-50 text-xs space-y-4">
                    
                    {/* Top Account Card Info */}
                    <div className="flex flex-col items-center text-center space-y-2 pb-4 border-b border-slate-100">
                      <div className="relative">
                        {showMosqueIcon ? (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-blue-700 text-white flex items-center justify-center shadow-md">
                            <Building2 className="w-8 h-8" />
                          </div>
                        ) : (
                          <img
                            src={avatarUrl}
                            alt={displayUserName}
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 rounded-full object-cover border-2 border-emerald-600 shadow-md"
                          />
                        )}
                      </div>

                      <div>
                        <h4 className="text-base font-black text-slate-900 font-amiri">
                          {displayUserName}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium" dir="ltr">
                          {displayEmail}
                        </p>
                        <span className="inline-block mt-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-0.5 rounded-full">
                          {roleBadgeText}
                        </span>
                      </div>
                    </div>

                    {/* Account Direct Actions */}
                    <div className="space-y-1.5">
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          onOpenMyProfile();
                        }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-100 text-slate-800 font-bold transition cursor-pointer text-right"
                      >
                        <UserIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>ملفي الشخصي وإدارة حسابي</span>
                      </button>

                      {currentRole !== 'admin' && (
                        <button
                          onClick={() => {
                            setProfileMenuOpen(false);
                            onEditMyProfile();
                          }}
                          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-100 text-slate-800 font-bold transition cursor-pointer text-right"
                        >
                          <Edit3 className="w-4 h-4 text-sky-700 shrink-0" />
                          <span>تعديل بيانات ملفي ومعلوماتي</span>
                        </button>
                      )}

                      {onOpenInbox && (
                        <button
                          onClick={() => {
                            setProfileMenuOpen(false);
                            onOpenInbox();
                          }}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-slate-100 text-slate-800 font-bold transition cursor-pointer text-right"
                        >
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>علبة الرسائل والمراسلات</span>
                          </div>
                          {unreadCount > 0 && (
                            <span className="bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded-full">
                              {unreadCount} جديد
                            </span>
                          )}
                        </button>
                      )}

                      {currentRole === 'admin' && (
                        <button
                          onClick={() => {
                            setProfileMenuOpen(false);
                            setCurrentView('admin');
                          }}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-black transition cursor-pointer text-right"
                        >
                          <div className="flex items-center gap-3">
                            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>لوحة الإدارة والطلبات المعلقة</span>
                          </div>
                          {pendingCount > 0 && (
                            <span className="bg-amber-500 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full">
                              {pendingCount}
                            </span>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Logout & account deletion */}
                    <div className="pt-3 border-t border-slate-100 space-y-1.5">
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-black transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>تسجيل الخروج من الحساب</span>
                      </button>
                      {currentRole !== 'admin' && (
                        <button
                          onClick={() => {
                            setProfileMenuOpen(false);
                            onDeleteAccount();
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-slate-500 hover:text-red-700 hover:bg-red-50 font-bold transition cursor-pointer text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف حسابي وبياناتي نهائياً</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : !authReady ? (
              <div className="w-24 h-9 rounded-xl bg-slate-100 animate-pulse" aria-hidden="true" />
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-full shadow-xs transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogIn className="w-4 h-4" />
                <span>تسجيل الدخول</span>
              </button>
            )}

            {/* Settings (on phones it is inside the menu) */}
            <button
              onClick={onOpenSettings}
              className="hidden lg:flex w-10 h-10 items-center justify-center rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              aria-label="الإعدادات"
              title="الإعدادات"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-white hover:bg-white/10 focus:outline-none cursor-pointer"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile & Tablet Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-6 space-y-4 shadow-lg">
          
          <div className="space-y-1.5 text-sm font-bold">
            <button
              onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}
              className={`w-full text-right px-4 py-3 rounded-xl ${
                currentView === 'home' ? 'bg-emerald-50 text-emerald-900 font-black' : 'text-slate-700'
              }`}
            >
              الصفحة الرئيسية
            </button>

            <button
              onClick={() => { setCurrentView('mosque'); setMobileMenuOpen(false); }}
              className={`w-full text-right px-4 py-3 rounded-xl flex justify-between items-center ${
                currentView === 'mosque' ? 'bg-emerald-50 text-emerald-900 font-black' : 'text-slate-700'
              }`}
            >
              <span>قائمة الأئمة المتوفرين</span>
              {imamsCount > 0 && <span className="text-xs text-emerald-700 font-bold">{imamsCount}</span>}
            </button>

            <button
              onClick={() => { setCurrentView('imam'); setMobileMenuOpen(false); }}
              className={`w-full text-right px-4 py-3 rounded-xl flex justify-between items-center ${
                currentView === 'imam' ? 'bg-sky-50 text-sky-900 font-black' : 'text-slate-700'
              }`}
            >
              <span>قائمة المساجد والجمعيات المتوفرة</span>
              {mosquesCount > 0 && <span className="text-xs text-sky-700 font-bold">{mosquesCount}</span>}
            </button>

            <button
              onClick={() => { setCurrentView('community'); setMobileMenuOpen(false); }}
              className={`w-full text-right px-4 py-3 rounded-xl flex items-center gap-2 ${
                currentView === 'community' ? 'bg-emerald-50 text-emerald-900 font-black' : 'text-slate-700'
              }`}
            >
              <MessagesSquare className="w-4 h-4" />
              <span>المجتمع — ملتقى الأئمة</span>
            </button>

            {showStats && (
            <button
              onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full text-right px-4 py-3 rounded-xl ${
                currentView === 'dashboard' ? 'bg-slate-100 text-slate-900 font-black' : 'text-slate-700'
              }`}
            >
              لوحة الإحصائيات
            </button>
            )}

            {currentRole === 'admin' && (
              <button
                onClick={() => { setCurrentView('admin'); setMobileMenuOpen(false); }}
                className="w-full text-right px-4 py-3 rounded-xl bg-amber-50 text-amber-950 font-black flex justify-between items-center"
              >
                <span>لوحة الإدارة (المدير)</span>
                {pendingCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 text-xs px-2 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => { onOpenSettings(); setMobileMenuOpen(false); }}
              className="w-full text-right px-4 py-3 rounded-xl flex items-center gap-2 text-slate-700 border-t border-slate-100 mt-2 pt-4"
            >
              <SettingsIcon className="w-4 h-4" />
              <span>الإعدادات</span>
              <span className="mr-auto text-xs font-bold text-slate-400">المظهر، حجم الخط…</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
