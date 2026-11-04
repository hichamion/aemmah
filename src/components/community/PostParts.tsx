import React, { useState } from 'react';
import { Bookmark, BookmarkCheck, Flag, Link2, MessageCircle, MoreHorizontal, Pin, ThumbsDown, ThumbsUp, Trash2, Edit3, Library } from 'lucide-react';
import { CommunityPost } from '../../types/community';
import { ImamProfile } from '../../types';
import { getSafeImamAvatar } from '../../utils/helpers';
import { LogoMark } from '../Logo';
import { useMediaImage, useMyPollVote, useMyVote, vote, votePoll } from '../../lib/community';

export interface CommunityViewer {
  uid: string;
  name: string;
  imamId: string;
  isAdmin: boolean;
  /** Approved imam or admin: may post, comment and react. */
  canInteract: boolean;
}

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
export const ImageGrid: React.FC<{ ids: string[] }> = ({ ids }) => {
  const [open, setOpen] = useState<string | null>(null);
  if (!ids.length) return null;
  const shown = ids.slice(0, 4);
  const extra = ids.length - shown.length;
  return (
    <>
      <div className={`grid gap-1 rounded-2xl overflow-hidden ${shown.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
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

/** Like / dislike / comment / save / share (+ report and moderation). Counts only, never names. */
export const ReactionBar: React.FC<{
  post: CommunityPost;
  viewer: CommunityViewer;
  saved: boolean;
  onToggleSave: () => void;
  onComment: () => void;
  onReport: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  onLibrary: () => void;
  onError: (m: string) => void;
  onCopied: () => void;
}> = ({ post, viewer, saved, onToggleSave, onComment, onReport, onEdit, onDelete, onPin, onLibrary, onError, onCopied }) => {
  const mine = useMyVote(post.id, viewer.uid);
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);
  const isAuthor = post.authorUid === viewer.uid;

  const react = async (v: 1 | -1) => {
    if (!viewer.canInteract) return onError('التفاعل متاح للأئمة المعتمدين.');
    setBusy(true);
    try {
      await vote(post.id, viewer.uid, v);
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
  const btn = 'flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition cursor-pointer disabled:opacity-60';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5 text-emerald-700" /> {post.likeCount}</span>
          <span className="inline-flex items-center gap-1"><ThumbsDown className="w-3.5 h-3.5 text-slate-500" /> {post.dislikeCount}</span>
        </span>
        <span>{post.commentCount} تعليق</span>
      </div>
      <div className="flex items-center gap-1 border-t border-slate-100 pt-1">
        <button className={`${btn} ${mine === 1 ? 'text-emerald-800 bg-emerald-50' : 'text-slate-600 hover:bg-slate-50'}`} disabled={busy} onClick={() => react(1)} aria-pressed={mine === 1}>
          <ThumbsUp className={`w-4 h-4 ${mine === 1 ? 'fill-current' : ''}`} /> <span className="hidden sm:inline">إعجاب</span>
        </button>
        <button className={`${btn} ${mine === -1 ? 'text-slate-900 bg-slate-100' : 'text-slate-600 hover:bg-slate-50'}`} disabled={busy} onClick={() => react(-1)} aria-pressed={mine === -1}>
          <ThumbsDown className={`w-4 h-4 ${mine === -1 ? 'fill-current' : ''}`} /> <span className="hidden sm:inline">عدم إعجاب</span>
        </button>
        <button className={`${btn} text-slate-600 hover:bg-slate-50`} onClick={onComment}>
          <MessageCircle className="w-4 h-4" /> <span className="hidden sm:inline">تعليق</span>
        </button>
        <button className={`${btn} ${saved ? 'text-amber-700' : 'text-slate-600'} hover:bg-slate-50`} onClick={onToggleSave} aria-pressed={saved}>
          {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />} <span className="hidden sm:inline">{saved ? 'محفوظ' : 'حفظ'}</span>
        </button>
        <button className={`${btn} text-slate-600 hover:bg-slate-50`} onClick={share} aria-label="مشاركة الرابط">
          <Link2 className="w-4 h-4" /> <span className="hidden md:inline">مشاركة</span>
        </button>
        <div className="relative">
          <button className="p-2 rounded-xl hover:bg-slate-50 text-slate-500 cursor-pointer" onClick={() => setMenu((v) => !v)} aria-label="خيارات أخرى" aria-expanded={menu}>
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menu && (
            <div className="absolute left-0 bottom-full mb-1 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-20 text-sm" onMouseLeave={() => setMenu(false)}>
              {(isAuthor || viewer.isAdmin) && (
                <button className="w-full text-right flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 cursor-pointer" onClick={() => { setMenu(false); onEdit(); }}>
                  <Edit3 className="w-4 h-4" /> تعديل
                </button>
              )}
              {viewer.isAdmin && (
                <>
                  <button className="w-full text-right flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 cursor-pointer" onClick={() => { setMenu(false); onPin(); }}>
                    <Pin className="w-4 h-4" /> {post.pinned ? 'إلغاء التثبيت' : 'تثبيت في الأعلى'}
                  </button>
                  <button className="w-full text-right flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 cursor-pointer" onClick={() => { setMenu(false); onLibrary(); }}>
                    <Library className="w-4 h-4" /> {post.inLibrary ? 'إزالة من المكتبة' : 'إضافة إلى مكتبة الأئمة'}
                  </button>
                </>
              )}
              {!isAuthor && (
                <button className="w-full text-right flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 cursor-pointer" onClick={() => { setMenu(false); onReport(); }}>
                  <Flag className="w-4 h-4" /> إبلاغ الإدارة
                </button>
              )}
              {(isAuthor || viewer.isAdmin) && (
                <button className="w-full text-right flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 text-red-700 cursor-pointer" onClick={() => { setMenu(false); onDelete(); }}>
                  <Trash2 className="w-4 h-4" /> حذف
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
