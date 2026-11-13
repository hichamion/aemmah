import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Bell, BookMarked, FilePenLine, Image as ImageIcon, Loader2, MessageCircle, MessagesSquare, Mic, Pin, Plus, Settings2, Users } from 'lucide-react';
import { CommunityPost, PostComment, PostType } from '../../types/community';
import { ImamProfile } from '../../types';
import {
  deletePost,
  markNotificationsRead,
  clearNotifications,
  moderatePost,
  postTypeIcon,
  postTypeLabel,
  toggleSaved,
  useCommunityPosts,
  useCommunitySettings,
  useNotifications,
  useSaved,
} from '../../lib/community';
import { excerpt } from '../../lib/richtext';
import { createReport } from '../../lib/db';
import { firstNameOf } from '../../utils/helpers';
import { scrollToTop } from '../../lib/scroll';
import { AuthorAvatar, CARD, CommunityViewer, ImageGrid, PollBox, PostMenu, ReactionBar, timeAgo } from './PostParts';
import { CommunitySidebar, SidebarTab, TopicsPanel } from './CommunitySidebar';
import { PostActions, PostDetail } from './PostDetail';
import { PostComposer } from './PostComposer';
import { CommunityAdmin } from './CommunityAdmin';

type Tab = 'feed' | 'saved' | 'drafts' | 'admin';
type Route = { tab: Tab; postId?: string };

