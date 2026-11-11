import React, { useState, useEffect, useMemo } from 'react';
import { MosqueIcon } from './MosqueIcon';
import { ImamProfile, MosqueJob, Application, UserRole, AvailabilityState } from '../types';
import { formatDate, getSafeImamAvatar } from '../utils/helpers';
import { PageBanner, bannerTab } from './PageBanner';
import { InboxCenter, InboxProps } from './InboxCenter';
import { ContactBlock } from './ContactBlock';
import { MosqueMiniCard } from './MiniCards';
import { RecitationManager } from './Recitation';
import { useRecitationAudio } from '../lib/db';
import { Edit3, Eye, Trash2, Plus, Clock, XCircle } from 'lucide-react';

type Tab = 'manage' | 'mosque_ads' | 'applications' | 'inbox';

interface ImamPortalProps {
  currentRole: UserRole;
  myImam: ImamProfile | null;
  mosques: MosqueJob[];
  applications: Application[];
  onOpenAuthModal: () => void;
  onCreateOrEditMyProfile: () => void;
  onViewImamFull: (imam: ImamProfile) => void;
  onDeleteImam: (imam: ImamProfile) => void;
  onOpenMosqueAdd: () => void;
  onUpdateImamStatus: (id: string, state: AvailabilityState) => void;
  onSaveQuickRamadan: (id: string, ramadanNote: string, afterDate: string) => void;
  onApplyToMosque: (mosque: MosqueJob) => void;
  onReportMosque: (mosque: MosqueJob) => void;
  /** Opens the mosque's full card (CV-style ad with download / share). */
  onViewMosque: (mosque: MosqueJob) => void;
  /** Admin or imam with an approved profile (same rule as firestore.rules). */
  canSeeMosqueContacts: boolean;
  /** Toasts from the recitation sample manager. */
  onToast: (msg: string, kind?: 'success' | 'error') => void;
  inbox: InboxProps;
  initialTab?: Tab;
  /** Reports the open tab (used by the phone bottom bar). */
  onTabChange?: (tab: Tab) => void;
  /** Changes on every tab request from the parent (see App). */
  tabRequest?: number;
}

const APPLICATION_STATUS_LABEL: Record<Application['status'], string> = {
  pending: 'قيد المراجعة',
  accepted: 'تم القبول',
  interview_scheduled: 'تم طلب التواصل المباشر',
  declined: 'لم يتم القبول',
};

