import React, { useRef, useState } from 'react';
import { ArrowRight, CornerDownLeft, FileText, Flag, Loader2, Pin, Send, Trash2 } from 'lucide-react';
import { CommunityPost, PostComment } from '../../types/community';
import { ImamProfile } from '../../types';
import { addComment, deleteComment, openPdf, postTypeIcon, postTypeLabel, useComments } from '../../lib/community';
import { RichText } from '../../lib/richtext';
import { AuthorAvatar, CARD, CommunityViewer, ImageGrid, PollBox, PostMenu, ReactionBar, timeAgo } from './PostParts';

export interface PostActions {
  onEdit: (p: CommunityPost) => void;
  onDelete: (p: CommunityPost) => void;
  onPin: (p: CommunityPost) => void;
  onReport: (p: CommunityPost, comment?: PostComment) => void;
  onToggleSave: (p: CommunityPost) => void;
  onError: (m: string) => void;
  onInfo: (m: string) => void;
}

export const PostDetail: React.FC<{
  post: CommunityPost;
  viewer: CommunityViewer;
  imams: Map<string, ImamProfile>;
  saved: boolean;
  actions: PostActions;
  onBack: () => void;
}> = ({ post, viewer, imams, saved, actions, onBack }) => {
  const comments = useComments(post.id);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<PostComment | null>(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const top = comments.filter((c) => !c.parentId);
  const replies = (id: string) => comments.filter((c) => c.parentId === id);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (!viewer.canInteract) return actions.onError('التعليق متاح للأئمة المعتمدين.');
    setSending(true);
    try {
      await addComment({ post, author: { uid: viewer.uid, name: viewer.name, imamId: viewer.imamId }, body: text, parent: replyTo });
      setText('');
      setReplyTo(null);
    } catch (err) {
      console.error(err);
      actions.onError('تعذر إرسال التعليق.');
    } finally {
      setSending(false);
    }
  };

  const remove = async (c: PostComment) => {
    if (!window.confirm('حذف هذا التعليق؟')) return;
    try {
      await deleteComment(post.id, c);
    } catch {
      actions.onError('تعذر حذف التعليق.');
    }
  };

  const answer = (c: PostComment) => {
    setReplyTo(c);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const CommentItem: React.FC<{ c: PostComment; isReply?: boolean }> = ({ c, isReply }) => (
    <div className={`flex gap-2.5 ${isReply ? 'mr-12' : ''}`}>
      <AuthorAvatar imamId={c.authorImamId} imams={imams} size="w-9 h-9" />
      <div className="flex-1 min-w-0">
        <div className="bg-slate-100 rounded-2xl px-3.5 py-2">
          <p className="font-black text-sm text-slate-900">{c.authorName}</p>
          <p className="text-sm text-slate-800 whitespace-pre-line break-words">{c.body}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 px-2 pt-1">
          <span>{timeAgo(c.createdAt)}</span>
          {!isReply && viewer.canInteract && <button onClick={() => answer(c)} className="font-bold hover:text-emerald-800 cursor-pointer">ردّ</button>}
          {(c.authorUid === viewer.uid || viewer.isAdmin) && (
            <button onClick={() => remove(c)} className="font-bold hover:text-red-700 cursor-pointer inline-flex items-center gap-0.5"><Trash2 className="w-3 h-3" /> حذف</button>
          )}
          {c.authorUid !== viewer.uid && (
            <button onClick={() => actions.onReport(post, c)} className="font-bold hover:text-red-700 cursor-pointer inline-flex items-center gap-0.5"><Flag className="w-3 h-3" /> إبلاغ</button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <article className={`${CARD} overflow-hidden`}>
      <div className="px-5 sm:px-8 pt-5">
        <button onClick={onBack} className="text-sm font-bold text-emerald-800 inline-flex items-center gap-1 cursor-pointer mb-4">
          <ArrowRight className="w-4 h-4" /> العودة إلى الملتقى
        </button>
        <div className="flex items-center gap-3">
          <AuthorAvatar imamId={post.authorImamId} imams={imams} size="w-12 h-12" />
          <div>
            <p className="font-black text-slate-900">{post.authorName}</p>
            <p className="text-xs text-slate-500">
              {timeAgo(post.publishedAt || post.createdAt)} · {postTypeIcon(post.type)} {postTypeLabel(post.type)}
              {post.status === 'draft' && <span className="mr-1 text-amber-700 font-black">· مسودة</span>}
            </p>
          </div>
          {post.pinned && <span className="mr-auto inline-flex items-center gap-1 text-xs font-black text-amber-800 bg-amber-50 px-2 py-1 rounded-full"><Pin className="w-3 h-3" /> مثبّت</span>}
          {post.status === 'published' && (
            <span className={post.pinned ? '' : 'mr-auto'}>
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
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-amiri mt-5 leading-snug">{post.title}</h1>
      </div>

      <div className="px-5 sm:px-8 py-5 space-y-5">
        <RichText text={post.body} className="text-[1.05rem]" />
        <ImageGrid ids={post.images} />
        <PollBox post={post} viewer={viewer} onError={actions.onError} />
        {post.files.length > 0 && (
          <ul className="space-y-2">
            {post.files.map((f) => (
              <li key={f.id}>
                <button onClick={() => openPdf(f).catch(() => actions.onError('تعذر فتح الملف.'))}
                  className="w-full flex items-center gap-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-right cursor-pointer">
                  <FileText className="w-6 h-6 text-red-700 shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold text-sm truncate">{f.name}</span>
                    <span className="block text-xs text-slate-500">PDF · {(f.size / 1024 / 1024).toFixed(1)} MB · اضغط للتحميل</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {post.status === 'published' && (
          <ReactionBar
            post={post}
            viewer={viewer}
            onComment={() => inputRef.current?.focus()}
            onError={actions.onError}
            onCopied={() => actions.onInfo('تم نسخ رابط المنشور.')}
          />
        )}
      </div>

      {post.status === 'published' && (
        <section className="border-t border-slate-100 bg-slate-50/60 px-5 sm:px-8 py-5 space-y-4" aria-label="التعليقات">
          <h2 className="font-black text-slate-900">التعليقات ({post.commentCount})</h2>
          {top.length === 0 && <p className="text-sm text-slate-500">لا توجد تعليقات بعد. كن أول من يعلّق.</p>}
          <div className="space-y-4">
            {top.map((c) => (
              <div key={c.id} className="space-y-3">
                <CommentItem c={c} />
                {replies(c.id).map((r) => <CommentItem key={r.id} c={r} isReply />)}
              </div>
            ))}
          </div>

          {viewer.canInteract ? (
            <form onSubmit={send} className="space-y-2">
              {replyTo && (
                <p className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                  <CornerDownLeft className="w-3.5 h-3.5" /> ردّ على {replyTo.authorName}
                  <button type="button" onClick={() => setReplyTo(null)} className="text-slate-500 underline mr-2 cursor-pointer">إلغاء</button>
                </p>
              )}
              <div className="flex items-end gap-2">
                <AuthorAvatar imamId={viewer.imamId} imams={imams} size="w-9 h-9" />
                <textarea ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={3000}
                  placeholder={replyTo ? 'اكتب ردّك…' : 'اكتب تعليقاً…'} aria-label="تعليق"
                  className="flex-1 border border-slate-300 rounded-2xl px-4 py-2.5 text-sm bg-white resize-y focus:outline-none focus:ring-2 focus:ring-emerald-600" />
                <button type="submit" disabled={sending || !text.trim()} aria-label="إرسال"
                  className="w-11 h-11 rounded-full bg-emerald-800 text-white flex items-center justify-center cursor-pointer disabled:opacity-50">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-3">التعليق متاح للأئمة الذين اعتمدت الإدارة ملفاتهم.</p>
          )}
        </section>
      )}
    </article>
  );
};