const parseRoute = (hash: string): Route => {
  const m = hash.match(/^#\/community\/post\/([\w-]+)/);
  if (m) return { tab: 'feed', postId: m[1] };
  // Removed sections (#/community/library, #/community/hadith) open the wall.
  const t = hash.match(/^#\/community\/(saved|drafts|admin)/)?.[1] as Tab | undefined;
  return { tab: t || 'feed' };
};
const go = (path: string) => {
  window.location.hash = `#/community${path}`;
  // After the new section is drawn (see App: scrolling first keeps the old position).
  requestAnimationFrame(() => requestAnimationFrame(() => scrollToTop(false)));
};

interface Props {
  uid: string | null;
  role: 'visitor' | 'imam' | 'mosque' | 'admin';
  viewerName: string;
  myImam: ImamProfile | null;
  imams: ImamProfile[];
  onOpenAuthModal: () => void;
  onToast: (msg: string, kind?: 'success' | 'error') => void;
}

export const CommunityPage: React.FC<Props> = ({ uid, role, viewerName, myImam, imams, onOpenAuthModal, onToast }) => {
  const isAdmin = role === 'admin';
  const isMember = !!uid && (isAdmin || role === 'imam');
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const settings = useCommunitySettings(isMember);
  const { posts, loading, error } = useCommunityPosts(uid, isMember);
  const saved = useSaved(uid, isMember);
  const notifications = useNotifications(uid, isMember);
  const unread = notifications.filter((n) => !n.read).length;

  const imamsById = useMemo(() => new Map(imams.map((i) => [i.id, i])), [imams]);
  const viewer: CommunityViewer = {
    uid: uid || '',
    name: isAdmin ? 'إدارة منصة أئمة' : myImam?.name || viewerName,
    imamId: isAdmin ? '' : myImam?.id || '',
    isAdmin,
    canInteract: isAdmin || myImam?.approvalStatus === 'approved',
  };

  const [composer, setComposer] = useState<{ open: boolean; type?: PostType; existing: CommunityPost | null }>({ open: false, existing: null });
  const [showBell, setShowBell] = useState(false);
  // Escape closes the notifications list.
  useEffect(() => {
    if (!showBell) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShowBell(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showBell]);

  // ---------------- gate ----------------
  if (!isMember) {
    return (
      <section className="relative flex-1 max-w-2xl mx-auto w-full px-4 py-16 text-center space-y-5">
        <CommunityPhoto />
        <div className="bg-white/90 backdrop-blur rounded-3xl p-8 space-y-5 shadow-xl">
        <MessagesSquare className="w-14 h-14 mx-auto text-emerald-700" />
        <h1 className="text-3xl font-black font-amiri text-slate-900">ملتقى الأئمة</h1>
        <p className="text-slate-600 leading-relaxed">مساحة تواصل مهنية وعلمية خاصة بالأئمة المسجلين في منصة أئمة: خطب ودروس، ومقالات، ونقاشات، وتجارب دعوية.</p>
        {role === 'visitor' ? (
          <button onClick={onOpenAuthModal} className="bg-emerald-800 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-full cursor-pointer">تسجيل الدخول كإمام</button>
        ) : (
          <p className="text-sm text-slate-500">الملتقى متاح لحسابات الأئمة فقط.</p>
        )}
        </div>
      </section>
    );
  }

  // ---------------- actions ----------------
  const actions: PostActions = {
    onEdit: (p) => setComposer({ open: true, existing: p }),
    onDelete: async (p) => {
      if (!window.confirm('حذف هذا المنشور نهائياً؟')) return;
      try {
        await deletePost(p);
        onToast('تم حذف المنشور.');
        if (route.postId === p.id) go('');
      } catch {
        onToast('تعذر حذف المنشور.', 'error');
      }
    },
    onPin: async (p) => {
      try {
        await moderatePost(p, { pinned: !p.pinned });
        onToast(p.pinned ? 'أُلغي التثبيت.' : 'تم تثبيت المنشور.');
      } catch {
        onToast('تعذر تنفيذ الإجراء.', 'error');
      }
    },
    onReport: async (p: CommunityPost, c?: PostComment) => {
      const reason = window.prompt(c ? 'سبب الإبلاغ عن التعليق:' : 'سبب الإبلاغ عن المنشور:');
      if (!reason?.trim()) return;
      try {
        await createReport({
          targetType: c ? 'comment' : 'post',
          targetId: c ? `${p.id}/${c.id}` : p.id,
          targetName: c ? `تعليق على: ${p.title}` : p.title,
          reason: reason.trim(),
          details: c ? c.body.slice(0, 500) : '',
          reporterUid: viewer.uid,
          reporterRole: isAdmin ? 'admin' : 'imam',
        });
        onToast('تم إرسال البلاغ إلى الإدارة.');
      } catch {
        onToast('تعذر إرسال البلاغ.', 'error');
      }
    },
    onToggleSave: async (p) => {
      try {
        await toggleSaved(viewer.uid, p, saved.has(p.id));
      } catch {
        onToast('تعذر الحفظ.', 'error');
      }
    },
    onError: (m) => onToast(m, 'error'),
    onInfo: (m) => onToast(m),
  };

  const published = posts.filter((p) => p.status === 'published');
  const drafts = posts.filter((p) => p.status === 'draft' && p.authorUid === uid);
  const openPost = route.postId ? posts.find((p) => p.id === route.postId) : undefined;

  // ---------------- feed: pinned first, then newest ----------------
  const feed = [...published].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return (b.publishedAt || b.createdAt).localeCompare(a.publishedAt || a.createdAt);
  });
  const canPost = viewer.canInteract && (settings.postingEnabled || isAdmin);
  const firstName = isAdmin ? '' : firstNameOf(viewer.name);

  const tabs: SidebarTab[] = [
    { key: 'feed', label: 'الحائط', hint: 'أحدث الخطب والمقالات والنقاشات', icon: <MessagesSquare className="w-4 h-4" /> },
    { key: 'saved', label: 'محفوظاتي', hint: 'ما حفظته للرجوع إليه', icon: <BookMarked className="w-4 h-4" />, count: saved.size },
    { key: 'drafts', label: 'مسوداتي', hint: 'منشورات لم تُنشر بعد', icon: <FilePenLine className="w-4 h-4" />, count: drafts.length },
    ...(isAdmin ? [{ key: 'admin', label: 'الإشراف', hint: 'إعدادات الملتقى والنماذج', icon: <Settings2 className="w-4 h-4" /> }] : []),
  ];
  const activeTab = route.postId ? null : route.tab;
  const latest = [...published].sort((a, b) => (b.publishedAt || b.createdAt).localeCompare(a.publishedAt || a.createdAt)).slice(0, 6);

  const card = (p: CommunityPost) => <PostCard key={p.id} post={p} viewer={viewer} imams={imamsById} saved={saved.has(p.id)} actions={actions} />;

  const openTab = (k: string) => go(k === 'feed' ? '' : `/${k}`);

  return (
    <div className="relative flex-1 w-full">
      <CommunityPhoto />
      <section className="relative w-full max-w-6xl mx-auto sm:px-6 pb-8 sm:pt-6">
        {/* Top bar: title, new post, notifications (the list opens above everything) */}
        <header className="relative z-40 bg-white sm:rounded-2xl border-b sm:border border-slate-200 shadow-sm px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-kufi text-cedar-800 leading-tight">ملتقى الأئمة</h1>
            <p className="hidden sm:block text-sm text-slate-500">مساحة تواصل مهنية وعلمية خاصة بالأئمة المسجلين</p>
          </div>
          <div className="flex items-center gap-2">
            {canPost && (
              <button onClick={() => setComposer({ open: true, existing: null })}
                className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-black px-4 py-2.5 rounded-full cursor-pointer">
                <Plus className="w-4 h-4" /> منشور جديد
              </button>
            )}
            {canPost && (
              <button onClick={() => setComposer({ open: true, existing: null })} aria-label="منشور جديد"
                className="sm:hidden w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer">
                <Plus className="w-5 h-5" />
              </button>
            )}
            <div className="relative">
              <button
                onClick={() => { setShowBell((v) => !v); if (!showBell) markNotificationsRead(viewer.uid, notifications); }}
                aria-label={`الإشعارات${unread ? ` (${unread} جديد)` : ''}`}
                aria-expanded={showBell}
                className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center cursor-pointer transition ${showBell ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                <Bell className={`w-5 h-5 ${unread ? 'animate-[bell_1s_ease-in-out_2]' : ''}`} />
                {unread > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[11px] font-black min-w-5 h-5 px-1 rounded-full flex items-center justify-center ring-2 ring-white">{unread}</span>}
              </button>
              {showBell && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowBell(false)} aria-hidden />
                  <div role="dialog" aria-label="الإشعارات"
                    className="fixed sm:absolute inset-x-2 sm:inset-x-auto top-[4.5rem] sm:top-full sm:left-0 sm:mt-2 sm:w-96 z-50 bg-white text-slate-800 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.45)] ring-1 ring-black/10 overflow-hidden">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
                      <p className="font-black text-lg">الإشعارات</p>
                      {notifications.length > 0 && <button onClick={() => clearNotifications(viewer.uid)} className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer">مسح الكل</button>}
                    </div>
                    {notifications.length === 0 && <p className="text-sm text-slate-500 px-4 py-8 text-center">لا توجد إشعارات بعد.</p>}
                    <ul className="max-h-[60vh] overflow-y-auto p-1.5">
                      {notifications.map((n) => (
                        <li key={n.id}>
                          <button onClick={() => { setShowBell(false); go(`/post/${n.postId}`); }}
                            className={`w-full text-right flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 text-sm cursor-pointer ${n.read ? '' : 'bg-emerald-50'}`}>
                            <span className="w-10 h-10 shrink-0 rounded-full bg-emerald-700 text-white flex items-center justify-center"><MessageCircle className="w-5 h-5" /></span>
                            <span className="flex-1 min-w-0">
                              <span className="block leading-snug"><b>{n.fromName}</b> {n.type === 'reply' ? 'ردّ على تعليقك في' : 'علّق على منشورك'} «{n.postTitle}»</span>
                              <span className={`block text-xs mt-0.5 ${n.read ? 'text-slate-500' : 'text-emerald-700 font-bold'}`}>{timeAgo(n.createdAt)}</span>
                            </span>
                            {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-2 shrink-0" aria-label="جديد" />}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Phones / tablets: tab bar with icons (larger screens use the side menu) */}
        <nav aria-label="أقسام الملتقى" className="lg:hidden bg-white border-b border-slate-200 flex mb-2 sm:mb-4 sm:rounded-2xl sm:border sm:mt-3">
          {tabs.map((t) => {
            const on = activeTab === t.key;
            return (
              <button key={t.key} onClick={() => openTab(t.key)} aria-current={on ? 'page' : undefined}
                className={`relative flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold cursor-pointer transition ${on ? 'text-emerald-800' : 'text-slate-500 hover:bg-slate-50'}`}>
                <span className="relative [&>svg]:w-[22px] [&>svg]:h-[22px]">
                  {t.icon}
                  {!!t.count && <span className="absolute -top-1.5 -left-2.5 bg-slate-200 text-slate-700 text-[10px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center">{t.count}</span>}
                </span>
                {t.label}
                {on && <span className="absolute bottom-0 inset-x-4 h-[3px] rounded-t-full bg-emerald-700" aria-hidden />}
              </button>
            );
          })}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_260px] gap-5 items-start lg:mt-5">
          <div className="hidden lg:block">
            <CommunitySidebar tabs={tabs} active={activeTab} onTab={openTab} />
          </div>

          <main key={route.postId || route.tab} className="cm-enter space-y-2 sm:space-y-4 min-w-0">
            {error && <p className="bg-red-50 text-red-800 border border-red-200 sm:rounded-2xl p-3 text-sm">تعذر تحميل الملتقى ({error}).</p>}

            {route.postId ? (
              openPost ? (
                <PostDetail post={openPost} viewer={viewer} imams={imamsById} saved={saved.has(openPost.id)} actions={actions} onBack={() => go('')} />
              ) : (
                <p className={`${CARD} p-8 text-center text-slate-500`}>{loading ? 'جاري التحميل…' : 'هذا المنشور غير موجود أو حُذف.'}</p>
              )
            ) : route.tab === 'admin' && isAdmin ? (
              <CommunityAdmin settings={settings} onDone={(m) => onToast(m)} onError={(m) => onToast(m, 'error')} />
            ) : route.tab === 'saved' ? (
              <>
                <h2 className="font-black text-lg text-slate-900 px-4 sm:px-0 pt-2">محفوظاتي</h2>
                {published.filter((p) => saved.has(p.id)).length === 0 ? (
                  <p className={`${CARD} p-8 text-center text-slate-500`}>لم تحفظ أي منشور بعد. اضغط «⋯» على منشور ثم «حفظ المنشور».</p>
                ) : (
                  published.filter((p) => saved.has(p.id)).map(card)
                )}
              </>
            ) : route.tab === 'drafts' ? (
              <>
                <h2 className="font-black text-lg text-slate-900 px-4 sm:px-0 pt-2">مسوداتي</h2>
                {drafts.length === 0 && <p className={`${CARD} p-8 text-center text-slate-500`}>لا توجد مسودات.</p>}
                {drafts.map((p) => (
                  <div key={p.id} className={`${CARD} p-4 flex items-center justify-between gap-3`}>
                    <div className="min-w-0">
                      <p className="font-black truncate">{p.title}</p>
                      <p className="text-xs text-slate-500">{postTypeLabel(p.type)} · آخر تعديل {timeAgo(p.updatedAt)}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => actions.onEdit(p)} className="bg-emerald-800 text-white text-sm font-bold px-4 py-2 rounded-full cursor-pointer">متابعة التحرير</button>
                      <button onClick={() => actions.onDelete(p)} className="text-red-700 text-sm font-bold px-3 py-2 cursor-pointer">حذف</button>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {/* «What's on your mind?» box */}
                {canPost ? (
                  <div className={`${CARD} px-4 pt-3 pb-1`}>
                    <div className="flex items-center gap-2.5">
                      <AuthorAvatar imamId={viewer.imamId} imams={imamsById} size="w-10 h-10" />
                      <button onClick={() => setComposer({ open: true, existing: null })}
                        className="flex-1 text-right bg-slate-100 hover:bg-slate-200 rounded-full px-4 py-2.5 text-slate-500 text-[15px] cursor-pointer transition">
                        بمَ تفكّر{firstName ? ` يا ${firstName}` : ''}؟
                      </button>
                    </div>
                    <div className="flex border-t border-slate-200 mt-3 pt-1">
                      {QUICK.map((q) => (
                        <button key={q.type} onClick={() => setComposer({ open: true, type: q.type, existing: null })}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-slate-100 text-[13px] sm:text-sm font-bold text-slate-600 cursor-pointer">
                          <span className={q.color}>{q.icon}</span> {q.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : viewer.canInteract ? (
                  <p className="bg-amber-50 border-y sm:border border-amber-200 text-amber-900 sm:rounded-2xl p-3 text-sm font-bold">النشر موقوف مؤقتاً من الإدارة. يمكنك الاطلاع والقراءة.</p>
                ) : (
                  <p className={`${CARD} p-3 text-sm text-slate-600`}>يمكنك الاطلاع على الملتقى. النشر والتفاعل متاحان بعد أن تعتمد الإدارة ملفك كإمام.</p>
                )}

                {loading ? (
                  <p className="text-center text-slate-500 py-10 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> جاري التحميل…</p>
                ) : feed.length === 0 ? (
                  <p className={`${CARD} p-10 text-center text-slate-500`}>لا توجد منشورات بعد. كن أول من ينشر.</p>
                ) : (
                  feed.map(card)
                )}
              </>
            )}
          </main>

          {/* Left column: latest topics */}
          <aside className="hidden xl:block space-y-4 xl:sticky xl:top-24">
            <TopicsPanel
              title="أحدث المواضيع"
              posts={latest}
              onOpen={(id) => go(`/post/${id}`)}
              footer={<span className="flex items-center gap-2"><Users className="w-4 h-4 text-emerald-700" /> {imams.length} إماماً على المنصة</span>}
            />
          </aside>
        </div>

        <PostComposer
          open={composer.open}
          initialType={composer.type}
          existing={composer.existing}
          settings={settings}
          author={{ uid: viewer.uid, name: viewer.name, imamId: viewer.imamId }}
          onClose={() => setComposer({ open: false, existing: null })}
          onSaved={(m, id) => { onToast(m); if (composer.existing?.status !== 'published') go(`/post/${id}`); }}
          onError={(m) => onToast(m, 'error')}
        />
      </section>
    </div>
  );
};

// ---------------------------------------------------------------------------

/** Golden mosque skyline behind the community (fixed while the posts scroll). */
const CommunityPhoto: React.FC = () => (
  <div className="community-photo" aria-hidden style={{ backgroundImage: `url(${import.meta.env.BASE_URL}bg-community.jpg)` }} />
);

const QUICK: { type: PostType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'field', label: 'صورة', icon: <ImageIcon className="w-5 h-5" />, color: 'text-emerald-600' },
  { type: 'khutba', label: 'خطبة', icon: <Mic className="w-5 h-5" />, color: 'text-sky-600' },
  { type: 'poll', label: 'استطلاع', icon: <BarChart3 className="w-5 h-5" />, color: 'text-amber-600' },
];

const PostCard: React.FC<{ post: CommunityPost; viewer: CommunityViewer; imams: Map<string, ImamProfile>; saved: boolean; actions: PostActions }> = ({
  post,
  viewer,
  imams,
  saved,
  actions,
}) => {
  const open = () => go(`/post/${post.id}`);
  const long = post.body.length > 260;
  return (
    <article className={CARD}>
      <header className="flex items-start gap-2.5 px-4 pt-3">
        <AuthorAvatar imamId={post.authorImamId} imams={imams} size="w-10 h-10" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[15px] text-slate-900 truncate">{post.authorName}</p>
          <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-1">
            <span>{timeAgo(post.publishedAt || post.createdAt)}</span>
            <span aria-hidden>·</span>
            <span>{postTypeIcon(post.type)} {postTypeLabel(post.type)}</span>
            {post.pinned && (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-0.5 text-amber-700 font-bold"><Pin className="w-3 h-3" /> مثبّت</span>
              </>
            )}
          </p>
        </div>
        <PostMenu
          post={post}
          viewer={viewer}
          saved={saved}
          onToggleSave={() => actions.onToggleSave(post)}
          onReport={() => actions.onReport(post)}
          onEdit={() => actions.onEdit(post)}
          onDelete={() => actions.onDelete(post)}
          onPin={() => actions.onPin(post)}
          onError={actions.onError}
        />
      </header>
      <button onClick={open} className="block text-right w-full cursor-pointer px-4 pt-2 pb-2">
        {post.title && <h2 className="font-black text-[17px] text-slate-900 leading-snug">{post.title}</h2>}
        {post.body.trim() && <p className="text-[15px] text-slate-800 leading-relaxed mt-1 whitespace-pre-line">{excerpt(post.body)}</p>}
        {long && <span className="text-sm font-bold text-slate-500 hover:underline">عرض المزيد</span>}
      </button>
      {post.images.length > 0 && <ImageGrid ids={post.images} flush />}
      {post.poll && <div className="px-4 pt-2"><PollBox post={post} viewer={viewer} onError={actions.onError} /></div>}
      {post.files.length > 0 && (
        <div className="px-4 pt-2">
          <button onClick={open} className="text-xs font-bold text-red-800 bg-red-50 px-3 py-1.5 rounded-full cursor-pointer">📎 {post.files.length} ملف PDF مرفق</button>
        </div>
      )}
      <div className="px-4 pb-1">
        <ReactionBar post={post} viewer={viewer} onComment={open} onError={actions.onError} onCopied={() => actions.onInfo('تم نسخ رابط المنشور.')} />
      </div>
    </article>
  );
};
