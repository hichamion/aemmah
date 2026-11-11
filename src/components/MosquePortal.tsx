import React, { useEffect, useState } from 'react';
import { ImamProfile, MosqueJob, Application, UserRole, ApplicationStatus } from '../types';
import { formatDate, getSafeImamAvatar } from '../utils/helpers';
import { PageBanner, bannerTab } from './PageBanner';
import { InboxCenter, InboxProps } from './InboxCenter';
import { ContactBlock } from './ContactBlock';
import { ImamMiniCard } from './MiniCards';
import { Search, Trash2, Plus, UserCheck, Lock, Clock, ShieldAlert, Users } from 'lucide-react';

type Tab = 'browse' | 'manage_mosques' | 'applications' | 'inbox';

interface MosquePortalProps {
  currentRole: UserRole;
  isVerifiedMosque: boolean;
  canSeeImamContacts: boolean;
  imams: ImamProfile[];
  myMosques: MosqueJob[];
  applications: Application[];
  onOpenAuthModal: () => void;
  onOpenMosqueAdd: () => void;
  onOpenImamAdd: () => void;
  onEditMosque: (mosque: MosqueJob) => void;
  onDeleteMosque: (mosque: MosqueJob) => void;
  onToggleMosqueActive: (mosque: MosqueJob) => void;
  onViewImamFull: (imam: ImamProfile) => void;
  onScheduleInterview: (app: Application) => void;
  onSetApplicationStatus: (app: Application, status: ApplicationStatus) => void;
  onReportImam: (imam: ImamProfile) => void;
  inbox: InboxProps;
  initialTab?: Tab;
  /** Reports the open tab (used by the phone bottom bar). */
  onTabChange?: (tab: Tab) => void;
  /** Changes on every tab request from the parent (see App). */
  tabRequest?: number;
}

const APPROVAL_LABEL: Record<MosqueJob['approvalStatus'], { text: string; cls: string }> = {
  pending: { text: '⏳ بانتظار موافقة الإدارة', cls: 'bg-amber-100 text-amber-900' },
  approved: { text: '✅ معتمد ومنشور', cls: 'bg-emerald-100 text-emerald-900' },
  rejected: { text: '✖ مرفوض', cls: 'bg-red-100 text-red-900' },
};

const APP_STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: 'جديد',
  accepted: 'مقبول',
  interview_scheduled: 'تم طلب التواصل',
  declined: 'غير مقبول',
};

