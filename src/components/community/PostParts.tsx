import React, { useState } from 'react';
import { Bookmark, BookmarkCheck, Flag, MessageCircle, MoreHorizontal, Pin, Share2, ThumbsDown, ThumbsUp, Trash2, Edit3 } from 'lucide-react';
import { CommunityPost, PostType } from '../../types/community';
import { ImamProfile } from '../../types';
import { getSafeImamAvatar } from '../../utils/helpers';
import { LogoMark } from '../Logo';
import { POST_TYPES, useMediaImage, useMyPollVote, useMyVote, vote, votePoll } from '../../lib/community';

export interface CommunityViewer {
  uid: string;
  name: string;
  imamId: string;
  isAdmin: boolean;
  /** Approved imam or admin: may post, comment and react. */
  canInteract: boolean;
}

/** White card: full width on phones (like a social feed), rounded on larger screens. */
export const CARD = 'bg-white border-y sm:border border-slate-200 sm:rounded-2xl shadow-sm';

export const timeAgo = (iso: string) => {
  if (!iso) return '';
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 60) return 'الآن';
  if (s < 3600) return `منذ ${Math.floor(s / 60)} دقيقة`;
  if (s < 86400) return `منذ ${Math.floor(s / 3600)} ساعة`;
  if (s < 86400 * 30) return `منذ ${Math.floor(s / 86400)} يوم`;
  return new Date(iso).toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const AuthorAvatar: React.FC<{ imamId: string; imams: Map<string, ImamProfile>; size?: string }> = ({ imamId, imams, size = 'w-11 h-11' }) => {
  const imam = imamId ? imams.get(imamId) : undefined;
  if (!imamId) return <LogoMark className={`${size} rounded-full`} />;
  return <img src={getSafeImamAvatar(imam?.photo)} alt="" className={`${size} rounded-full object-cover ring-2 ring-amber-300/70 bg-white shrink-0`} />;
};

const MediaImg: React.FC<{ id: string; className?: string; onClick?: () => void }> = ({ id, className = '', onClick }) => {
  const src = useMediaImage(id);
  return src ? (
    <img src={src} alt="" loading="lazy" onClick={onClick} className={`object-cover w-full h-full ${onClick ? 'cursor-zoom-in' : ''} ${className}`} />
  ) : (
    <div className={`bg-slate-100 animate-pulse w-full h-full ${className}`} />
  );
};

