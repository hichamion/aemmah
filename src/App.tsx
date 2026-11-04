import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';
import {
  Application,
  AvailabilityState,
  ImamProfile,
  ImamFormFiles,
  MosqueJob,
  ImamContact,
  MosqueContact,
} from './types';
import { useAuthState, signOutUser, reauthenticate } from './lib/auth';
import {
  applyToMosque,
  createReport,
  deleteImam,
  deleteMessage,
  deleteFeedback,
  deleteMosque,
  deleteMyData,
  describeError,
  ImamEditableFields,
  markMessageRead,
  MosqueEditableFields,
  NewMessage,
  resolveReport,
  saveImam,
  saveMosque,
  sendMessage,
  sendFeedback,
  setFeedbackHandled,
  setApplicationStatus,
  setImamApproval,
  setMosqueActive,
  setMosqueApproval,
  updateImamAvailability,
  updateImamRamadan,
  usePlatformData,
} from './lib/db';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ImamPortal } from './components/ImamPortal';
import { MosquePortal } from './components/MosquePortal';
import { AuthOnboardingModal } from './components/AuthOnboardingModal';
import { ImamModalForm } from './components/ImamModalForm';
import { StatsConsent } from './components/StatsConsent';
import { trackVisit } from './lib/visits';
import { MosqueModalForm } from './components/MosqueModalForm';
import { ImamFullModal } from './components/ImamFullModal';
import { MosqueFullModal } from './components/MosqueFullModal';
import { ApplyModal } from './components/ApplyModal';
import { InterviewModal, InterviewDetails } from './components/InterviewModal';
import { ReportModal } from './components/ReportModal';
import { PrivacyPage } from './components/PrivacyPage';
import { Footer } from './components/Footer';
import { MobileNav } from './components/MobileNav';
import { Intro, shouldShowIntro } from './components/Intro';
import { MIN_ITEMS_FOR_STATS, SUPPORT_ENABLED } from './config';
import { ContactPage } from './components/ContactPage';
import { SupportPage } from './components/SupportPage';

