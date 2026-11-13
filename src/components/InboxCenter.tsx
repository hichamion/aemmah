import React, { useEffect, useState } from 'react';
import { ADMIN_INBOX, PlatformMessage, ImamProfile, MosqueJob } from '../types';
import type { NewMessage } from '../lib/db';
import { formatDate } from '../utils/helpers';
import {
  Send,
  ShieldCheck,
  Trash2,
  Reply,
  Plus,
  Calendar,
  X,
  Loader2,
} from 'lucide-react';

export interface InboxProps {
  currentUid: string;
  currentName: string;
  messages: PlatformMessage[];
  recipientImams: ImamProfile[];
  recipientMosques: MosqueJob[];
  onSendMessage: (msg: NewMessage) => Promise<boolean>;
  onMarkAsRead: (messageId: string) => void;
  onDeleteMessage: (messageId: string) => void;
  /** Admin only: sends one message to each recipient (e.g. "all imams") and reports once. */
  onBroadcast?: (msgs: NewMessage[]) => Promise<boolean>;
}

interface InboxCenterProps extends InboxProps {
  currentRole: 'imam' | 'mosque' | 'admin';
  /** Opens the compose window for this recipient; `seq` changes on every request. */
  composeRequest?: { type: 'imam' | 'mosque'; id: string; seq: number } | null;
  onComposeOpened?: () => void;
}

/** Recipient id meaning "everyone of this type" (admin broadcast). */
const ALL = '__all__';

type RecipientType = 'mosque' | 'imam' | 'admin';