/** 1–6 images in a Facebook-like grid; clicking opens a lightbox. */
export const ImageGrid: React.FC<{ ids: string[]; /** Edge to edge, no rounding (feed cards). */ flush?: boolean }> = ({ ids, flush }) => {
  const [open, setOpen] = useState<string | null>(null);
  if (!ids.length) return null;
  const shown = ids.slice(0, 4);
  const extra = ids.length - shown.length;
  return (
    <>
      <div className={`grid gap-1 overflow-hidden ${flush ? '' : 'rounded-2xl'} ${shown.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {shown.map((id, i) => (
          <div key={id} className={`relative ${shown.length === 1 ? 'aspect-video' : 'aspect-square'} ${shown.length === 3 && i === 0 ? 'row-span-2 aspect-auto' : ''}`}>
            <MediaImg id={id} onClick={() => setOpen(id)} />
            {i === shown.length - 1 && extra > 0 && (
              <button onClick={() => setOpen(id)} className="absolute inset-0 bg-black/50 text-white text-2xl font-black cursor-pointer">+{extra}</button>
            )}
          </div>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setOpen(null)} role="dialog" aria-label="عرض الصورة">
          <div className="max-w-5xl max-h-full flex gap-2 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
            {ids.map((id) => (
              <div key={id} className="shrink-0 max-h-[85vh]">
                <MediaImgFull id={id} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const MediaImgFull: React.FC<{ id: string }> = ({ id }) => {
  const src = useMediaImage(id);
  return src ? <img src={src} alt="" className="max-h-[85vh] w-auto rounded-xl" /> : null;
};

/** Poll with anonymous totals. One vote per member; clicking your choice again withdraws it. */
export const PollBox: React.FC<{ post: CommunityPost; viewer: CommunityViewer; onError: (m: string) => void }> = ({ post, viewer, onError }) => {
  const mine = useMyPollVote(post.id, viewer.uid, !!post.poll);
  const [busy, setBusy] = useState(false);
  if (!post.poll) return null;
  const counts = post.pollCounts || [];
  const total = counts.reduce((a, b) => a + b, 0);
  const pick = async (i: number) => {
    if (!viewer.canInteract) return onError('التصويت متاح للأئمة المعتمدين.');
    setBusy(true);
    try {
      await votePoll(post.id, viewer.uid, i);
    } catch (e) {
      console.error(e);
      onError('تعذر تسجيل التصويت.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2">
      {post.poll.options.map((o, i) => {
        const pct = total ? Math.round(((counts[i] || 0) / total) * 100) : 0;
        const chosen = mine === i;
        return (
          <button key={i} type="button" disabled={busy} onClick={() => pick(i)}
            className={`relative w-full text-right rounded-xl border-2 px-4 py-2.5 overflow-hidden cursor-pointer transition ${chosen ? 'border-emerald-600' : 'border-slate-200 hover:border-emerald-300'}`}>
            <span className="absolute inset-y-0 right-0 bg-emerald-100" style={{ width: `${pct}%` }} aria-hidden />
            <span className="relative flex justify-between gap-2 text-sm font-bold">
              <span>{chosen ? '✓ ' : ''}{o}</span>
              <span className="text-slate-500 tabular-nums">{pct}%</span>
            </span>
          </button>
        );
      })}
      <p className="text-xs text-slate-500">{total} صوت — التصويت سرّي، ولا تظهر أسماء المصوّتين.</p>
    </div>
  );
};

/** Facebook-like action area: counts row, then «أعجبني · تعليق · مشاركة». Counts only, never names. */
export const ReactionBar: React.FC<{
  post: CommunityPost;
  viewer: CommunityViewer;
  onComment: () => void;
  onError: (m: string) => void;
  onCopied: () => void;
}> = ({ post, viewer, onComment, onError, onCopied }) => {
  const mine = useMyVote(post.id, viewer.uid);
  const [busy, setBusy] = useState(false);

  const like = async () => {
    if (!viewer.canInteract) return onError('التفاعل متاح للأئمة المعتمدين.');
    setBusy(true);
    try {
      await vote(post.id, viewer.uid, 1);
    } catch (e) {
      console.error(e);
      onError('تعذر تسجيل التفاعل.');
    } finally {
      setBusy(false);
    }
  };
  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/community/post/${post.id}`;
    try {
      if (navigator.share) await navigator.share({ title: post.title, url });
      else {
        await navigator.clipboard.writeText(url);
        onCopied();
      }
    } catch {
      // cancelled
    }
  };
  const btn = 'flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] sm:text-sm font-bold transition cursor-pointer disabled:opacity-60 hover:bg-slate-100';
  const hasCounts = post.likeCount > 0 || post.dislikeCount > 0 || post.commentCount > 0;

  return (
    <div>
      {hasCounts && (
        <div className="flex items-center justify-between text-xs text-slate-500 py-2">
          <span className="flex items-center gap-2">
            {post.likeCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <span className="w-[18px] h-[18px] rounded-full bg-emerald-700 text-white inline-flex items-center justify-center"><ThumbsUp className="w-2.5 h-2.5 fill-current" /></span>
                <span className="tabular-nums">{post.likeCount}</span>
              </span>
            )}
            {post.dislikeCount > 0 && (
              <span className="inline-flex items-center gap-1 text-slate-400"><ThumbsDown className="w-3 h-3" /> <span className="tabular-nums">{post.dislikeCount}</span></span>
            )}
          </span>
          {post.commentCount > 0 && (
            <button onClick={onComment} className="hover:underline cursor-pointer tabular-nums">{post.commentCount} تعليق</button>
          )}
        </div>
      )}
      <div className="flex items-center gap-1 border-t border-slate-200 pt-1">
        <button className={`${btn} ${mine === 1 ? 'text-emerald-700' : 'text-slate-600'}`} disabled={busy} onClick={like} aria-pressed={mine === 1}>
          <ThumbsUp className={`w-[18px] h-[18px] ${mine === 1 ? 'fill-current' : ''}`} /> أعجبني
        </button>
        <button className={`${btn} text-slate-600`} onClick={onComment}>
          <MessageCircle className="w-[18px] h-[18px]" /> تعليق
        </button>
        <button className={`${btn} text-slate-600`} onClick={share} aria-label="مشاركة الرابط">
          <Share2 className="w-[18px] h-[18px]" /> مشاركة
        </button>
      </div>
    </div>
  );
};

