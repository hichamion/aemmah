import React, { useState } from 'react';
import { FeedbackItem, ImamProfile, MosqueJob, ReportItem } from '../types';
import { formatDate, getSafeImamAvatar } from '../utils/helpers';
import { ContactBlock } from './ContactBlock';
import { InboxCenter, InboxProps } from './InboxCenter';
import { VisitStatsPanel } from './VisitStatsPanel';
import {
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  Eye,
  Flag,
  Building2,
  Mic,
  Clock,
  Mail,
  Plus,
  MessageSquare,
  BarChart3,
} from 'lucide-react';

interface AdminPanelProps {
  imams: ImamProfile[];
  mosques: MosqueJob[];
  reports: ReportItem[];
  onSetImamApproval: (id: string, status: 'approved' | 'rejected') => void;
  onEditImam: (imam: ImamProfile) => void;
  onDeleteImam: (imam: ImamProfile) => void;
  onViewImamFull: (imam: ImamProfile) => void;
  onSetMosqueApproval: (mosque: MosqueJob, status: 'approved' | 'rejected') => void;
  onEditMosque: (mosque: MosqueJob) => void;
  onDeleteMosque: (mosque: MosqueJob) => void;
  onToggleMosqueActive: (mosque: MosqueJob) => void;
  onResolveReport: (reportId: string) => void;
  feedback: FeedbackItem[];
  onFeedbackHandled: (id: string) => void;
  onDeleteFeedback: (id: string) => void;
  onOpenImamAdd: () => void;
  onOpenMosqueAdd: () => void;
  inbox: InboxProps;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  imams,
  mosques,
  reports,
  onSetImamApproval,
  onEditImam,
  onDeleteImam,
  onViewImamFull,
  onSetMosqueApproval,
  onEditMosque,
  onDeleteMosque,
  onToggleMosqueActive,
  onResolveReport,
  feedback,
  onFeedbackHandled,
  onDeleteFeedback,
  onOpenImamAdd,
  onOpenMosqueAdd,
  inbox,
}) => {
  // Opens the inbox compose window for one imam / mosque ("مراسلة" buttons).
  const [composeRequest, setComposeRequest] = useState<{ type: 'imam' | 'mosque'; id: string; seq: number } | null>(null);
  const messageTo = (type: 'imam' | 'mosque', id: string) => {
    setComposeRequest((prev) => ({ type, id, seq: (prev?.seq ?? 0) + 1 }));
    setActiveTab('inbox');
  };
  const [activeTab, setActiveTab] = useState<'pending' | 'all_imams' | 'all_mosques' | 'reports' | 'feedback' | 'inbox' | 'visits'>('pending');
  const unreadAdmin = inbox.messages.filter(
    (m) => !m.isRead && (m.receiverUid === 'admin' || m.receiverUid === inbox.currentUid)
  ).length;

  const pendingImams = imams.filter((i) => i.approvalStatus === 'pending');
  const pendingMosques = mosques.filter((m) => m.approvalStatus === 'pending');
  const pendingReports = reports.filter((r) => r.status === 'pending');
  const newFeedback = feedback.filter((f) => f.status === 'new');
  const totalPendingCount = pendingImams.length + pendingMosques.length;

  return (
    <section className="flex-1 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
      
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 text-white p-5 sm:p-7 rounded-3xl shadow-xl border-b-4 border-amber-400 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center text-2xl font-black shadow-lg">
            🛡️
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black font-amiri">
                لوحة تحكم الإدارة
              </h1>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-black px-2.5 py-0.5 rounded-full">
                صلاحيات كاملة: مراجعة • تعديل • موافقة
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              هذه النسخة خاصة بك كمدير للمنصة: يمكنك مراجعة الطلبات الجديدة للأئمة والمساجد، تعديل أي بيانات، والموافقة عليها لتظهر للزوار.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenImamAdd}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3.5 py-2.5 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة إمام (معتمد فوراً)</span>
          </button>
          <button
            onClick={onOpenMosqueAdd}
            className="bg-sky-600 hover:bg-sky-500 text-white font-black text-xs px-3.5 py-2.5 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مسجد (معتمد فوراً)</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs">
        <div className="bg-white p-4 rounded-2xl border-2 border-amber-300 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-bold">طلبات جديدة تنتظر موافقتك</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{totalPendingCount}</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg font-black">
            ⏳
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-bold">إجمالي ملفات الأئمة</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{imams.length}</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg font-black">
            🎙️
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-bold">إجمالي إعلانات المساجد</p>
            <p className="text-2xl font-black text-sky-700 mt-1">{mosques.length}</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center text-lg font-black">
            🕌
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-bold">بلاغات التفرغ والرقابة</p>
            <p className="text-2xl font-black text-red-600 mt-1">{pendingReports.length}</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-red-100 text-red-800 flex items-center justify-center text-lg font-black">
            🚩
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 text-xs">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2.5 rounded-xl font-black transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>الطلبات الجديدة بانتظار الموافقة ({totalPendingCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('all_imams')}
          className={`px-4 py-2.5 rounded-xl font-black transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'all_imams'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>إدارة وتعديل جميع الأئمة ({imams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('all_mosques')}
          className={`px-4 py-2.5 rounded-xl font-black transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'all_mosques'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>إدارة وتعديل جميع المساجد ({mosques.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 rounded-xl font-black transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>مراجعة البلاغات ({pendingReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2.5 rounded-xl font-black transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'feedback'
              ? 'bg-sky-700 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>رسائل الزوار والاقتراحات</span>
          {newFeedback.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-1.5 rounded-full font-black">{newFeedback.length}</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('inbox')}
          className={`px-4 py-2.5 rounded-xl font-black transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'inbox'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>رسائل الإدارة</span>
          {unreadAdmin > 0 && (
            <span className="bg-red-500 text-white text-xs px-1.5 rounded-full font-black">{unreadAdmin}</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('visits')}
          className={`px-4 py-2.5 rounded-xl font-black transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'visits'
              ? 'bg-emerald-800 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>إحصاءات الزيارات</span>
        </button>
      </div>

      {/* TAB 1: PENDING APPROVALS */}
      {activeTab === 'pending' && (
        <div className="space-y-6">
          {totalPendingCount === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-black text-slate-900">لا توجد طلبات معلقة حالياً</h3>
              <p className="text-xs text-slate-500">
                جميع طلبات الأئمة والمساجد تمت مراجعتها والموافقة عليها. يمكنك استعراض وتعديل جميع الملفات من التبويبات المجاورة.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Pending Imams */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-emerald-300 shadow-sm space-y-4">
                <h3 className="font-black text-base text-emerald-950 flex items-center justify-between border-b pb-3">
                  <span>🎙️ طلبات تسجيل أئمة جدد ({pendingImams.length})</span>
                  <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-0.5 rounded-full">
                    مخفية عن الزوار حتى توافق عليها
                  </span>
                </h3>

                {pendingImams.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">لا توجد طلبات أئمة معلقة.</p>
                ) : (
                  <div className="space-y-4">
                    {pendingImams.map((imam) => (
                      <div
                        key={imam.id}
                        className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-3 text-xs"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={getSafeImamAvatar(imam.photo)}
                            alt={imam.name}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-600 shrink-0"
                          />
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-sm text-slate-900 font-amiri">{imam.name}</h4>
                              <span className="bg-amber-200 text-amber-950 text-xs font-black px-2 py-0.5 rounded-full">
                                قيد المراجعة
                              </span>
                            </div>
                            <p className="text-slate-600 text-xs">
                              📍 {imam.country} • العمر: {imam.age} سنة • الرواية: {imam.riwaya}
                            </p>
                            <p className="text-slate-700 text-xs">
                              🎓 {imam.degree}
                            </p>
                            <ContactBlock kind="imam" id={imam.id} canView variant="inline" lockedText="—" />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-emerald-200/70">
                          <button
                            onClick={() => onViewImamFull(imam)}
                            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>معاينة</span>
                          </button>
                          <button
                            onClick={() => messageTo('imam', imam.id)}
                            className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>مراسلة</span>
                          </button>
                          <button
                            onClick={() => onEditImam(imam)}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>
                          <button
                            onClick={() => onSetImamApproval(imam.id, 'approved')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-1.5 rounded-xl text-xs shadow flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>موافقة واعتماد النشر</span>
                          </button>
                          <button
                            onClick={() => onSetImamApproval(imam.id, 'rejected')}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>رفض</span>
                          </button>
                          <button
                            onClick={() => onDeleteImam(imam)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 font-bold px-2.5 py-1.5 rounded-xl text-xs cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Mosques */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-sky-300 shadow-sm space-y-4">
                <h3 className="font-black text-base text-sky-950 flex items-center justify-between border-b pb-3">
                  <span>🕌 طلبات نشر مساجد وجمعيات جديدة ({pendingMosques.length})</span>
                  <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-0.5 rounded-full">
                    مخفية عن الزوار حتى توافق عليها
                  </span>
                </h3>

                {pendingMosques.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">لا توجد طلبات مساجد معلقة.</p>
                ) : (
                  <div className="space-y-4">
                    {pendingMosques.map((m) => (
                      <div
                        key={m.id}
                        className="bg-sky-50/60 border border-sky-200 rounded-2xl p-4 space-y-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-black text-sm text-slate-900 font-amiri">{m.mosqueName}</h4>
                            <span className="bg-amber-200 text-amber-950 text-xs font-black px-2 py-0.5 rounded-full">
                              قيد المراجعة
                            </span>
                          </div>
                          <p className="text-slate-500 text-xs">{m.legalName}</p>
                          <p className="text-slate-700 font-bold text-xs">
                            📍 {m.country} - {m.city} | 📖 الرواية: {m.riwayaRequired}
                          </p>
                          <ContactBlock kind="mosque" id={m.id} canView variant="inline" lockedText="—" />
                          <p className="text-slate-600 text-xs pt-1">{m.details}</p>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-sky-200/70">
                          <button
                            onClick={() => messageTo('mosque', m.id)}
                            className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>مراسلة</span>
                          </button>
                          <button
                            onClick={() => onEditMosque(m)}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>
                          <button
                            onClick={() => onSetMosqueApproval(m, 'approved')}
                            className="bg-sky-600 hover:bg-sky-500 text-white font-black px-4 py-1.5 rounded-xl text-xs shadow flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>موافقة واعتماد النشر</span>
                          </button>
                          <button
                            onClick={() => onSetMosqueApproval(m, 'rejected')}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>رفض</span>
                          </button>
                          <button
                            onClick={() => onDeleteMosque(m)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 font-bold px-2.5 py-1.5 rounded-xl text-xs cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL IMAMS MANAGEMENT */}
      {activeTab === 'all_imams' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2 border-b pb-3">
            <h3 className="font-black text-base text-slate-900">
              جميع الأئمة المسجلين ({imams.length}) — تحكم كامل للمدير
            </h3>
            <button
              onClick={onOpenImamAdd}
              className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
            >
              ➕ إضافة إمام جديد
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {imams.map((imam) => (
              <div
                key={imam.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={getSafeImamAvatar(imam.photo)}
                    alt={imam.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-emerald-600 shrink-0"
                  />
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <h4 className="font-black text-sm text-slate-900 font-amiri">{imam.name}</h4>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          imam.approvalStatus === 'pending'
                            ? 'bg-amber-200 text-amber-950'
                            : imam.approvalStatus === 'rejected'
                            ? 'bg-red-100 text-red-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {imam.approvalStatus === 'pending'
                          ? '⏳ بانتظار الموافقة'
                          : imam.approvalStatus === 'rejected'
                          ? '✖ مرفوض'
                          : '✅ معتمد ومنشور'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs">
                      📍 {imam.country} • الرواية: {imam.riwaya}
                    </p>
                    <ContactBlock kind="imam" id={imam.id} canView variant="inline" lockedText="—" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  {imam.approvalStatus !== 'approved' && (
                    <button
                      onClick={() => onSetImamApproval(imam.id, 'approved')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                    >
                      ✅ موافقة واعتماد
                    </button>
                  )}
                  <button
                    onClick={() => onViewImamFull(imam)}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                  >
                    عرض الملف
                  </button>
                  <button
                            onClick={() => messageTo('imam', imam.id)}
                            className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>مراسلة</span>
                          </button>
                          <button
                    onClick={() => onEditImam(imam)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                  >
                    ✏️ تعديل البيانات
                  </button>
                  <button
                    onClick={() => onDeleteImam(imam)}
                    className="bg-red-100 hover:bg-red-200 text-red-700 font-bold px-2.5 py-1.5 rounded-xl text-xs cursor-pointer"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ALL MOSQUES MANAGEMENT */}
      {activeTab === 'all_mosques' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2 border-b pb-3">
            <h3 className="font-black text-base text-slate-900">
              جميع المساجد والجمعيات المسجلة ({mosques.length}) — تحكم كامل للمدير
            </h3>
            <button
              onClick={onOpenMosqueAdd}
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
            >
              ➕ إضافة مسجد جديد
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mosques.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <h4 className="font-black text-sm text-slate-900 font-amiri">{m.mosqueName}</h4>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        m.approvalStatus === 'pending'
                          ? 'bg-amber-200 text-amber-950'
                          : m.approvalStatus === 'rejected'
                          ? 'bg-red-100 text-red-900'
                          : m.activeState === 'closed'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-sky-100 text-sky-900'
                      }`}
                    >
                      {m.approvalStatus === 'pending'
                        ? '⏳ بانتظار الموافقة'
                        : m.approvalStatus === 'rejected'
                        ? '✖ مرفوض'
                        : m.activeState === 'closed'
                        ? '⏸️ متوقف'
                        : '✅ معتمد ونشط'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs">
                    📍 {m.country} - {m.city} | 📖 {m.riwayaRequired}
                  </p>
                  <ContactBlock kind="mosque" id={m.id} canView variant="inline" lockedText="—" />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  {m.approvalStatus !== 'approved' && (
                    <button
                      onClick={() => onSetMosqueApproval(m, 'approved')}
                      className="bg-sky-600 hover:bg-sky-500 text-white font-black px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                    >
                      ✅ موافقة واعتماد
                    </button>
                  )}
                  <button
                            onClick={() => messageTo('mosque', m.id)}
                            className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>مراسلة</span>
                          </button>
                          <button
                    onClick={() => onEditMosque(m)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                  >
                    ✏️ تعديل المسجد
                  </button>
                  <button
                    onClick={() => onToggleMosqueActive(m)}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                  >
                    {m.activeState === 'closed' ? 'تفعيل' : 'إيقاف'}
                  </button>
                  <button
                    onClick={() => onDeleteMosque(m)}
                    className="bg-red-100 hover:bg-red-200 text-red-700 font-bold px-2.5 py-1.5 rounded-xl text-xs cursor-pointer"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: REPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900 border-b pb-3">
            بلاغات عدم التفرغ والملاحظات الواردة للإدارة ({reports.length})
          </h3>
          {reports.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">لا توجد بلاغات مسجلة حتى الآن.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-2xl border border-red-200 bg-red-50/50 flex flex-wrap justify-between items-center gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded-full">
                        {rep.targetType === 'imam' ? 'بلاغ عن إمام' : rep.targetType === 'mosque' ? 'بلاغ عن مسجد' : rep.targetType === 'post' ? 'بلاغ عن منشور' : 'بلاغ عن تعليق'}
                      </span>
                      {rep.targetType === 'post' || rep.targetType === 'comment' ? (
                        <a href={`#/community/post/${rep.targetId.split('/')[0]}`} className="font-black text-emerald-800 underline">{rep.targetName}</a>
                      ) : (
                        <h4 className="font-black text-slate-900">{rep.targetName}</h4>
                      )}
                      <span className="text-xs text-slate-400">{formatDate(rep.reportedAt, true)}</span>
                    </div>
                    <p className="font-bold text-red-900">السبب: {rep.reason}</p>
                    {rep.details && <p className="text-slate-600">{rep.details}</p>}
                  </div>
                  <div>
                    {rep.status === 'pending' ? (
                      <button
                        onClick={() => onResolveReport(rep.id)}
                        className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-3.5 py-2 rounded-xl text-xs cursor-pointer"
                      >
                        ✓ تأكيد المراجعة والمعالجة
                      </button>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-xs">
                        تمت المعالجة ✓
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: VISITOR MESSAGES & SUGGESTIONS */}
      {activeTab === 'feedback' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900 border-b pb-3">
            رسائل الزوار والاقتراحات ({feedback.length})
          </h3>
          {feedback.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">لا توجد رسائل بعد.</p>
          ) : (
            <div className="space-y-3">
              {feedback.map((f) => (
                <div
                  key={f.id}
                  className={`p-4 rounded-2xl border text-sm space-y-2 ${
                    f.status === 'new' ? 'border-sky-300 bg-sky-50/60' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-sky-700 text-white text-xs font-black px-2 py-0.5 rounded-full">
                      {f.kind === 'suggestion' ? 'اقتراح' : f.kind === 'problem' ? 'مشكلة تقنية' : 'رسالة'}
                    </span>
                    <span className="font-black text-slate-900">{f.name || 'زائر بدون اسم'}</span>
                    {f.email && (
                      <a href={`mailto:${f.email}`} dir="ltr" className="text-sky-800 underline">
                        {f.email}
                      </a>
                    )}
                    <span className="text-xs text-slate-400">{formatDate(f.createdAt, true)}</span>
                    {f.senderUid && <span className="text-xs text-emerald-700 font-bold">(مستخدم مسجل)</span>}
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{f.message}</p>
                  <div className="flex gap-2">
                    {f.status === 'new' ? (
                      <button
                        onClick={() => onFeedbackHandled(f.id)}
                        className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs cursor-pointer"
                      >
                        ✓ تمت المعالجة
                      </button>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-xs">تمت المعالجة ✓</span>
                    )}
                    <button
                      onClick={() => onDeleteFeedback(f.id)}
                      className="text-red-600 hover:bg-red-50 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ADMIN INBOX */}
      {/* TAB 6: VISIT STATISTICS (admins only) */}
      {activeTab === 'visits' && <VisitStatsPanel />}

      {activeTab === 'inbox' && <InboxCenter currentRole="admin" {...inbox} composeRequest={composeRequest} onComposeOpened={() => setComposeRequest(null)} />}
    </section>
  );
};
