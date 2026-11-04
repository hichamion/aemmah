import React, { useEffect, useMemo, useState } from 'react';
import { Bell, BookMarked, FilePenLine, Loader2, MessagesSquare, Pin, ScrollText, Search, Settings2, SlidersHorizontal, Users } from 'lucide-react';
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
import { AuthorAvatar, CommunityViewer, ImageGrid, PollBox, PostTypeGrid, ReactionBar, timeAgo } from './PostParts';
import { CommunityBackdrop, CommunitySidebar, SidebarTab, TopicsPanel } from './CommunitySidebar';
import { HadithCheck } from './HadithCheck';
import { PostActions, PostDetail } from './PostDetail';
import { PostComposer } from './PostComposer';
import { CommunityAdmin } from './CommunityAdmin';

type Tab = 'feed' | 'hadith' | 'saved' | 'drafts' | 'admin';
type Route = { tab: Tab; postId?: string };

const parseRoute = (hash: string): Route => {
  const m = hash.match(/^#\/community\/post\/([\w-]+)/);
  if (m) return { tab: 'feed', postId: m[1] };
  // «مكتبة الأئمة» was removed: old links (#/community/library) open the wall.
  const t = hash.match(/^#\/community\/(hadith|saved|drafts|admin)/)?.[1] as Tab | undefined;
  return { tab: t || 'feed' };
};
const go = (path: string) => {
  window.location.hash = `#/community${path}`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Filters shown above the wall.
const FILTERS: { key: string; label: string; types: PostType[] | null }[] = [
  { key: 'all', label: 'الكل', types: null },
  { key: 'articles', label: 'المقالات', types: ['article'] },
  { key: 'questions', label: 'الأسئلة والنقاشات', types: ['question', 'poll'] },
  { key: 'learning', label: 'المواد التعليمية', types: ['khutba', 'event'] },
  { key: 'field', label: 'تجارب ميدانية', types: ['field'] },
];

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
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState<'new' | 'top'>('new');
  const [search, setSearch] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [category, setCategory] = useState('');
  const [author, setAuthor] = useState('');
  const [showBell, setShowBell] = useState(false);

  // ---------------- gate ----------------
  if (!isMember) {
    return (
      <section className="flex-1 max-w-2xl mx-auto w-full px-4 py-16 text-center space-y-5">
        <MessagesSquare className="w-14 h-14 mx-auto text-emerald-700" />
        <h1 className="text-3xl font-black font-amiri text-slate-900">ملتقى الأئمة</h1>
        <p className="text-slate-600 leading-relaxed">مساحة تواصل مهنية وعلمية خاصة بالأئمة المسجلين في منصة أئمة: خطب ودروس، ومقالات، ونقاشات، وتجارب دعوية.</p>
        {role === 'visitor' ? (
          <button onClick={onOpenAuthModal} className="bg-emerald-800 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-full cursor-pointer">تسجيل الدخول كإمام</button>
        ) : (
          <p className="text-sm text-slate-500">الملتقى متاح لحسابات الأئمة فقط.</p>
        )}
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

  // ---------------- feed list ----------------
  const q = search.trim().toLowerCase();
  const types = FILTERS.find((f) => f.key === filter)?.types;
  const feed = published
    .filter((p) => !types || types.includes(p.type))
    .filter((p) => !category || p.category === category)
    .filter((p) => !author || p.authorName.includes(author))
    .filter((p) => !q || `${p.title} ${p.body} ${p.authorName} ${p.category}`.toLowerCase().includes(q))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sort === 'top') {
        const d = b.likeCount + b.commentCount * 2 - (a.likeCount + a.commentCount * 2);
        if (d) return d;
      }
      return (b.publishedAt || b.createdAt).localeCompare(a.publishedAt || a.createdAt);
    });

  const tabs: SidebarTab[] = [
    { key: 'feed', label: 'الحائط', hint: 'أحدث الخطب والمقالات والنقاشات', icon: <MessagesSquare className="w-4 h-4" /> },
    { key: 'hadith', label: 'التحقق من صحة حديث', hint: 'البحث في الموسوعة الحديثية', icon: <ScrollText className="w-4 h-4" /> },
    { key: 'saved', label: 'محفوظاتي', hint: 'ما حفظته للرجوع إليه', icon: <BookMarked className="w-4 h-4" />, count: saved.size },
    { key: 'drafts', label: 'مسوداتي', hint: 'منشورات لم تُنشر بعد', icon: <FilePenLine className="w-4 h-4" />, count: drafts.length },
    ...(isAdmin ? [{ key: 'admin', label: 'الإشراف', hint: 'إعدادات الملتقى والنماذج', icon: <Settings2 className="w-4 h-4" /> }] : []),
  ];
  const activeTab = route.postId ? null : route.tab;
  const latest = [...published].sort((a, b) => (b.publishedAt || b.createdAt).localeCompare(a.publishedAt || a.createdAt)).slice(0, 6);

  const card = (p: CommunityPost) => <PostCard key={p.id} post={p} viewer={viewer} imams={imamsById} saved={saved.has(p.id)} actions={actions} />;

  return (
    <div className="community-bg relative flex-1 w-full">
    <CommunityBackdrop />
    <section className="relative flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-5">
      {/* Banner */}
      <header className="glass-card overflow-hidden bg-gradient-to-l from-[#2fbf7a] via-[#12804c] to-[#05472b] text-white rounded-[2rem] px-6 py-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-black font-amiri">ملتقى الأئمة</h1>
          <p className="text-sm text-green-50/90">مساحة تواصل مهنية وعلمية خاصة بالأئمة المسجلين</p>
        </div>
        <div className="relative z-10 flex items-center gap-2">
          <div className="relative">
            <button onClick={() => { setShowBell((v) => !v); if (!showBell) markNotificationsRead(viewer.uid, notifications); }}
              aria-label={`الإشعارات${unread ? ` (${unread} جديد)` : ''}`} className="relative w-11 h-11 rounded-full glass flex items-center justify-center cursor-pointer">
              <Bell className="w-5 h-5" />
              {unread > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[11px] font-black min-w-5 h-5 px-1 rounded-full flex items-center justify-center">{unread}</span>}
            </button>
            {showBell && (
              <div className="absolute left-0 mt-2 w-80 max-w-[85vw] bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 p-2 z-30">
                <div className="flex justify-between items-center px-2 py-1">
                  <p className="font-black text-sm">الإشعارات</p>
                  {notifications.length > 0 && <button onClick={() => clearNotifications(viewer.uid)} className="text-xs text-slate-500 cursor-pointer">مسح الكل</button>}
                </div>
                {notifications.length === 0 && <p className="text-sm text-slate-500 p-3">لا توجد إشعارات.</p>}
                <ul className="max-h-80 overflow-y-auto">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button onClick={() => { setShowBell(false); go(`/post/${n.postId}`); }} className={`w-full text-right px-3 py-2 rounded-xl hover:bg-slate-50 text-sm cursor-pointer ${n.read ? '' : 'bg-emerald-50/60'}`}>
                        <b>{n.fromName}</b> {n.type === 'reply' ? 'ردّ على تعليقك في' : 'علّق على منشورك'} «{n.postTitle}»
                        <span className="block text-xs text-slate-500">{timeAgo(n.createdAt)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_260px] gap-5 items-start">
        {/* Right sidebar (RTL): sections + categories */}
        <CommunitySidebar
          tabs={tabs}
          active={activeTab}
          onTab={(k) => {
            go(k === 'feed' ? '' : `/${k}`);
            // Phones: the tiles sit above the content — bring the chosen section into view.
            if (window.innerWidth < 1024) window.setTimeout(() => document.getElementById('cm-main')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
          }}
          categories={settings.categories.map((c) => ({ name: c, count: published.filter((p) => p.category === c).length }))}
          category={category}
          onCategory={(c) => { setCategory(c); if (c) setAdvanced(true); go(''); }}
        />

        {/* Main column */}
        <main id="cm-main" key={route.postId || route.tab} className="cm-enter space-y-4 min-w-0 scroll-mt-20">
          {error && <p className="bg-red-50 text-red-800 border border-red-200 rounded-2xl p-3 text-sm">تعذر تحميل الملتقى ({error}). إن كان الخطأ permission-denied فانشر قواعد الأمان الجديدة.</p>}

          {route.postId ? (
            openPost ? (
              <PostDetail post={openPost} viewer={viewer} imams={imamsById} saved={saved.has(openPost.id)} actions={actions} onBack={() => go('')} />
            ) : (
              <p className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500">{loading ? 'جاري التحميل…' : 'هذا المنشور غير موجود أو حُذف.'}</p>
            )
          ) : route.tab === 'admin' && isAdmin ? (
            <CommunityAdmin settings={settings} onDone={(m) => onToast(m)} onError={(m) => onToast(m, 'error')} />
          ) : route.tab === 'hadith' ? (
            <HadithCheck embedUrl={settings.hadithEmbedUrl} />
          ) : route.tab === 'saved' ? (
            <LibraryView title="محفوظاتي" note="المنشورات التي حفظتها، مرتبة حسب تصنيفها." sections={settings.categories}
              posts={published.filter((p) => saved.has(p.id))} groupBy={(p) => p.category} render={card} />
          ) : route.tab === 'drafts' ? (
            <div className="space-y-3">
              <h2 className="font-black text-lg text-slate-900">مسوداتي</h2>
              {drafts.length === 0 && <p className="text-sm text-slate-500 bg-white rounded-2xl border border-slate-200 p-6 text-center">لا توجد مسودات.</p>}
              {drafts.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-3">
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
            </div>
          ) : (
            <>
              {/* Composer prompt */}
              {viewer.canInteract ? (
                settings.postingEnabled || isAdmin ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 shadow-sm">
                    <button onClick={() => setComposer({ open: true, existing: null })} className="w-full flex items-center gap-3 cursor-pointer text-right">
                      <AuthorAvatar imamId={viewer.imamId} imams={imamsById} />
                      <span className="flex-1 bg-slate-100 hover:bg-slate-200 rounded-full px-4 py-3 text-slate-500 text-sm">شاركنا خطبةً أو درساً، أو اطرح سؤالاً…</span>
                    </button>
                    <PostTypeGrid compact onPick={(t) => setComposer({ open: true, type: t, existing: null })} />
                  </div>
                ) : (
                  <p className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-3 text-sm font-bold">النشر موقوف مؤقتاً من الإدارة. يمكنك الاطلاع والقراءة.</p>
                )
              ) : (
                <p className="bg-white border border-slate-200 rounded-2xl p-3 text-sm text-slate-600">يمكنك الاطلاع على الملتقى. النشر والتفاعل متاحان بعد أن تعتمد الإدارة ملفك كإمام.</p>
              )}

              {/* Filters */}
              <div className="bg-white rounded-3xl border border-slate-200 p-3 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex-1 min-w-48 relative">
                    <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث في المنشورات…" aria-label="بحث"
                      className="w-full border border-slate-200 rounded-full pr-9 pl-3 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600" />
                  </div>
                  <select value={sort} onChange={(e) => setSort(e.target.value as 'new' | 'top')} aria-label="الترتيب" className="border border-slate-200 rounded-full px-3 py-2 text-sm bg-white">
                    <option value="new">الأحدث</option>
                    <option value="top">الأكثر تفاعلاً</option>
                  </select>
                  <button onClick={() => setAdvanced((v) => !v)} aria-expanded={advanced} className="inline-flex items-center gap-1 text-sm font-bold px-3 py-2 rounded-full border border-slate-200 cursor-pointer">
                    <SlidersHorizontal className="w-4 h-4" /> بحث متقدم
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {FILTERS.map((f) => (
                    <button key={f.key} onClick={() => setFilter(f.key)} aria-pressed={filter === f.key}
                      className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer ${filter === f.key ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-700'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
                {advanced && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="التصنيف" className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white">
                      <option value="">كل التصنيفات</option>
                      {settings.categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="اسم الكاتب" aria-label="الكاتب" className="border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                  </div>
                )}
              </div>

              {loading ? (
                <p className="text-center text-slate-500 py-10 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> جاري التحميل…</p>
              ) : feed.length === 0 ? (
                <p className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-slate-500">لا توجد منشورات بعد{q || category || author || filter !== 'all' ? ' تطابق البحث' : ''}.</p>
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
    <article className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <AuthorAvatar imamId={post.authorImamId} imams={imams} />
          <div className="min-w-0 flex-1">
            <p className="font-black text-slate-900 truncate">{post.authorName}</p>
            <p className="text-xs text-slate-500">{timeAgo(post.publishedAt || post.createdAt)} · {post.category}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
            {post.pinned && <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-800 bg-amber-50 px-2 py-1 rounded-full"><Pin className="w-3 h-3" /> مثبّت</span>}
            <span className="text-[11px] font-bold text-emerald-900 bg-emerald-50 px-2 py-1 rounded-full">{postTypeIcon(post.type)} {postTypeLabel(post.type)}</span>
          </div>
        </div>
        <button onClick={open} className="block text-right w-full cursor-pointer group">
          <h2 className="text-xl font-black text-slate-900 font-amiri leading-snug group-hover:text-emerald-800">{post.title}</h2>
          {post.body.trim() && <p className="text-sm text-slate-700 leading-relaxed mt-1.5">{excerpt(post.body)}</p>}
          {long && <span className="text-sm font-bold text-emerald-800">اقرأ المزيد ←</span>}
        </button>
        <ImageGrid ids={post.images} />
        {post.poll && <PollBox post={post} viewer={viewer} onError={actions.onError} />}
        {post.files.length > 0 && (
          <button onClick={open} className="text-xs font-bold text-red-800 bg-red-50 px-3 py-1.5 rounded-full cursor-pointer">📎 {post.files.length} ملف PDF مرفق</button>
        )}
        <ReactionBar
          post={post}
          viewer={viewer}
          saved={saved}
          onToggleSave={() => actions.onToggleSave(post)}
          onComment={open}
          onReport={() => actions.onReport(post)}
          onEdit={() => actions.onEdit(post)}
          onDelete={() => actions.onDelete(post)}
          onPin={() => actions.onPin(post)}
          onError={actions.onError}
          onCopied={() => actions.onInfo('تم نسخ رابط المنشور.')}
        />
      </div>
    </article>
  );
};

const LibraryView: React.FC<{
  title: string;
  note: string;
  sections: string[];
  posts: CommunityPost[];
  groupBy: (p: CommunityPost) => string;
  render: (p: CommunityPost) => React.ReactNode;
}> = ({ title, note, sections, posts, groupBy, render }) => {
  const [section, setSection] = useState('');
  const all = Array.from(new Set([...sections, ...posts.map(groupBy).filter(Boolean)]));
  const shown = posts.filter((p) => !section || groupBy(p) === section);
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-black text-lg text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{note}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setSection('')} className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer ${!section ? 'bg-amber-400 text-slate-950' : 'bg-white border border-slate-200'}`}>
          الكل ({posts.length})
        </button>
        {all.map((s) => (
          <button key={s} onClick={() => setSection(s)} className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer ${section === s ? 'bg-amber-400 text-slate-950' : 'bg-white border border-slate-200'}`}>
            {s} ({posts.filter((p) => groupBy(p) === s).length})
          </button>
        ))}
      </div>
      {shown.length === 0 ? <p className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-slate-500">لا توجد مواد هنا بعد.</p> : shown.map(render)}
    </div>
  );
};