/** «⋯» menu of a post (header, top-left): save, dislike, and the author / admin actions. */
export const PostMenu: React.FC<{
  post: CommunityPost;
  viewer: CommunityViewer;
  saved: boolean;
  onToggleSave: () => void;
  onReport: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  onError: (m: string) => void;
}> = ({ post, viewer, saved, onToggleSave, onReport, onEdit, onDelete, onPin, onError }) => {
  const mine = useMyVote(post.id, viewer.uid);
  const [open, setOpen] = useState(false);
  const isAuthor = post.authorUid === viewer.uid;
  const item = 'w-full text-right flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-100 cursor-pointer font-bold';
  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };
  const dislike = async () => {
    if (!viewer.canInteract) return onError('التفاعل متاح للأئمة المعتمدين.');
    try {
      await vote(post.id, viewer.uid, -1);
    } catch {
      onError('تعذر تسجيل التفاعل.');
    }
  };
  return (
    <div className="relative shrink-0">
      <button onClick={() => setOpen((v) => !v)} aria-label="خيارات المنشور" aria-expanded={open}
        className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer">
        <MoreHorizontal className="w-5 h-5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute left-0 top-full mt-1 w-60 bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 p-1.5 z-40 text-sm text-slate-700">
            <button className={item} onClick={run(onToggleSave)}>
              {saved ? <BookmarkCheck className="w-4 h-4 text-amber-600" /> : <Bookmark className="w-4 h-4" />} {saved ? 'إزالة من المحفوظات' : 'حفظ المنشور'}
            </button>
            <button className={item} onClick={run(dislike)} aria-pressed={mine === -1}>
              <ThumbsDown className={`w-4 h-4 ${mine === -1 ? 'fill-current' : ''}`} /> {mine === -1 ? 'إلغاء «لا يعجبني»' : 'لا يعجبني'}
            </button>
            {(isAuthor || viewer.isAdmin) && (
              <button className={item} onClick={run(onEdit)}><Edit3 className="w-4 h-4" /> تعديل المنشور</button>
            )}
            {viewer.isAdmin && (
              <button className={item} onClick={run(onPin)}><Pin className="w-4 h-4" /> {post.pinned ? 'إلغاء التثبيت' : 'تثبيت في الأعلى'}</button>
            )}
            {!isAuthor && (
              <button className={item} onClick={run(onReport)}><Flag className="w-4 h-4" /> إبلاغ الإدارة</button>
            )}
            {(isAuthor || viewer.isAdmin) && (
              <button className={`${item} text-red-700 hover:bg-red-50`} onClick={run(onDelete)}><Trash2 className="w-4 h-4" /> حذف المنشور</button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/** The six post types as equal cards (3×2 on phones, 6 in a row on wide screens) — no horizontal scrolling. */
export const PostTypeGrid: React.FC<{ value?: PostType; onPick: (t: PostType) => void; compact?: boolean }> = ({ value, onPick, compact }) => (
  <div role="group" aria-label="نوع المنشور" className={`grid grid-cols-2 min-[420px]:grid-cols-3 ${compact ? 'md:grid-cols-6' : 'sm:grid-cols-3'} gap-2`}>
    {POST_TYPES.map((t) => {
      const on = value === t.value;
      return (
        <button
          key={t.value}
          type="button"
          onClick={() => onPick(t.value)}
          aria-pressed={value ? on : undefined}
          className={`group flex flex-col items-center justify-center gap-1.5 text-center rounded-2xl border-2 px-2 ${compact ? 'py-2.5' : 'py-3.5'} min-h-[4.75rem] cursor-pointer transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
            on
              ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-[0_6px_18px_-8px_rgba(4,120,87,0.55)]'
              : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50/50 hover:shadow-md'
          }`}
        >
          <span className={`text-2xl leading-none transition-transform duration-200 group-hover:scale-110 ${on ? 'scale-110' : ''}`} aria-hidden>{t.icon}</span>
          <span className="text-[11.5px] sm:text-xs font-black leading-snug">{t.label}</span>
        </button>
      );
    })}
  </div>
);