export const InboxCenter: React.FC<InboxCenterProps> = ({
  currentRole,
  currentUid,
  currentName,
  messages,
  recipientImams,
  recipientMosques,
  onSendMessage,
  onMarkAsRead,
  onDeleteMessage,
  onBroadcast,
  composeRequest,
  onComposeOpened,
}) => {
  // Messages are already limited by the Firestore query to those this account may read.
  const userMessages = messages;

  const isIncoming = (m: PlatformMessage) =>
    m.receiverUid === currentUid || (currentRole === 'admin' && m.receiverUid === ADMIN_INBOX);
  const isSentByMe = (m: PlatformMessage) => m.senderUid === currentUid;

  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'admin' | 'interview' | 'unread'>('all');
  const [replyText, setReplyText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [sending, setSending] = useState(false);

  const defaultRecipientType: RecipientType = currentRole === 'imam' ? 'mosque' : currentRole === 'mosque' ? 'imam' : 'imam';
  const [newRecipientType, setNewRecipientType] = useState<RecipientType>(defaultRecipientType);
  const [newRecipientId, setNewRecipientId] = useState<string>('');
  const [newSubject, setNewSubject] = useState('');
  const [newContent, setNewContent] = useState('');

  // Opened from elsewhere (e.g. the "مراسلة" button in the admin panel) with a recipient already chosen.
  useEffect(() => {
    if (!composeRequest) return;
    setNewRecipientType(composeRequest.type);
    setIsComposing(true);
    // After the type effect below has run, select the requested recipient.
    window.setTimeout(() => setNewRecipientId(composeRequest.id), 0);
    onComposeOpened?.();
  }, [composeRequest?.seq]);

  // Pick a valid default recipient whenever the list or type changes.
  useEffect(() => {
    if (newRecipientType === 'mosque') setNewRecipientId(recipientMosques[0]?.id || '');
    else if (newRecipientType === 'imam') setNewRecipientId(recipientImams[0]?.id || '');
    else setNewRecipientId('');
  }, [newRecipientType, recipientMosques.length, recipientImams.length]);

  const filteredMessages = userMessages.filter((m) => {
    if (filterType === 'admin') return m.senderType === 'admin' || m.receiverType === 'admin';
    if (filterType === 'interview') return m.category === 'interview';
    if (filterType === 'unread') return !m.isRead && isIncoming(m);
    return true;
  });

  const selectedMessage = userMessages.find((m) => m.id === selectedMessageId) || filteredMessages[0];

  // Mark the message shown in the detail pane as read.
  useEffect(() => {
    if (selectedMessage && !selectedMessage.isRead && isIncoming(selectedMessage)) {
      onMarkAsRead(selectedMessage.id);
    }
  }, [selectedMessage?.id]);

  const handleSelectMessage = (msg: PlatformMessage) => {
    setSelectedMessageId(msg.id);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedMessage) return;

    // Reply goes to the other participant of the conversation.
    const incoming = isIncoming(selectedMessage);
    const otherUid = incoming ? selectedMessage.senderUid : selectedMessage.receiverUid;
    const otherType = incoming ? selectedMessage.senderType : selectedMessage.receiverType;
    const otherName = incoming ? selectedMessage.senderName : selectedMessage.receiverName;

    // Messages to the administration always go to the shared admin inbox.
    const receiverUid = otherType === 'admin' && currentRole !== 'admin' ? ADMIN_INBOX : otherUid;
    if (!receiverUid || receiverUid === currentUid) return;

    setSending(true);
    const ok = await onSendMessage({
      senderUid: currentUid,
      senderType: currentRole,
      senderName: currentName,
      receiverUid,
      receiverType: otherType,
      receiverName: otherName,
      subject: selectedMessage.subject.startsWith('رد: ') ? selectedMessage.subject : `رد: ${selectedMessage.subject}`,
      content: replyText,
      category: selectedMessage.category,
      relatedMosqueId: selectedMessage.relatedMosqueId,
      relatedImamId: selectedMessage.relatedImamId,
    });
    setSending(false);
    if (ok) setReplyText('');
  };

  const handleSendNewMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newContent.trim()) return;

    let receiverUid = ADMIN_INBOX;
    let receiverName = 'إدارة منصة أئمة';
    let relatedMosqueId: string | undefined;
    let relatedImamId: string | undefined;

    // Admin broadcast: one message per account (an owner of several mosques gets it once).
    if (currentRole === 'admin' && newRecipientId === ALL && onBroadcast && newRecipientType !== 'admin') {
      const targets = new Map<string, { uid: string; name: string; imamId?: string; mosqueId?: string }>();
      if (newRecipientType === 'imam') recipientImams.forEach((im) => targets.set(im.ownerUid, { uid: im.ownerUid, name: im.name, imamId: im.id }));
      else recipientMosques.forEach((m) => targets.set(m.ownerUid, { uid: m.ownerUid, name: m.mosqueName, mosqueId: m.id }));
      targets.delete(currentUid);
      if (targets.size === 0) return;
      setSending(true);
      const ok = await onBroadcast(
        Array.from(targets.values()).map((t) => ({
          senderUid: currentUid,
          senderType: 'admin',
          senderName: currentName,
          receiverUid: t.uid,
          receiverType: newRecipientType,
          receiverName: t.name,
          subject: newSubject,
          content: newContent,
          category: 'admin_alert',
          relatedMosqueId: t.mosqueId,
          relatedImamId: t.imamId,
        }))
      );
      setSending(false);
      if (ok) {
        setIsComposing(false);
        setNewSubject('');
        setNewContent('');
      }
      return;
    }

    if (newRecipientType === 'mosque') {
      const m = recipientMosques.find((x) => x.id === newRecipientId);
      if (!m) return;
      receiverUid = m.ownerUid;
      receiverName = m.mosqueName;
      relatedMosqueId = m.id;
    } else if (newRecipientType === 'imam') {
      const im = recipientImams.find((x) => x.id === newRecipientId);
      if (!im) return;
      receiverUid = im.ownerUid;
      receiverName = im.name;
      relatedImamId = im.id;
    }
    if (receiverUid === currentUid) return;

    setSending(true);
    const ok = await onSendMessage({
      senderUid: currentUid,
      senderType: currentRole,
      senderName: currentName,
      receiverUid,
      receiverType: newRecipientType,
      receiverName,
      subject: newSubject,
      content: newContent,
      category: currentRole === 'admin' ? 'admin_alert' : 'direct_inquiry',
      relatedMosqueId,
      relatedImamId,
    });
    setSending(false);
    if (ok) {
      setIsComposing(false);
      setNewSubject('');
      setNewContent('');
    }
  };

  const unreadCount = userMessages.filter((m) => !m.isRead && isIncoming(m)).length;

  // Which recipient types this role may write to.
  const recipientOptions: { type: RecipientType; label: string }[] =
    currentRole === 'imam'
      ? [{ type: 'mosque', label: '🕌 إلى مسجد' }, { type: 'admin', label: '🛡️ إدارة منصة أئمة' }]
      : currentRole === 'mosque'
      ? [{ type: 'imam', label: '🎙️ إلى إمام' }, { type: 'admin', label: '🛡️ إدارة منصة أئمة' }]
      : [{ type: 'imam', label: '🎙️ إلى إمام' }, { type: 'mosque', label: '🕌 إلى مسجد' }];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-7 shadow-sm space-y-6">
      
      {/* Header of Inbox */}
      <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-900 border border-amber-400/40 flex items-center justify-center text-xl font-bold">
            📬
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 font-amiri">
                علبة الرسائل والمراسلات الرسمية
              </h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full animate-pulse">
                  {unreadCount} رسائل جديدة
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              التواصل المباشر بين الأئمة وإدارات المساجد، وإشعارات التوثيق من إدارة منصة أئمة
            </p>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsComposing(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>كتابة رسالة جديدة</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
            filterType === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          جميع الرسائل ({userMessages.length})
        </button>

        <button
          onClick={() => setFilterType('unread')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
            filterType === 'unread'
              ? 'bg-red-600 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <span>غير المقروءة</span>
          {unreadCount > 0 && (
            <span className="bg-red-200 text-red-950 text-xs px-1.5 py-0.2 rounded-full font-black">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setFilterType('admin')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
            filterType === 'admin'
              ? 'bg-emerald-800 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>رسائل إدارة منصة أئمة</span>
        </button>

        <button
          onClick={() => setFilterType('interview')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
            filterType === 'interview'
              ? 'bg-purple-800 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-purple-300" />
          <span>دعوات المقابلات</span>
        </button>
      </div>

      {/* Main Inbox Layout: 2 Columns (List + Detail) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[460px]">
        
        {/* Left / Message List Column */}
        <div className="lg:col-span-5 border border-slate-200 rounded-2xl overflow-hidden flex flex-col bg-slate-50">
          <div className="p-3 bg-white border-b border-slate-200 text-slate-600 font-bold text-xs flex justify-between items-center">
            <span>صندوق المحادثات ({filteredMessages.length})</span>
            <span className="text-xs text-slate-400">مرتبة حسب الأحدث</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[500px] divide-y divide-slate-200">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                لا توجد رسائل في هذا التبويب.
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                const isUnread = !msg.isRead && isIncoming(msg);
                const isAdmin = msg.senderType === 'admin';
                const sentByMe = isSentByMe(msg);

                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`p-3.5 cursor-pointer transition text-xs space-y-1.5 ${
                      isSelected
                        ? 'bg-amber-50/90 border-r-4 border-amber-500'
                        : isUnread
                        ? 'bg-white font-semibold'
                        : 'bg-slate-50 hover:bg-white text-slate-600'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <div className="flex items-center gap-1.5">
                        {isAdmin ? (
                          <span className="bg-emerald-900 text-amber-300 text-xs px-2 py-0.5 rounded font-black flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-amber-400" />
                            إدارة منصة أئمة
                          </span>
                        ) : sentByMe ? (
                          <span className="bg-blue-100 text-blue-900 text-xs px-2 py-0.5 rounded font-bold">
                            صادرة منك ← {msg.receiverName}
                          </span>
                        ) : (
                          <span className="bg-slate-200 text-slate-800 text-xs px-2 py-0.5 rounded font-bold">
                            {/* The account type is checked by the security rules; the name is free text. */}
                            من: {msg.senderName} ({msg.senderType === 'mosque' ? 'مسجد' : 'إمام'})
                          </span>
                        )}
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">
                        {formatDate(msg.sentAt)}
                      </span>
                    </div>

                    <h5 className={`font-bold text-slate-900 line-clamp-1 ${isUnread ? 'font-black' : ''}`}>
                      {msg.subject}
                    </h5>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right / Message Detail Column */}
        <div className="lg:col-span-7 border border-slate-200 rounded-2xl p-5 md:p-6 flex flex-col justify-between bg-white space-y-5">
          {selectedMessage ? (
            <div className="space-y-5 flex-1 flex flex-col justify-between">
              
              {/* Message Header */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div className="space-y-1">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black ${
                      selectedMessage.senderType === 'admin'
                        ? 'bg-emerald-900 text-amber-300'
                        : selectedMessage.category === 'interview'
                        ? 'bg-purple-100 text-purple-900 border border-purple-200'
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {selectedMessage.senderType === 'admin'
                        ? '🛡️ رسالة رسمية من إدارة منصة أئمة'
                        : selectedMessage.category === 'interview'
                        ? '🗓️ دعوة لمقابلة رسمية'
                        : '💬 استفسار ومراسلة مباشرة'}
                    </span>
                    <h4 className="text-base font-black text-slate-900 font-amiri pt-1">
                      {selectedMessage.subject}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onDeleteMessage(selectedMessage.id)}
                      title="حذف الرسالة"
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-wrap justify-between items-center gap-2 text-xs text-slate-600">
                  <p>
                    <strong>المرسل:</strong> {selectedMessage.senderName} ({selectedMessage.senderType === 'admin' ? 'الإدارة' : selectedMessage.senderType === 'imam' ? 'إمام' : 'مسجد'})
                    {' ← '}
                    <strong>إلى:</strong> {selectedMessage.receiverName}
                  </p>
                  <p>
                    <strong>التاريخ:</strong> {formatDate(selectedMessage.sentAt, true)}
                  </p>
                </div>
              </div>

              {/* Message Body */}
              <div className="flex-1 py-2 text-slate-800 text-xs sm:text-sm leading-relaxed space-y-3 whitespace-pre-line">
                {selectedMessage.content}
              </div>

              {/* Quick Reply Form */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Reply className="w-3.5 h-3.5 text-amber-600" />
                  <span>الرد السريع على هذه المراسلة:</span>
                </h5>
                <form onSubmit={handleSendReply} className="space-y-2">
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="اكتب ردك هنا..."
                    className="w-full border border-slate-300 rounded-xl p-3 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
                  ></textarea>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!replyText.trim() || sending}
                      className={`font-black px-5 py-2 rounded-xl text-xs shadow transition flex items-center gap-1.5 cursor-pointer ${
                        replyText.trim()
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>إرسال الرد</span>
                    </button>
                  </div>
                </form>
              </div>

            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              حدد رسالة من القائمة لعرض تفاصيلها.
            </div>
          )}
        </div>

      </div>

      {/* Compose Message Modal */}
      {isComposing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-7 shadow-2xl my-8 text-xs space-y-5 animate-fadeIn">
            
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-lg font-bold">
                  ✉️
                </span>
                <h4 className="text-base font-black text-slate-900 font-amiri">
                  كتابة رسالة جديدة
                </h4>
              </div>
              <button
                onClick={() => setIsComposing(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendNewMessage} className="space-y-4">
              
              {/* Recipient Selection */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">إلى من تريد إرسال الرسالة؟ *</label>
                <div className="grid grid-cols-2 gap-2">
                  {recipientOptions.map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setNewRecipientType(opt.type)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                        newRecipientType === opt.type ? 'border-amber-500 bg-amber-50 text-slate-900' : 'border-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Dropdown (if mosque or imam) */}
              {newRecipientType === 'mosque' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اختر المسجد المستقبل *</label>
                  <select
                    value={newRecipientId}
                    onChange={(e) => setNewRecipientId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white font-bold"
                  >
                    {recipientMosques.length === 0 && <option value="">لا توجد مساجد متاحة</option>}
                    {currentRole === 'admin' && recipientMosques.length > 1 && (
                      <option value={ALL}>📢 جميع المساجد ({recipientMosques.length})</option>
                    )}
                    {recipientMosques.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.mosqueName} ({m.city} — {m.country})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {newRecipientType === 'imam' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اختر الإمام المستقبل *</label>
                  <select
                    value={newRecipientId}
                    onChange={(e) => setNewRecipientId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white font-bold"
                  >
                    {recipientImams.length === 0 && <option value="">لا يوجد أئمة متاحون</option>}
                    {currentRole === 'admin' && recipientImams.length > 1 && (
                      <option value={ALL}>📢 جميع الأئمة ({recipientImams.length})</option>
                    )}
                    {recipientImams.map((im) => (
                      <option key={im.id} value={im.id}>
                        {im.name} ({im.country}) - {im.riwaya}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">موضوع الرسالة *</label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="مثال: استفسار عن موعد المقابلة / طلب أوراق إضافية..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">نص الرسالة بالتفصيل *</label>
                <textarea
                  required
                  rows={4}
                  maxLength={5000}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="اكتب رسالتك واستفسارك هنا..."
                  className="w-full border border-slate-300 rounded-xl p-3 bg-white leading-relaxed"
                ></textarea>
              </div>

              {/* Form buttons */}
              <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={sending || (newRecipientType !== 'admin' && !newRecipientId)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-2 rounded-xl shadow cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>إرسال الرسالة الآن</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