export const MosquePortal: React.FC<MosquePortalProps> = ({
  currentRole,
  isVerifiedMosque,
  canSeeImamContacts,
  imams,
  myMosques,
  applications,
  onOpenAuthModal,
  onOpenMosqueAdd,
  onOpenImamAdd,
  onEditMosque,
  onDeleteMosque,
  onToggleMosqueActive,
  onViewImamFull,
  onScheduleInterview,
  onSetApplicationStatus,
  onReportImam,
  inbox,
  initialTab = 'browse',
  onTabChange,
  tabRequest = 0,
}) => {
  const isMosque = currentRole === 'mosque';
  const [activeTab, setActiveTab] = useState<Tab>(isMosque ? initialTab : 'browse');

  useEffect(() => {
    setActiveTab(isMosque ? initialTab : 'browse');
  }, [initialTab, tabRequest, isMosque]);
  useEffect(() => {
    onTabChange?.(activeTab);
  }, [activeTab, onTabChange]);

  const [searchTerm, setSearchTerm] = useState('');
  const [availFilter, setAvailFilter] = useState('all');
  const [visaFilter, setVisaFilter] = useState('all');
  const [riwayaFilter, setRiwayaFilter] = useState('all');

  // `imams` contains approved profiles only; hide paused ones.
  const availableImamsCount = imams.filter((imam) => imam.availabilityState !== 'paused').length;
  const visibleImams = imams.filter((imam) => {
    if (imam.availabilityState === 'paused') return false;
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      imam.name.toLowerCase().includes(q) ||
      imam.country.toLowerCase().includes(q) ||
      (imam.nationality || '').toLowerCase().includes(q) ||
      (imam.titles || []).some((t) => t.toLowerCase().includes(q)) ||
      (imam.preferredLocations || []).some((l) => `${l.country} ${l.area}`.toLowerCase().includes(q)) ||
      imam.degree.toLowerCase().includes(q) ||
      imam.languages.toLowerCase().includes(q);
    const matchesAvail = availFilter === 'all' || imam.availabilityState === availFilter;
    // Living in Europe counts as "no immigration procedure needed", like having a visa.
    const inEurope = imam.hasVisa === 'yes' || imam.livesInEurope ? 'yes' : 'no';
    const matchesVisa = visaFilter === 'all' || inEurope === visaFilter;
    const matchesRiwaya = riwayaFilter === 'all' || imam.riwaya.includes(riwayaFilter);
    return matchesSearch && matchesAvail && matchesVisa && matchesRiwaya;
  });

  const unreadForMe = inbox.messages.filter((m) => !m.isRead && m.receiverUid === inbox.currentUid).length;

  const tabClass = (tab: Tab) => bannerTab('imams', activeTab === tab);

  return (
    <section className="flex-1 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
      <PageBanner tone="imams" title="الأئمة المتاحون" count={availableImamsCount} subtitle="تصفح الأئمة والقرّاء المتاحين واستمع لتلاواتهم، أو سجّل كإمام جديد في المنصة" icon={<Users />}>
          {(currentRole === 'imam' || currentRole === 'visitor' || currentRole === 'admin') && (
            <button
              onClick={onOpenImamAdd}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm px-4 py-2.5 rounded-full shadow transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>{currentRole === 'admin' ? 'إضافة إمام' : 'التسجيل كإمام'}</span>
            </button>
          )}

          {isMosque && (
            <>
              <button onClick={() => setActiveTab('browse')} className={tabClass('browse')}>
                الأئمة المتاحون
              </button>
              <button onClick={() => setActiveTab('manage_mosques')} className={tabClass('manage_mosques')}>
                إعلاناتي ({myMosques.length})
              </button>
              <button onClick={() => setActiveTab('applications')} className={tabClass('applications')}>
                طلبات الترشيح ({applications.length})
              </button>
              <button onClick={() => setActiveTab('inbox')} className={`${tabClass('inbox')} flex items-center gap-1.5`}>
                <span>علبة الرسائل</span>
                {unreadForMe > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 rounded-full font-black">{unreadForMe}</span>
                )}
              </button>
            </>
          )}
      </PageBanner>

      {/* Privacy notices */}
      {currentRole === 'visitor' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap justify-between items-center gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>أرقام هواتف الأئمة وبريدهم تظهر فقط لحسابات المساجد الموثقة من الإدارة.</span>
          </div>
          <button
            onClick={onOpenAuthModal}
            className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer shrink-0 whitespace-nowrap"
          >
            تسجيل الدخول
          </button>
        </div>
      )}
      {isMosque && !isVerifiedMosque && (
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex items-start gap-2 text-xs text-amber-950">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            حسابك غير موثق بعد. ستظهر لك أرقام تواصل الأئمة بعد أن توافق الإدارة على أول إعلان لمسجدك. يمكنك في الأثناء
            مراسلة الأئمة عبر علبة الرسائل بعد اعتماد إعلانك.
          </span>
        </div>
      )}

      {/* TAB: BROWSE IMAMS */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="relative">
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث بالاسم أو الجنسية أو مكان الإقامة أو الصفة..."
                aria-label="بحث"
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 pr-9 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>

            <select
              value={availFilter}
              onChange={(e) => setAvailFilter(e.target.value)}
              aria-label="حالة التفرغ"
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold bg-white"
            >
              <option value="all">جميع حالات التفرغ</option>
              <option value="available_now">متاح فوراً (رمضان أو عقد دائم)</option>
              <option value="busy_ramadan">ملتزم في رمضان ومتاح بعده</option>
            </select>

            <select
              value={visaFilter}
              onChange={(e) => setVisaFilter(e.target.value)}
              aria-label="حالة التأشيرة"
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold bg-white"
            >
              <option value="all">جميع حالات التأشيرة</option>
              <option value="yes">مقيم في أوروبا أو لديه فيزا / إقامة</option>
              <option value="no">يحتاج إجراءات استقدام إلى أوروبا</option>
            </select>

            <select
              value={riwayaFilter}
              onChange={(e) => setRiwayaFilter(e.target.value)}
              aria-label="الرواية"
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold bg-white"
            >
              <option value="all">جميع الروايات القرآنية</option>
              <option value="ورش">رواية ورش عن نافع</option>
              <option value="حفص">رواية حفص عن عاصم</option>
              <option value="قالون">رواية قالون عن نافع</option>
              <option value="العشر">القراءات العشر</option>
            </select>
          </div>

          {visibleImams.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-500">
              {availableImamsCount === 0
                ? 'لا توجد ملفات أئمة منشورة بعد. سجّل ملفك ليكون من أوائل الأئمة على المنصة.'
                : 'لا يوجد أئمة مطابقون لهذا البحث. جرّب تغيير عوامل التصفية.'}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleImams.map((imam) => (
              <ImamMiniCard
                key={imam.id}
                imam={imam}
                onOpen={() => onViewImamFull(imam)}
                onReport={() => onReportImam(imam)}
                contactBlock={
                  <ContactBlock
                    kind="imam"
                    id={imam.id}
                    canView={canSeeImamContacts}
                    lockedText={isMosque ? 'تظهر الأرقام بعد توثيق حسابك' : 'أرقام التواصل للمساجد الموثقة فقط'}
                    onLockedClick={currentRole === 'visitor' ? onOpenAuthModal : undefined}
                  />
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* TAB: MY MOSQUE ADS */}
      {activeTab === 'manage_mosques' && isMosque && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-wrap justify-between items-center gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">إعلانات مسجدي ({myMosques.length})</h3>
              <p className="text-xs text-slate-500">راجع الأئمة المتقدمين لكل إعلان أو أضف إعلاناً جديداً</p>
            </div>
            <button
              onClick={onOpenMosqueAdd}
              className="bg-sky-600 hover:bg-sky-500 text-white font-black px-5 py-2.5 rounded-xl text-xs shadow transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة إعلان جديد</span>
            </button>
          </div>

          {myMosques.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-500">
              لم تنشر أي إعلان بعد.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myMosques.map((m) => {
              const isClosed = m.activeState === 'closed';
              const mosqueApplicants = applications.filter((a) => a.mosqueId === m.id);
              const approval = APPROVAL_LABEL[m.approvalStatus];

              return (
                <div key={m.id} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col justify-between text-xs space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-xs font-bold text-sky-700">{isClosed ? 'الإعلان متوقف' : m.lookingType}</span>
                        <h4 className="text-base font-black text-slate-900 mt-0.5 font-amiri">{m.mosqueName}</h4>
                        <p className="text-xs text-slate-500">
                          {m.country} · {m.city}
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${approval.cls}`}>{approval.text}</span>
                    </div>

                    <p className="text-slate-600 leading-relaxed text-xs line-clamp-3">{m.details}</p>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-sky-700" />
                        <span>الأئمة المتقدمون ({mosqueApplicants.length}):</span>
                      </span>
                      {mosqueApplicants.length === 0 ? (
                        <p className="text-xs text-slate-400">لم يتقدم أئمة بعد لهذا الإعلان.</p>
                      ) : (
                        <div className="space-y-2">
                          {mosqueApplicants.map((app) => {
                            const candidate = imams.find((i) => i.id === app.imamId);
                            return (
                              <div key={app.id} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <img src={getSafeImamAvatar(candidate?.photo)} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
                                  <div>
                                    <h6 className="font-bold text-slate-900 text-xs">{app.imamName}</h6>
                                    <p className="text-xs text-slate-500">
                                      {app.imamCountry} · {APP_STATUS_LABEL[app.status]}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {candidate && (
                                    <button
                                      onClick={() => onViewImamFull(candidate)}
                                      className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                                    >
                                      الملف
                                    </button>
                                  )}
                                  <button
                                    onClick={() => onScheduleInterview(app)}
                                    disabled={m.approvalStatus !== 'approved'}
                                    className="bg-emerald-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer disabled:opacity-50"
                                  >
                                    تواصل
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end items-center gap-1.5">
                    <button onClick={() => onEditMosque(m)} className="bg-sky-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer">
                      تعديل
                    </button>
                    <button
                      onClick={() => onToggleMosqueActive(m)}
                      className="bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                    >
                      {isClosed ? 'تفعيل' : 'إيقاف'}
                    </button>
                    <button
                      onClick={() => onDeleteMosque(m)}
                      aria-label="حذف الإعلان"
                      className="text-red-600 border border-red-200 p-1.5 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: INCOMING APPLICATIONS */}
      {activeTab === 'applications' && isMosque && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-5">
          <h3 className="text-base font-black text-slate-900">طلبات الترشيح الواردة ({applications.length})</h3>
          {applications.length === 0 && <p className="text-xs text-slate-500 py-6 text-center">لا توجد طلبات بعد.</p>}
          <div className="space-y-3">
            {applications.map((app) => {
              const targetImam = imams.find((i) => i.id === app.imamId);
              return (
                <div key={app.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-3.5">
                      <img src={getSafeImamAvatar(targetImam?.photo)} alt="" className="w-12 h-12 rounded-2xl object-cover" />
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">{app.imamName}</h4>
                        <p className="text-slate-500 text-xs">
                          متقدم إلى: {app.mosqueName} · {formatDate(app.appliedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={app.status}
                        onChange={(e) => onSetApplicationStatus(app, e.target.value as ApplicationStatus)}
                        aria-label="حالة الطلب"
                        className="border border-slate-300 rounded-xl px-2 py-1.5 bg-white font-bold text-xs"
                      >
                        {(Object.keys(APP_STATUS_LABEL) as ApplicationStatus[]).map((s) => (
                          <option key={s} value={s}>
                            {APP_STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                      {targetImam && (
                        <button
                          onClick={() => onViewImamFull(targetImam)}
                          className="bg-slate-900 text-white font-bold px-3 py-2 rounded-xl text-xs cursor-pointer"
                        >
                          عرض الملف
                        </button>
                      )}
                      <button
                        onClick={() => onScheduleInterview(app)}
                        className="bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                      >
                        تواصل مباشر
                      </button>
                    </div>
                  </div>
                  {app.note && <p className="text-slate-600 bg-white border border-slate-200 rounded-xl p-3 whitespace-pre-line">{app.note}</p>}
                  {!targetImam && (
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      ملف الإمام غير منشور حالياً (موقوف أو محذوف).
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: INBOX */}
      {activeTab === 'inbox' && isMosque && <InboxCenter currentRole="mosque" {...inbox} />}
    </section>
  );
};