export const ImamPortal: React.FC<ImamPortalProps> = ({
  currentRole,
  myImam,
  mosques,
  applications,
  onOpenAuthModal,
  onCreateOrEditMyProfile,
  onViewImamFull,
  onDeleteImam,
  onOpenMosqueAdd,
  onUpdateImamStatus,
  onSaveQuickRamadan,
  onApplyToMosque,
  onReportMosque,
  onViewMosque,
  canSeeMosqueContacts,
  onToast,
  inbox,
  initialTab = 'mosque_ads',
  onTabChange,
  tabRequest = 0,
}) => {
  const isImam = currentRole === 'imam';
  const isLoggedIn = currentRole !== 'visitor';
  // Own recitation sample, to listen to it before replacing it.
  const { audio: myRecitation } = useRecitationAudio(myImam?.id, isImam && !!myImam?.recitationMeta, myImam?.recitationMeta?.createdAt);

  const [activeTab, setActiveTab] = useState<Tab>(isImam ? initialTab : 'mosque_ads');
  const [countryFilter, setCountryFilter] = useState('all');

  useEffect(() => {
    setActiveTab(isImam ? initialTab : 'mosque_ads');
  }, [initialTab, tabRequest, isImam]);
  useEffect(() => {
    onTabChange?.(activeTab);
  }, [activeTab, onTabChange]);

  const [quickRamadanNote, setQuickRamadanNote] = useState(myImam?.ramadanNote || '');
  const [quickAfterDate, setQuickAfterDate] = useState(myImam?.availableAfterDate || '');

  useEffect(() => {
    setQuickRamadanNote(myImam?.ramadanNote || '');
    setQuickAfterDate(myImam?.availableAfterDate || '');
  }, [myImam?.id, myImam?.ramadanNote, myImam?.availableAfterDate]);

  const activeMosques = mosques.filter((m) => m.activeState !== 'closed');
  // Countries come from the data instead of a hard-coded list.
  const countries = useMemo(
    () => Array.from(new Set(activeMosques.map((m) => m.country.trim()).filter(Boolean))).sort(),
    [activeMosques]
  );
  const filteredMosques = activeMosques.filter((m) => countryFilter === 'all' || m.country.trim() === countryFilter);

  const myApplications = applications; // already limited to this imam by the query
  const unreadForMe = inbox.messages.filter((m) => !m.isRead && m.receiverUid === inbox.currentUid).length;

  const tabClass = (tab: Tab) => bannerTab('mosques', activeTab === tab);

  return (
    <section className="flex-1 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
      <PageBanner tone="mosques" title="إعلانات المساجد والجمعيات" count={activeMosques.length} subtitle="تصفح المساجد التي تبحث عن إمام وتقدّم إليها" icon={<MosqueIcon />}>
          {(currentRole === 'mosque' || currentRole === 'admin' || currentRole === 'visitor') && (
            <button
              onClick={onOpenMosqueAdd}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm px-4 py-2.5 rounded-full shadow transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة إعلان مسجد</span>
            </button>
          )}

          {isImam && (
            <>
              <button onClick={() => setActiveTab('mosque_ads')} className={tabClass('mosque_ads')}>
                إعلانات المساجد
              </button>
              <button onClick={() => setActiveTab('manage')} className={tabClass('manage')}>
                ملفي الشخصي كإمام
              </button>
              <button onClick={() => setActiveTab('applications')} className={tabClass('applications')}>
                طلباتي ({myApplications.length})
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

      {/* TAB: MY IMAM PROFILE */}
      {activeTab === 'manage' && isImam && !myImam && (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3">
          <h3 className="text-lg font-black text-slate-900">لم تنشئ ملفك كإمام بعد</h3>
          <p className="text-xs text-slate-500">أنشئ ملفك ليظهر للمساجد بعد مراجعته من الإدارة، وتتمكن من التقديم على الإعلانات.</p>
          <button
            onClick={onCreateOrEditMyProfile}
            className="bg-emerald-700 hover:bg-emerald-600 text-white font-black px-6 py-2.5 rounded-xl text-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء ملفي الآن</span>
          </button>
        </div>
      )}

      {activeTab === 'manage' && isImam && myImam && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-2xs space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900">ملفي الشخصي كإمام ({myImam.name})</h3>
              <p className="text-xs text-slate-500">تحكم في بياناتك وسيرتك الذاتية وحالة تفرغك أمام المساجد</p>
            </div>
            {myImam.approvalStatus === 'pending' && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                قيد المراجعة من الإدارة — غير ظاهر للمساجد بعد
              </span>
            )}
            {myImam.approvalStatus === 'rejected' && (
              <span className="bg-red-100 text-red-900 border border-red-300 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                لم تتم الموافقة على الملف — راسل الإدارة للاستفسار
              </span>
            )}
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-wrap justify-between items-start gap-6">
            <div className="flex items-start gap-4">
              <img
                src={getSafeImamAvatar(myImam.photo)}
                alt={myImam.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-400"
              />
              <div className="space-y-1.5">
                <h4 className="font-black text-xl text-white font-amiri">{myImam.name}</h4>
                <p className="text-xs text-slate-300">
                  {myImam.country} · العمر: {myImam.age} سنة · الرواية: {myImam.riwaya}
                </p>
                <p className="text-xs text-emerald-300">{myImam.degree}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={onCreateOrEditMyProfile}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل بيانات ملفي</span>
              </button>
              <button
                onClick={() => onViewImamFull(myImam)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>معاينة الملف</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {(
              [
                ['available_now', '1. متاح حالياً', 'جاهز للتراويح أو لعقد دائم', 'border-emerald-600 bg-emerald-50 text-emerald-950'],
                ['busy_ramadan', '2. ملتزم في رمضان ومتاح بعده', 'متاح للتعاقد الرسمي بعد العيد', 'border-amber-500 bg-amber-50 text-amber-950'],
                ['paused', '3. إيقاف الإعلان مؤقتاً', 'إخفاء الملف مع حفظ بياناتك', 'border-sky-600 bg-sky-50 text-sky-950'],
              ] as [AvailabilityState, string, string, string][]
            ).map(([state, title, hint, activeCls]) => (
              <button
                key={state}
                onClick={() => onUpdateImamStatus(myImam.id, state)}
                aria-pressed={myImam.availabilityState === state}
                className={`p-4 rounded-2xl border text-right transition cursor-pointer ${
                  myImam.availabilityState === state ? `${activeCls} font-black` : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-sm font-black mb-1">{title}</div>
                <p className="text-xs text-slate-500">{hint}</p>
              </button>
            ))}

            <button
              onClick={() => onDeleteImam(myImam)}
              className="p-4 rounded-2xl border border-red-200 hover:bg-red-50 text-right transition cursor-pointer text-red-700"
            >
              <div className="text-sm font-black mb-1 flex items-center gap-1">
                <Trash2 className="w-4 h-4" />
                <span>4. حذف الملف نهائياً</span>
              </div>
              <p className="text-xs text-slate-500">مسح الملف من المنصة</p>
            </button>
          </div>

          {myImam.availabilityState === 'busy_ramadan' && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
              <input
                type="text"
                maxLength={300}
                value={quickRamadanNote}
                onChange={(e) => setQuickRamadanNote(e.target.value)}
                placeholder="أين أنت ملتزم في رمضان؟"
                aria-label="مكان الالتزام في رمضان"
                className="sm:col-span-5 border border-amber-300 rounded-xl px-3 py-2 bg-white"
              />
              <input
                type="text"
                maxLength={100}
                value={quickAfterDate}
                onChange={(e) => setQuickAfterDate(e.target.value)}
                placeholder="تاريخ التفرغ بعد رمضان"
                aria-label="تاريخ التفرغ بعد رمضان"
                className="sm:col-span-4 border border-amber-300 rounded-xl px-3 py-2 bg-white"
              />
              <button
                onClick={() => onSaveQuickRamadan(myImam.id, quickRamadanNote, quickAfterDate)}
                className="sm:col-span-3 bg-amber-500 text-slate-950 font-black py-2 px-4 rounded-xl cursor-pointer"
              >
                حفظ التفاصيل
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'manage' && isImam && myImam && (
        <RecitationManager
          imam={myImam}
          currentAudio={myRecitation}
          onSaved={(m) => onToast(m)}
          onError={(m) => onToast(m, 'error')}
        />
      )}

      {/* TAB: AVAILABLE MOSQUES */}
      {activeTab === 'mosque_ads' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-wrap justify-between items-center gap-3 text-xs">
            <span className="font-bold text-slate-700">المساجد المتاحة حالياً للتقديم ({filteredMosques.length})</span>
            <label className="flex items-center gap-2">
              <span className="font-bold text-slate-600">الدولة:</span>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white font-bold text-slate-800"
              >
                <option value="all">جميع الدول ({activeMosques.length})</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {filteredMosques.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-500">
              {activeMosques.length === 0
                ? 'لا توجد إعلانات مساجد منشورة بعد. إن كنت تمثّل مسجداً، انشر أول إعلان.'
                : 'لا توجد إعلانات في هذه الدولة حالياً.'}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredMosques.map((m) => {
              const alreadyApplied = myApplications.some((app) => app.mosqueId === m.id);
              return (
                <MosqueMiniCard
                  key={m.id}
                  mosque={m}
                  onOpen={() => onViewMosque(m)}
                  onReport={() => onReportMosque(m)}
                  apply={
                    isImam
                      ? { label: alreadyApplied ? 'تم التقديم' : 'التقديم', done: alreadyApplied, onClick: () => onApplyToMosque(m) }
                      : currentRole === 'visitor'
                      ? { label: 'سجّل دخولك للتقديم', done: false, onClick: onOpenAuthModal }
                      : undefined
                  }
                  contactBlock={
                    <ContactBlock
                      kind="mosque"
                      id={m.id}
                      canView={canSeeMosqueContacts}
                      lockedText={
                        isLoggedIn
                          ? 'بيانات تواصل المسجد تظهر للأئمة الذين اعتمدت الإدارة ملفاتهم'
                          : 'سجّل دخولك كإمام لإظهار بيانات تواصل المسجد'
                      }
                      onLockedClick={isLoggedIn ? undefined : onOpenAuthModal}
                    />
                  }
                />
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: MY APPLICATIONS */}
      {activeTab === 'applications' && isImam && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-black text-slate-900">طلبات الترشح المرسلة ({myApplications.length})</h3>
          {myApplications.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">لم ترسل أي طلبات ترشح بعد.</p>
          ) : (
            <div className="space-y-3">
              {myApplications.map((app) => (
                <div
                  key={app.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center text-xs"
                >
                  <div>
                    <h4 className="font-bold text-slate-900">{app.mosqueName}</h4>
                    <p className="text-slate-500 text-xs">{formatDate(app.appliedAt)}</p>
                  </div>
                  <span className="text-emerald-800 font-bold text-xs">{APPLICATION_STATUS_LABEL[app.status]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: INBOX */}
      {activeTab === 'inbox' && isImam && <InboxCenter currentRole="imam" {...inbox} />}
    </section>
  );
};