// Loaded on demand: the statistics page pulls in the charts library, and the admin panel is for admins only.
const Dashboard = lazy(() => import('./components/Dashboard').then((m) => ({ default: m.Dashboard })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then((m) => ({ default: m.AdminPanel })));
const CommunityPage = lazy(() => import('./components/community/CommunityPage').then((m) => ({ default: m.CommunityPage })));

export type View = 'home' | 'dashboard' | 'imam' | 'mosque' | 'admin' | 'privacy' | 'contact' | 'support' | 'community';
type ImamTab = 'manage' | 'mosque_ads' | 'applications' | 'inbox';
type MosqueTab = 'browse' | 'manage_mosques' | 'applications' | 'inbox';

// Simple hash routing so the browser back button and shared links work.
// Note: "imam" view = list of mosques (for imams), "mosque" view = list of imams (for mosques).
const VIEW_TO_HASH: Record<View, string> = {
  home: '#/',
  dashboard: '#/stats',
  imam: '#/mosques',
  mosque: '#/imams',
  admin: '#/admin',
  privacy: '#/privacy',
  contact: '#/contact',
  support: '#/support',
  community: '#/community',
};

const VIEW_TITLES: Record<View, string> = {
  home: 'منصة أئمة | جسر تواصل بين الأئمة والمساجد',
  dashboard: 'إحصائيات المنصة | منصة أئمة',
  imam: 'إعلانات المساجد | منصة أئمة',
  mosque: 'الأئمة المتاحون | منصة أئمة',
  admin: 'لوحة الإدارة | منصة أئمة',
  privacy: 'سياسة الخصوصية | منصة أئمة',
  contact: 'راسل الإدارة | منصة أئمة',
  support: 'ادعم المنصة | منصة أئمة',
  community: 'ملتقى الأئمة | منصة أئمة',
};

function parseHash(hash: string): { view: View; imamId?: string; mosqueId?: string } {
  const h = hash || '#/';
  const imamMatch = h.match(/^#\/imams\/([\w-]+)$/);
  if (imamMatch) return { view: 'mosque', imamId: imamMatch[1] };
  // The community page handles its own sub-pages (#/community/post/<id>, /library…).
  if (h.startsWith('#/community')) return { view: 'community' };
  const mosqueMatch = h.match(/^#\/mosques\/([\w-]+)$/);
  if (mosqueMatch) return { view: 'imam', mosqueId: mosqueMatch[1] };
  const entry = (Object.entries(VIEW_TO_HASH) as [View, string][]).find(([, v]) => v === h);
  return { view: entry ? entry[0] : 'home' };
}

type Toast = { msg: string; kind: 'success' | 'error' } | null;

export default function App() {
  const authState = useAuthState();
  const { firebaseUser, profile, role, ready } = authState;
  const uid = firebaseUser?.uid ?? null;

  const data = usePlatformData(uid, role);
  const { imams, mosques, applications, messages, reports, feedback } = data;

  // ------------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------------
  const initial = parseHash(window.location.hash);
  const [currentView, setCurrentViewState] = useState<View>(initial.view);
  const [pendingImamLink, setPendingImamLink] = useState<string | undefined>(initial.imamId);
  const [pendingMosqueLink, setPendingMosqueLink] = useState<string | undefined>(initial.mosqueId);
  // `seq` changes on every request, so asking again for the same tab (e.g. the inbox button)
  // still switches the portal back to it after the user moved to another tab.
  const [imamPortalTab, setImamPortalTabState] = useState<{ tab: ImamTab; seq: number }>({ tab: 'mosque_ads', seq: 0 });
  const [mosquePortalTab, setMosquePortalTabState] = useState<{ tab: MosqueTab; seq: number }>({ tab: 'browse', seq: 0 });
  const setImamPortalTab = useCallback((tab: ImamTab) => setImamPortalTabState((p) => ({ tab, seq: p.seq + 1 })), []);
  const setMosquePortalTab = useCallback((tab: MosqueTab) => setMosquePortalTabState((p) => ({ tab, seq: p.seq + 1 })), []);

  const setCurrentView = useCallback((view: View) => {
    setCurrentViewState(view);
    if (window.location.hash !== VIEW_TO_HASH[view]) window.location.hash = VIEW_TO_HASH[view];
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onHash = () => {
      const parsed = parseHash(window.location.hash);
      setCurrentViewState(parsed.view);
      if (parsed.imamId) setPendingImamLink(parsed.imamId);
      if (parsed.mosqueId) setPendingMosqueLink(parsed.mosqueId);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.title = VIEW_TITLES[currentView];
  }, [currentView]);

  // Anonymous visit counter (see src/lib/visits.ts) — once per opening of the site.
  useEffect(() => {
    void trackVisit();
  }, []);

  // The support page exists only once a payment method is configured (src/config.ts).
  useEffect(() => {
    if (currentView === 'support' && !SUPPORT_ENABLED) setCurrentView('home');
  }, [currentView, setCurrentView]);

  // The admin view is only for admins.
  useEffect(() => {
    if (ready && currentView === 'admin' && role !== 'admin') setCurrentView('home');
  }, [ready, currentView, role, setCurrentView]);

  // ------------------------------------------------------------------
  // Toasts
  // ------------------------------------------------------------------
  // Opening screen, once per session, when landing on the home page.
  const [showIntro, setShowIntro] = useState(shouldShowIntro);

  const [toast, setToast] = useState<Toast>(null);
  const showToast = useCallback((msg: string, kind: 'success' | 'error' = 'success') => {
    setToast({ msg, kind });
    window.setTimeout(() => setToast((t) => (t?.msg === msg ? null : t)), kind === 'error' ? 7000 : 4500);
  }, []);
  const showError = useCallback((err: unknown) => {
    console.error(err);
    showToast(describeError(err), 'error');
  }, [showToast]);

  useEffect(() => {
    if (!data.error) return;
    // Admins get the exact source and Firestore error code to make problems diagnosable.
    showToast(
      role === 'admin'
        ? `تعذر تحميل «${data.error.source}» (${data.error.code}). إن كان الرمز permission-denied فانشر قواعد الأمان: npm run deploy:rules`
        : 'تعذر تحميل بعض البيانات. حدّث الصفحة أو تحقق من الاتصال.',
      'error'
    );
  }, [data.error, role, showToast]);

  // ------------------------------------------------------------------
  // Derived data
  // ------------------------------------------------------------------
  const approvedImams = useMemo(() => imams.filter((i) => i.approvalStatus === 'approved'), [imams]);
  const approvedMosques = useMemo(() => mosques.filter((m) => m.approvalStatus === 'approved'), [mosques]);
  const myImam = useMemo(
    () => (uid && role === 'imam' ? imams.find((i) => i.id === uid) ?? null : null),
    [imams, uid, role]
  );
  const myMosques = useMemo(
    () => (uid && role === 'mosque' ? mosques.filter((m) => m.ownerUid === uid) : []),
    [mosques, uid, role]
  );

  const activeMosquesCount = approvedMosques.filter((m) => m.activeState !== 'closed').length;
  const activeImamsCount = approvedImams.filter((i) => i.availabilityState !== 'paused').length;
  const pendingApprovalsCount =
    role === 'admin'
      ? imams.filter((i) => i.approvalStatus === 'pending').length +
        mosques.filter((m) => m.approvalStatus === 'pending').length
      : 0;
  const isIncoming = (m: { receiverUid: string }) => m.receiverUid === uid || (role === 'admin' && m.receiverUid === 'admin');
  const showStats = role === 'admin' || approvedImams.length + approvedMosques.length >= MIN_ITEMS_FOR_STATS;
  const totalUnreadMessages = messages.filter((m) => !m.isRead && isIncoming(m)).length;

  const displayName =
    role === 'imam' && myImam ? myImam.name : profile?.displayName || firebaseUser?.displayName || 'مستخدم منصة أئمة';
  const canSeeImamContacts = role === 'admin' || (role === 'mosque' && profile?.verified === true);
  // Same rule as mosqueContacts in firestore.rules: admins and imams whose profile is approved.
  const canSeeMosqueContacts = role === 'admin' || (role === 'imam' && myImam?.approvalStatus === 'approved');

  // ------------------------------------------------------------------
  // Modals
  // ------------------------------------------------------------------
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isImamModalOpen, setIsImamModalOpen] = useState(false);
  const [editingImam, setEditingImam] = useState<ImamProfile | null>(null);
  const [isMosqueModalOpen, setIsMosqueModalOpen] = useState(false);
  const [editingMosque, setEditingMosque] = useState<MosqueJob | null>(null);
  const [viewingImamFull, setViewingImamFull] = useState<ImamProfile | null>(null);
  const [viewingMosque, setViewingMosque] = useState<MosqueJob | null>(null);
  const [applyingMosque, setApplyingMosque] = useState<MosqueJob | null>(null);
  const [interviewTarget, setInterviewTarget] = useState<{ application: Application | null; imam: ImamProfile | null } | null>(null);
  const [reportTarget, setReportTarget] = useState<{ type: 'imam' | 'mosque'; id: string; name: string } | null>(null);

  // Keep the open profile in sync with live data.
  const liveViewingImam = viewingImamFull ? imams.find((i) => i.id === viewingImamFull.id) ?? viewingImamFull : null;

  const liveViewingMosque = viewingMosque ? mosques.find((m) => m.id === viewingMosque.id) ?? viewingMosque : null;

  // Open a shared mosque link (#/mosques/<id>) once the data is loaded.
  useEffect(() => {
    if (!pendingMosqueLink || data.loading) return;
    const target = mosques.find((m) => m.id === pendingMosqueLink);
    if (target) setViewingMosque(target);
    setPendingMosqueLink(undefined);
  }, [pendingMosqueLink, data.loading, mosques]);

  // Open a shared imam link (#/imams/<id>) once the data is loaded.
  useEffect(() => {
    if (!pendingImamLink || data.loading) return;
    const target = imams.find((i) => i.id === pendingImamLink);
    if (target) setViewingImamFull(target);
    setPendingImamLink(undefined);
  }, [pendingImamLink, data.loading, imams]);

  // ------------------------------------------------------------------
  // Auth
  // ------------------------------------------------------------------
  const handleOnboardingComplete = (chosenRole: 'imam' | 'mosque') => {
    showToast('تم إنشاء حسابك بنجاح! أكمل الآن بيانات ملفك.');
    if (chosenRole === 'imam') {
      setEditingImam(null);
      setIsImamModalOpen(true);
      setCurrentView('imam');
      setImamPortalTab('manage');
    } else {
      setEditingMosque(null);
      setIsMosqueModalOpen(true);
      setCurrentView('mosque');
      setMosquePortalTab('manage_mosques');
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      setCurrentView('home');
      showToast('تم تسجيل الخروج.');
    } catch (err) {
      showError(err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!uid) return;
    const ok = window.confirm(
      'سيتم حذف حسابك وملفك وإعلاناتك ورسائلك نهائياً ولا يمكن التراجع عن ذلك.\nهل أنت متأكد؟'
    );
    if (!ok) return;
    try {
      // Sign-in confirmation first: if it fails or is cancelled, nothing has been deleted yet.
      await reauthenticate();
      await deleteMyData(uid);
      setCurrentView('home');
      showToast('تم حذف حسابك وجميع بياناتك.');
    } catch (err) {
      showError(err);
    }
  };

  const requireLogin = () => {
    setIsAuthModalOpen(true);
  };

  const handleOpenMyProfile = () => {
    if (role === 'admin') setCurrentView('admin');
    else if (role === 'imam') {
      setImamPortalTab('manage');
      setCurrentView('imam');
    } else if (role === 'mosque') {
      setMosquePortalTab('manage_mosques');
      setCurrentView('mosque');
    }
  };

  const handleEditMyProfile = () => {
    if (role === 'imam') {
      setEditingImam(myImam);
      setIsImamModalOpen(true);
    } else if (role === 'mosque') {
      if (myMosques.length === 1) {
        setEditingMosque(myMosques[0]);
        setIsMosqueModalOpen(true);
      } else {
        setMosquePortalTab('manage_mosques');
        setCurrentView('mosque');
      }
    }
  };

  // ------------------------------------------------------------------
  // Imams
  // ------------------------------------------------------------------
  const handleOpenImamAdd = () => {
    if (role === 'visitor') return requireLogin();
    if (role === 'mosque') {
      showToast('حسابك مسجل كمسجد/جمعية. لإنشاء ملف إمام استخدم حساباً آخر.', 'error');
      return;
    }
    if (role === 'imam' && myImam) {
      // One profile per imam account: open it for editing instead.
      setEditingImam(myImam);
    } else {
      setEditingImam(null);
    }
    setIsImamModalOpen(true);
  };

  const handleOpenImamEdit = (imam: ImamProfile) => {
    if (role === 'visitor') return requireLogin();
    if (role !== 'admin' && imam.ownerUid !== uid) return;
    setEditingImam(imam);
    setIsImamModalOpen(true);
  };

  const handleSaveImam = async (
    fields: ImamEditableFields,
    contact: Omit<ImamContact, 'ownerUid'>,
    files: ImamFormFiles
  ) => {
    if (!uid) return requireLogin();
    try {
      await saveImam({ existing: editingImam, fields, contact, files, actorUid: uid, actorIsAdmin: role === 'admin' });
      setIsImamModalOpen(false);
      if (editingImam) {
        showToast(`تم حفظ بيانات ${fields.name} بنجاح.`);
      } else if (role === 'admin') {
        showToast('تمت إضافة ملف الإمام واعتماده مباشرة.');
      } else {
        showToast('تم حفظ ملفك وإرساله إلى الإدارة للمراجعة. سيظهر للمساجد بعد الموافقة.');
      }
      if (role === 'imam') {
        setImamPortalTab('manage');
        setCurrentView('imam');
      }
    } catch (err) {
      showError(err);
      throw err; // keeps the form open
    }
  };

  const handleSetImamApproval = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await setImamApproval(id, status);
      showToast(status === 'approved' ? 'تمت الموافقة على ملف الإمام ونشره.' : 'تم رفض ملف الإمام.');
    } catch (err) {
      showError(err);
    }
  };

  const handleDeleteImam = async (imam: ImamProfile) => {
    if (!window.confirm(`حذف ملف "${imam.name}" نهائياً؟`)) return;
    try {
      await deleteImam(imam);
      showToast('تم حذف ملف الإمام.');
    } catch (err) {
      showError(err);
    }
  };

  const handleUpdateImamStatus = async (id: string, state: AvailabilityState) => {
    try {
      await updateImamAvailability(id, state);
      showToast('تم تحديث حالة التفرغ.');
    } catch (err) {
      showError(err);
    }
  };

  const handleSaveQuickRamadan = async (id: string, note: string, afterDate: string) => {
    try {
      await updateImamRamadan(id, note, afterDate);
      showToast('تم حفظ تفاصيل رمضان وتاريخ التفرغ.');
    } catch (err) {
      showError(err);
    }
  };

  // ------------------------------------------------------------------
  // Mosques
  // ------------------------------------------------------------------
  const handleOpenMosqueAdd = () => {
    if (role === 'visitor') return requireLogin();
    if (role === 'imam') {
      showToast('حسابك مسجل كإمام. لنشر إعلان مسجد استخدم حساب الجمعية/المسجد.', 'error');
      return;
    }
    setEditingMosque(null);
    setIsMosqueModalOpen(true);
  };

  const handleOpenMosqueEdit = (mosque: MosqueJob) => {
    if (role === 'visitor') return requireLogin();
    if (role !== 'admin' && mosque.ownerUid !== uid) return;
    setEditingMosque(mosque);
    setIsMosqueModalOpen(true);
  };

  const handleSaveMosque = async (fields: MosqueEditableFields, contact: Omit<MosqueContact, 'ownerUid'>) => {
    if (!uid) return requireLogin();
    try {
      await saveMosque({ existing: editingMosque, fields, contact, actorUid: uid, actorIsAdmin: role === 'admin' });
      setIsMosqueModalOpen(false);
      if (editingMosque) showToast(`تم حفظ تعديلات (${fields.mosqueName}).`);
      else if (role === 'admin') showToast('تمت إضافة المسجد واعتماده مباشرة.');
      else showToast('تم إرسال إعلان المسجد إلى الإدارة للمراجعة.');
      if (role === 'mosque') {
        setMosquePortalTab('manage_mosques');
        setCurrentView('mosque');
      }
    } catch (err) {
      showError(err);
      throw err;
    }
  };

  const handleSetMosqueApproval = async (mosque: MosqueJob, status: 'approved' | 'rejected') => {
    if (!uid) return;
    try {
      await setMosqueApproval(mosque, status, uid);
      showToast(status === 'approved' ? 'تمت الموافقة على إعلان المسجد ونشره.' : 'تم رفض إعلان المسجد.');
    } catch (err) {
      showError(err);
    }
  };

  const handleDeleteMosque = async (mosque: MosqueJob) => {
    if (!window.confirm(`حذف إعلان "${mosque.mosqueName}" نهائياً؟`)) return;
    try {
      await deleteMosque(mosque);
      showToast('تم حذف إعلان المسجد.');
    } catch (err) {
      showError(err);
    }
  };

  const handleToggleMosqueActive = async (mosque: MosqueJob) => {
    try {
      await setMosqueActive(mosque.id, mosque.activeState === 'closed' ? 'active' : 'closed');
    } catch (err) {
      showError(err);
    }
  };

  // ------------------------------------------------------------------
  // Applications, interviews, messages
  // ------------------------------------------------------------------
  const handleOpenApplyModal = (mosque: MosqueJob) => {
    if (role === 'visitor') return requireLogin();
    if (role !== 'imam') {
      showToast('التقديم على الإعلانات متاح لحسابات الأئمة فقط.', 'error');
      return;
    }
    if (!myImam) {
      showToast('أنشئ ملفك كإمام أولاً، ثم يمكنك التقديم.', 'error');
      setEditingImam(null);
      setIsImamModalOpen(true);
      return;
    }
    if (myImam.approvalStatus !== 'approved') {
      showToast('ملفك ما زال قيد المراجعة. يمكنك التقديم بعد موافقة الإدارة.', 'error');
      return;
    }
    setApplyingMosque(mosque);
  };

  const handleConfirmApply = async (note: string) => {
    if (!uid || !myImam || !applyingMosque) return;
    try {
      await applyToMosque(applyingMosque, myImam, uid, note);
      showToast(`تم إرسال طلب الترشح إلى (${applyingMosque.mosqueName}).`);
      setApplyingMosque(null);
    } catch (err) {
      showError(err);
    }
  };

  const handleRequestInterviewFromImam = (imam: ImamProfile) => {
    if (role !== 'mosque') return;
    if (myMosques.filter((m) => m.approvalStatus === 'approved').length === 0) {
      showToast('يجب أن يكون لديك إعلان مسجد معتمد قبل التواصل مع الأئمة.', 'error');
      return;
    }
    setViewingImamFull(null);
    setInterviewTarget({ application: null, imam });
  };

  const handleConfirmInterview = async (details: InterviewDetails) => {
    if (!uid) return;
    const { mosque, imamUid, imamName, imamId, dateTime, methodLabel, contactDetail, notes } = details;
    try {
      await sendMessage({
        senderUid: uid,
        senderType: 'mosque',
        senderName: mosque.mosqueName,
        receiverUid: imamUid,
        receiverType: 'imam',
        receiverName: imamName,
        subject: `طلب تواصل رسمي من: ${mosque.mosqueName}`,
        content:
          `فضيلة الشيخ ${imamName}،\nيسر إدارة ${mosque.mosqueName} التواصل معكم:\n` +
          `• الموعد المقترح: ${dateTime}\n• الوسيلة: ${methodLabel}\n• للتواصل: ${contactDetail}` +
          (notes.trim() ? `\n\nملاحظة:\n${notes.trim()}` : ''),
        category: 'interview',
        relatedMosqueId: mosque.id,
        relatedImamId: imamId,
      });
      // Only the application for THIS mosque and THIS imam changes status.
      const app = applications.find((a) => a.mosqueId === mosque.id && a.imamUid === imamUid);
      if (app) await setApplicationStatus(app.id, 'interview_scheduled');
      showToast(`تم إرسال طلب التواصل إلى (${imamName}).`);
      setInterviewTarget(null);
    } catch (err) {
      showError(err);
    }
  };

  const handleSendMessage = async (msg: NewMessage): Promise<boolean> => {
    try {
      await sendMessage(msg);
      showToast('تم إرسال الرسالة.');
      return true;
    } catch (err) {
      showError(err);
      return false;
    }
  };

  // Admin: the same message to many accounts (e.g. all imams), with a single confirmation.
  const handleBroadcast = async (msgs: NewMessage[]): Promise<boolean> => {
    let sent = 0;
    for (const msg of msgs) {
      try {
        await sendMessage(msg);
        sent++;
      } catch (err) {
        console.error(err);
      }
    }
    if (sent === msgs.length) showToast(`تم إرسال الرسالة إلى ${sent} حساب.`);
    else showToast(`أُرسلت الرسالة إلى ${sent} من ${msgs.length}. تعذر الإرسال إلى البقية.`, 'error');
    return sent > 0;
  };

  const handleMarkAsRead = (id: string) => {
    markMessageRead(id).catch((err) => console.warn(err));
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('حذف هذه الرسالة؟')) return;
    try {
      await deleteMessage(id);
    } catch (err) {
      showError(err);
    }
  };

  // ------------------------------------------------------------------
  // Reports
  // ------------------------------------------------------------------
  const handleOpenReportImam = (imam: ImamProfile) => {
    if (role === 'visitor') return requireLogin();
    setReportTarget({ type: 'imam', id: imam.id, name: imam.name });
  };
  const handleOpenReportMosque = (mosque: MosqueJob) => {
    if (role === 'visitor') return requireLogin();
    setReportTarget({ type: 'mosque', id: mosque.id, name: mosque.mosqueName });
  };

  const handleConfirmReport = async (reason: string, details: string) => {
    if (!uid || !reportTarget || role === 'visitor') return;
    try {
      await createReport({
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        targetName: reportTarget.name,
        reason,
        details,
        reporterUid: uid,
        reporterRole: role,
      });
      showToast(`تم إرسال البلاغ عن (${reportTarget.name}) إلى الإدارة.`);
      setReportTarget(null);
    } catch (err) {
      showError(err);
    }
  };

  const handleSendFeedback = async (item: Parameters<typeof sendFeedback>[0]): Promise<boolean> => {
    try {
      await sendFeedback(item);
      return true;
    } catch (err) {
      showError(err);
      return false;
    }
  };

  const handleFeedbackHandled = (id: string) => setFeedbackHandled(id).catch(showError);
  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm('حذف هذه الرسالة؟')) return;
    await deleteFeedback(id).catch(showError);
  };

  const handleResolveReport = async (id: string) => {
    try {
      await resolveReport(id);
      showToast('تمت معالجة البلاغ.');
    } catch (err) {
      showError(err);
    }
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  const goImamsList = () => {
    setMosquePortalTab('browse');
    setCurrentView('mosque');
  };
  const goMosquesList = () => {
    setImamPortalTab('mosque_ads');
    setCurrentView('imam');
  };

  const goHowItWorks = () => {
    setCurrentView('home');
    // Wait for the home view to render before scrolling to the section.
    window.setTimeout(() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const inboxProps = {
    currentUid: uid ?? '',
    messages,
    // Admins can write to every imam and mosque (pending ones too); others only to approved ones.
    recipientImams: (role === 'admin' ? imams : approvedImams).filter((i) => i.ownerUid !== uid),
    recipientMosques: (role === 'admin' ? mosques : approvedMosques).filter((m) => m.ownerUid !== uid),
    onSendMessage: handleSendMessage,
    onMarkAsRead: handleMarkAsRead,
    onDeleteMessage: handleDeleteMessage,
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-emerald-600 selection:text-white">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-bold max-w-md w-[92%] sm:w-auto ${
            toast.kind === 'error' ? 'bg-red-700 text-white border-red-500' : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {toast.kind === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="flex-1">{toast.msg}</span>
          <button onClick={() => setToast(null)} aria-label="إغلاق" className="text-white/70 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentRole={role}
        userName={displayName}
        userEmail={profile?.email || firebaseUser?.email || ''}
        userPhoto={role === 'imam' ? myImam?.photo : firebaseUser?.photoURL || undefined}
        authReady={ready}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenMyProfile={handleOpenMyProfile}
        onEditMyProfile={handleEditMyProfile}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
        imamsCount={activeImamsCount}
        mosquesCount={activeMosquesCount}
        pendingCount={pendingApprovalsCount}
        unreadCount={totalUnreadMessages}
        showStats={showStats}
        onOpenInbox={
          role === 'imam'
            ? () => {
                setImamPortalTab('inbox');
                setCurrentView('imam');
              }
            : role === 'mosque'
            ? () => {
                setMosquePortalTab('inbox');
                setCurrentView('mosque');
              }
            : role === 'admin'
            ? () => setCurrentView('admin')
            : undefined
        }
      />

      <main className="flex-1 flex flex-col">
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center py-24 text-slate-500 text-sm gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>جاري التحميل…</span>
            </div>
          }
        >
        {data.loading && !['home', 'privacy', 'contact', 'support', 'community'].includes(currentView) ? (
          <div className="flex-1 flex items-center justify-center py-24 text-slate-500 text-sm gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>جاري تحميل البيانات…</span>
          </div>
        ) : (
          <>
            {currentView === 'home' && (
              <HeroSection
                onOpenImamList={goImamsList}
                onOpenMosqueList={goMosquesList}
                onOpenImamAddModal={handleOpenImamAdd}
                onOpenMosqueAddModal={handleOpenMosqueAdd}
                onOpenDashboard={() => setCurrentView('dashboard')}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                onOpenAdminPanel={() => setCurrentView('admin')}
                currentRole={role}
                imamsCount={activeImamsCount}
                mosquesCount={activeMosquesCount}
                pendingCount={pendingApprovalsCount}
                showStats={showStats}
                onOpenContact={() => setCurrentView('contact')}
              />
            )}

            {currentView === 'dashboard' && (
              <Dashboard
                imams={approvedImams}
                mosques={approvedMosques}
                onOpenImams={goImamsList}
                onOpenMosques={goMosquesList}
              />
            )}

            {currentView === 'imam' && (
              <ImamPortal
                currentRole={role}
                myImam={myImam}
                mosques={approvedMosques}
                applications={applications}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                onCreateOrEditMyProfile={handleOpenImamAdd}
                onViewImamFull={setViewingImamFull}
                onDeleteImam={handleDeleteImam}
                onOpenMosqueAdd={handleOpenMosqueAdd}
                onUpdateImamStatus={handleUpdateImamStatus}
                onSaveQuickRamadan={handleSaveQuickRamadan}
                onApplyToMosque={handleOpenApplyModal}
                onReportMosque={handleOpenReportMosque}
                onViewMosque={setViewingMosque}
                canSeeMosqueContacts={canSeeMosqueContacts}
                onToast={showToast}
                inbox={{ ...inboxProps, currentName: myImam?.name || displayName }}
                initialTab={imamPortalTab.tab}
                tabRequest={imamPortalTab.seq}
              />
            )}

            {currentView === 'mosque' && (
              <MosquePortal
                currentRole={role}
                isVerifiedMosque={profile?.verified === true}
                canSeeImamContacts={canSeeImamContacts}
                imams={approvedImams}
                myMosques={myMosques}
                applications={applications}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                onOpenMosqueAdd={handleOpenMosqueAdd}
                onOpenImamAdd={handleOpenImamAdd}
                onEditMosque={handleOpenMosqueEdit}
                onDeleteMosque={handleDeleteMosque}
                onToggleMosqueActive={handleToggleMosqueActive}
                onViewImamFull={setViewingImamFull}
                onScheduleInterview={(app) => setInterviewTarget({ application: app, imam: null })}
                onSetApplicationStatus={(app, status) =>
                  setApplicationStatus(app.id, status).catch(showError)
                }
                onReportImam={handleOpenReportImam}
                inbox={{ ...inboxProps, currentName: myMosques[0]?.mosqueName || displayName }}
                initialTab={mosquePortalTab.tab}
                tabRequest={mosquePortalTab.seq}
              />
            )}

            {currentView === 'admin' && role === 'admin' && (
              <AdminPanel
                imams={imams}
                mosques={mosques}
                reports={reports}
                onSetImamApproval={handleSetImamApproval}
                onEditImam={handleOpenImamEdit}
                onDeleteImam={handleDeleteImam}
                onViewImamFull={setViewingImamFull}
                onSetMosqueApproval={handleSetMosqueApproval}
                onEditMosque={handleOpenMosqueEdit}
                onDeleteMosque={handleDeleteMosque}
                onToggleMosqueActive={handleToggleMosqueActive}
                onResolveReport={handleResolveReport}
                feedback={feedback}
                onFeedbackHandled={handleFeedbackHandled}
                onDeleteFeedback={handleDeleteFeedback}
                onOpenImamAdd={handleOpenImamAdd}
                onOpenMosqueAdd={handleOpenMosqueAdd}
                inbox={{ ...inboxProps, currentName: 'إدارة منصة أئمة', onBroadcast: handleBroadcast }}
              />
            )}

            {currentView === 'privacy' && <PrivacyPage onBack={() => setCurrentView('home')} />}

            {currentView === 'community' && (
              <CommunityPage
                uid={uid}
                role={role}
                viewerName={displayName}
                myImam={myImam}
                imams={role === 'admin' ? imams : approvedImams}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                onToast={showToast}
              />
            )}

            {currentView === 'contact' && (
              <ContactPage
                defaultName={role === 'visitor' ? '' : displayName}
                defaultEmail={profile?.email || firebaseUser?.email || ''}
                onBack={() => setCurrentView('home')}
                onSend={handleSendFeedback}
              />
            )}

            {currentView === 'support' && SUPPORT_ENABLED && <SupportPage onBack={() => setCurrentView('home')} />}
          </>
        )}
      </Suspense>
      </main>

      <Footer
        onOpenImamsList={goImamsList}
        onOpenMosquesList={goMosquesList}
        onOpenPrivacy={() => setCurrentView('privacy')}
        onOpenImamAdd={handleOpenImamAdd}
        onOpenMosqueAdd={handleOpenMosqueAdd}
        onOpenHowItWorks={goHowItWorks}
        onOpenContact={() => setCurrentView('contact')}
        onOpenSupport={SUPPORT_ENABLED ? () => setCurrentView('support') : undefined}
      />

      {showIntro && <Intro onDone={() => setShowIntro(false)} />}

      <StatsConsent onPrivacy={() => setCurrentView('privacy')} />

      <MobileNav
        currentView={currentView}
        role={role}
        unreadCount={totalUnreadMessages}
        onHome={() => setCurrentView('home')}
        onImams={goImamsList}
        onMosques={goMosquesList}
        onCommunity={() => setCurrentView('community')}
        onAccount={handleOpenMyProfile}
        onSignIn={() => setIsAuthModalOpen(true)}
      />

      {/* ------------------------------ Modals ------------------------------ */}
      <AuthOnboardingModal
        // Hidden on the privacy page so it can be read before accepting it during sign-up.
        isOpen={(isAuthModalOpen || authState.needsOnboarding) && currentView !== 'privacy'}
        needsOnboarding={authState.needsOnboarding}
        firebaseUser={firebaseUser}
        onClose={() => setIsAuthModalOpen(false)}
        onError={showError}
        onInfo={(msg) => showToast(msg)}
        onOnboardingComplete={handleOnboardingComplete}
      />

      <ImamModalForm
        isOpen={isImamModalOpen}
        onClose={() => setIsImamModalOpen(false)}
        onSave={handleSaveImam}
        initialData={editingImam}
        liveImam={editingImam ? imams.find((i) => i.id === editingImam.id) ?? null : null}
        onError={(msg) => showToast(msg, 'error')}
        onInfo={(msg) => showToast(msg)}
      />

      <MosqueModalForm
        isOpen={isMosqueModalOpen}
        onClose={() => setIsMosqueModalOpen(false)}
        onSave={handleSaveMosque}
        initialData={editingMosque}
      />

      <ImamFullModal
        imam={liveViewingImam}
        onClose={() => setViewingImamFull(null)}
        currentRole={role}
        canViewContact={canSeeImamContacts || (!!liveViewingImam && liveViewingImam.ownerUid === uid)}
        canEdit={!!liveViewingImam && (role === 'admin' || liveViewingImam.ownerUid === uid)}
        isUnverifiedMosque={role === 'mosque' && !profile?.verified}
        onEdit={(imam) => {
          setViewingImamFull(null);
          handleOpenImamEdit(imam);
        }}
        onRequestInterview={handleRequestInterviewFromImam}
        onReport={(imam) => {
          setViewingImamFull(null);
          handleOpenReportImam(imam);
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onCopied={() => showToast('تم نسخ رابط الملف.')}
        onError={(msg) => showToast(msg, 'error')}
      />

      <MosqueFullModal
        mosque={liveViewingMosque}
        onClose={() => setViewingMosque(null)}
        currentRole={role}
        canViewContact={canSeeMosqueContacts || (!!liveViewingMosque && liveViewingMosque.ownerUid === uid)}
        canEdit={!!liveViewingMosque && (role === 'admin' || liveViewingMosque.ownerUid === uid)}
        alreadyApplied={!!liveViewingMosque && applications.some((a) => a.mosqueId === liveViewingMosque.id && a.imamUid === uid)}
        onApply={handleOpenApplyModal}
        onEdit={handleOpenMosqueEdit}
        onReport={handleOpenReportMosque}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onCopied={() => showToast('تم نسخ رابط الإعلان.')}
        onError={(msg) => showToast(msg, 'error')}
      />

      <ApplyModal
        mosque={applyingMosque}
        imam={myImam}
        onClose={() => setApplyingMosque(null)}
        onConfirmApply={handleConfirmApply}
      />

      <InterviewModal
        target={interviewTarget}
        myMosques={myMosques.filter((m) => m.approvalStatus === 'approved')}
        imams={approvedImams}
        onClose={() => setInterviewTarget(null)}
        onConfirm={handleConfirmInterview}
      />

      <ReportModal target={reportTarget} onClose={() => setReportTarget(null)} onConfirmReport={handleConfirmReport} />
    </div>
  );
}
