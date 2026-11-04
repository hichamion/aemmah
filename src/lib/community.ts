import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { compressImage } from './image';
import {
  CommunityNotification,
  CommunityPost,
  CommunitySettings,
  PostComment,
  PostFile,
  PostTemplate,
  PostType,
} from '../types/community';

const now = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Defaults (an admin can change them in communitySettings/main)
// ---------------------------------------------------------------------------

export const POST_TYPES: { value: PostType; label: string; icon: string }[] = [
  { value: 'khutba', label: 'خطبة أو درس', icon: '🕌' },
  { value: 'article', label: 'مقال علمي أو دعوي', icon: '📜' },
  { value: 'question', label: 'سؤال أو موضوع للنقاش', icon: '💬' },
  { value: 'field', label: 'صورة أو تجربة ميدانية', icon: '📷' },
  { value: 'poll', label: 'استطلاع رأي', icon: '📊' },
  { value: 'event', label: 'إعلان عن نشاط أو دورة', icon: '📣' },
];
export const postTypeLabel = (t: PostType) => POST_TYPES.find((x) => x.value === t)?.label ?? t;
export const postTypeIcon = (t: PostType) => POST_TYPES.find((x) => x.value === t)?.icon ?? '•';

export const DEFAULT_CATEGORIES = ['خطب الجمعة', 'دروس وتفسير', 'فقه وفتاوى', 'تجارب دعوية', 'العمل في أوروبا', 'أنشطة ودورات', 'عام'];
export const DEFAULT_LIBRARY_CATEGORIES = ['الخطب', 'الدروس', 'البحوث', 'التجارب الدعوية'];

export const DEFAULT_TEMPLATES: Record<PostType, PostTemplate> = {
  khutba: {
    title: 'خطبة: [عنوان الخطبة]',
    body: '## المقدمة\nالحمد لله…\n\n## الخطبة الأولى\n- العنصر الأول\n- العنصر الثاني\n\n## الخطبة الثانية\n…\n\n## المراجع\n- ',
  },
  article: {
    title: '[عنوان المقال]',
    body: '## تمهيد\n…\n\n## المسألة الأولى\n…\n\n## المسألة الثانية\n…\n\n## خلاصة\n…\n\n## المصادر\n- ',
  },
  question: {
    title: 'سؤال: [اكتب سؤالك باختصار]',
    body: '## السياق\nاشرح الحالة أو المسألة…\n\n## ما أريد معرفته\n…\n\n> شاركونا آراءكم وتجاربكم.',
  },
  field: {
    title: 'تجربة: [عنوان التجربة]',
    body: '## المكان والمناسبة\n…\n\n## ماذا فعلنا\n- \n\n## النتائج والدروس المستفادة\n- ',
  },
  poll: {
    title: 'استطلاع: [سؤال الاستطلاع]',
    body: 'اختر الإجابة الأقرب إلى رأيك، ويمكنك التعليق لتوضيح اختيارك.',
  },
  event: {
    title: 'إعلان: [اسم النشاط أو الدورة]',
    body: '## التفاصيل\n- **التاريخ:** \n- **المكان:** \n- **الجهة المنظمة:** \n\n## لمن هذا النشاط؟\n…\n\n## طريقة التسجيل\n…',
  },
};

export const DEFAULT_SETTINGS: CommunitySettings = {
  postingEnabled: true,
  categories: DEFAULT_CATEGORIES,
  libraryCategories: DEFAULT_LIBRARY_CATEGORIES,
  templates: {},
};

/** The template to offer for a type: the admin's version, the built-in one, or none if an admin deleted it. */
export function templateFor(settings: CommunitySettings, type: PostType): PostTemplate | null {
  const t = settings.templates?.[type];
  if (t === null) return null;
  return t ?? DEFAULT_TEMPLATES[type];
}

// ---------------------------------------------------------------------------
// Live data
// ---------------------------------------------------------------------------

export function useCommunitySettings(enabled: boolean): CommunitySettings {
  const [settings, setSettings] = useState<CommunitySettings>(DEFAULT_SETTINGS);
  useEffect(() => {
    if (!enabled) return;
    return onSnapshot(
      doc(db, 'communitySettings', 'main'),
      (snap) => setSettings({ ...DEFAULT_SETTINGS, ...(snap.exists() ? (snap.data() as Partial<CommunitySettings>) : {}) }),
      (err) => console.warn('[community settings]', err)
    );
  }, [enabled]);
  return settings;
}

export async function saveCommunitySettings(patch: Partial<CommunitySettings>) {
  await setDoc(doc(db, 'communitySettings', 'main'), patch, { merge: true });
}

/** Published posts + the viewer's own posts (drafts included). */
export function useCommunityPosts(uid: string | null, enabled: boolean) {
  const [published, setPublished] = useState<CommunityPost[]>([]);
  const [mine, setMine] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !uid) {
      setLoading(false);
      return;
    }
    const map = (snap: { docs: { id: string; data: () => unknown }[] }) =>
      snap.docs.map((d) => ({ ...(d.data() as CommunityPost), id: d.id }));
    const onErr = (err: Error) => {
      console.error('[posts]', err);
      setError((err as { code?: string }).code || err.message);
      setLoading(false);
    };
    const u1 = onSnapshot(query(collection(db, 'posts'), where('status', '==', 'published')), (s) => {
      setPublished(map(s));
      setLoading(false);
    }, onErr);
    const u2 = onSnapshot(query(collection(db, 'posts'), where('authorUid', '==', uid)), (s) => setMine(map(s)), onErr);
    return () => {
      u1();
      u2();
    };
  }, [uid, enabled]);

  const posts = useMemo(() => {
    const byId = new Map<string, CommunityPost>();
    [...published, ...mine].forEach((p) => byId.set(p.id, p));
    return Array.from(byId.values());
  }, [published, mine]);

  return { posts, loading, error };
}

export function useComments(postId: string | null) {
  const [comments, setComments] = useState<PostComment[]>([]);
  useEffect(() => {
    if (!postId) return;
    return onSnapshot(
      collection(db, 'posts', postId, 'comments'),
      (s) => setComments(s.docs.map((d) => ({ ...(d.data() as PostComment), id: d.id })).sort((a, b) => a.createdAt.localeCompare(b.createdAt))),
      (err) => console.warn('[comments]', err)
    );
  }, [postId]);
  return comments;
}

/** The viewer's own like (1) / dislike (-1) / none (0) on a post. Others' votes are never readable. */
export function useMyVote(postId: string, uid: string | null) {
  const [vote, setVote] = useState(0);
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(doc(db, 'posts', postId, 'votes', uid), (s) => setVote(s.exists() ? (s.data().value as number) : 0), () => {});
  }, [postId, uid]);
  return vote;
}

export function useMyPollVote(postId: string, uid: string | null, enabled: boolean) {
  const [option, setOption] = useState(-1);
  useEffect(() => {
    if (!uid || !enabled) return;
    return onSnapshot(doc(db, 'posts', postId, 'pollVotes', uid), (s) => setOption(s.exists() ? (s.data().option as number) : -1), () => {});
  }, [postId, uid, enabled]);
  return option;
}

export function useSaved(uid: string | null, enabled: boolean) {
  const [saved, setSaved] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!uid || !enabled) return;
    return onSnapshot(collection(db, 'users', uid, 'saved'), (s) => setSaved(new Set(s.docs.map((d) => d.id))), () => {});
  }, [uid, enabled]);
  return saved;
}

export function useNotifications(uid: string | null, enabled: boolean) {
  const [items, setItems] = useState<CommunityNotification[]>([]);
  useEffect(() => {
    if (!uid || !enabled) return;
    return onSnapshot(
      collection(db, 'users', uid, 'notifications'),
      (s) => setItems(s.docs.map((d) => ({ ...(d.data() as CommunityNotification), id: d.id })).sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
      () => {}
    );
  }, [uid, enabled]);
  return items;
}

// ---------------------------------------------------------------------------
// Media (images and PDFs are stored in Firestore: Cloud Storage is not enabled for this project)
// ---------------------------------------------------------------------------

export const MAX_POST_IMAGES = 6;
export const MAX_POST_FILES = 3;
export const MAX_PDF_BYTES = 2 * 1024 * 1024;
const CHUNK = 700_000; // base64 characters per chunk document

const mediaCache = new Map<string, string>();

export function useMediaImage(id: string | null) {
  const [src, setSrc] = useState<string | null>(id ? mediaCache.get(id) ?? null : null);
  useEffect(() => {
    if (!id || mediaCache.has(id)) {
      if (id) setSrc(mediaCache.get(id) ?? null);
      return;
    }
    let cancelled = false;
    getDoc(doc(db, 'media', id))
      .then((s) => {
        const data = s.exists() ? (s.data().data as string) : '';
        mediaCache.set(id, data);
        if (!cancelled) setSrc(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);
  return src;
}

/** Compresses the picked images (max 1280 px, ~330 KB each) — returns data URLs ready to upload. */
export async function prepareImages(files: File[]): Promise<string[]> {
  const out: string[] = [];
  for (const f of files) out.push(await compressImage(f, 1280, 330_000));
  return out;
}

async function uploadImages(dataUrls: string[], uid: string): Promise<string[]> {
  const ids: string[] = [];
  for (const data of dataUrls) {
    const ref = doc(collection(db, 'media'));
    await setDoc(ref, { ownerUid: uid, data, createdAt: now() });
    mediaCache.set(ref.id, data);
    ids.push(ref.id);
  }
  return ids;
}

export function checkPdf(file: File): string | null {
  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) return 'الملف يجب أن يكون بصيغة PDF.';
  if (file.size > MAX_PDF_BYTES) return 'حجم ملف PDF يتجاوز 2 ميغابايت.';
  return null;
}

async function fileToBase64(file: File): Promise<string> {
  const url = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  return url.slice(url.indexOf(',') + 1);
}

async function uploadPdf(file: File, uid: string): Promise<PostFile> {
  const b64 = await fileToBase64(file);
  const chunks = Array.from({ length: Math.ceil(b64.length / CHUNK) }, (_, i) => b64.slice(i * CHUNK, (i + 1) * CHUNK));
  const ref = doc(collection(db, 'files'));
  const batch = writeBatch(db);
  batch.set(ref, { ownerUid: uid, name: file.name.slice(0, 150), size: file.size, chunkCount: chunks.length, mime: 'application/pdf', createdAt: now() });
  chunks.forEach((data, i) => batch.set(doc(db, 'files', ref.id, 'chunks', String(i)), { data }));
  await batch.commit();
  return { id: ref.id, name: file.name.slice(0, 150), size: file.size };
}

/** Rebuilds a PDF from its chunks and opens / downloads it. */
export async function openPdf(f: PostFile) {
  const meta = await getDoc(doc(db, 'files', f.id));
  if (!meta.exists()) throw new Error('missing');
  const n = meta.data().chunkCount as number;
  const parts = await Promise.all(Array.from({ length: n }, (_, i) => getDoc(doc(db, 'files', f.id, 'chunks', String(i)))));
  const b64 = parts.map((p) => (p.data()?.data as string) || '').join('');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = /\.pdf$/i.test(f.name) ? f.name.replace(/[^\w.\-]+/g, '_') : 'document.pdf';
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

async function deleteMedia(imageIds: string[], files: PostFile[]) {
  await Promise.all([
    ...imageIds.map((id) => deleteDoc(doc(db, 'media', id)).catch(() => {})),
    ...files.map(async (f) => {
      const meta = await getDoc(doc(db, 'files', f.id)).catch(() => null);
      const n = (meta?.data()?.chunkCount as number) || 0;
      await Promise.all(Array.from({ length: n }, (_, i) => deleteDoc(doc(db, 'files', f.id, 'chunks', String(i))).catch(() => {})));
      await deleteDoc(doc(db, 'files', f.id)).catch(() => {});
    }),
  ]);
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export interface PostDraft {
  type: PostType;
  category: string;
  title: string;
  body: string;
  /** Images already uploaded (when editing). */
  keepImages: string[];
  /** New images as compressed data URLs. */
  newImages: string[];
  keepFiles: PostFile[];
  newFiles: File[];
  pollOptions: string[];
}

export async function savePost(params: {
  existing: CommunityPost | null;
  draft: PostDraft;
  status: 'draft' | 'published';
  author: { uid: string; name: string; imamId: string };
}): Promise<string> {
  const { existing, draft, status, author } = params;
  const images = [...draft.keepImages, ...(await uploadImages(draft.newImages, author.uid))].slice(0, MAX_POST_IMAGES);
  const uploaded: PostFile[] = [];
  for (const f of draft.newFiles) uploaded.push(await uploadPdf(f, author.uid));
  const files = [...draft.keepFiles, ...uploaded].slice(0, MAX_POST_FILES);
  const options = draft.type === 'poll' ? draft.pollOptions.map((o) => o.trim()).filter(Boolean).slice(0, 6) : [];

  const content = {
    type: draft.type,
    category: draft.category,
    title: draft.title.trim().slice(0, 200),
    body: draft.body.slice(0, 60000),
    images,
    files,
    poll: options.length >= 2 ? { options } : null,
    status,
    updatedAt: now(),
    publishedAt: status === 'published' ? existing?.publishedAt || now() : '',
  };

  if (existing) {
    const removedImages = existing.images.filter((id) => !images.includes(id));
    const removedFiles = existing.files.filter((f) => !files.some((x) => x.id === f.id));
    // Poll totals restart only if the options themselves changed.
    const sameOptions = JSON.stringify(existing.poll?.options || []) === JSON.stringify(options);
    await updateDoc(doc(db, 'posts', existing.id), {
      ...content,
      ...(sameOptions ? {} : { pollCounts: options.map(() => 0) }),
    });
    await deleteMedia(removedImages, removedFiles);
    return existing.id;
  }

  const ref = doc(collection(db, 'posts'));
  await setDoc(ref, {
    ...content,
    pollCounts: options.map(() => 0),
    authorUid: author.uid,
    authorName: author.name.slice(0, 150),
    authorImamId: author.imamId,
    pinned: false,
    inLibrary: false,
    libraryCategory: '',
    likeCount: 0,
    dislikeCount: 0,
    commentCount: 0,
    lastCommentId: '',
    createdAt: now(),
  });
  return ref.id;
}

export async function deletePost(post: CommunityPost) {
  await deleteDoc(doc(db, 'posts', post.id));
  await deleteMedia(post.images, post.files);
}

/** Admin: pin, or put in / take out of the shared library. */
export async function moderatePost(post: CommunityPost, patch: Partial<Pick<CommunityPost, 'pinned' | 'inLibrary' | 'libraryCategory'>>) {
  await updateDoc(doc(db, 'posts', post.id), patch);
}

// ---------------------------------------------------------------------------
// Reactions (one vote per member, counters kept consistent by the security rules)
// ---------------------------------------------------------------------------

/** value: 1 like, -1 dislike. Clicking the same value again removes the vote. */
export async function vote(postId: string, uid: string, value: 1 | -1) {
  await runTransaction(db, async (tx) => {
    const postRef = doc(db, 'posts', postId);
    const voteRef = doc(db, 'posts', postId, 'votes', uid);
    const [p, v] = await Promise.all([tx.get(postRef), tx.get(voteRef)]);
    if (!p.exists()) return;
    const before = v.exists() ? (v.data().value as number) : 0;
    const after = before === value ? 0 : value;
    const likeCount = (p.data().likeCount as number) + (after === 1 ? 1 : 0) - (before === 1 ? 1 : 0);
    const dislikeCount = (p.data().dislikeCount as number) + (after === -1 ? 1 : 0) - (before === -1 ? 1 : 0);
    if (after === 0) tx.delete(voteRef);
    else tx.set(voteRef, { value: after });
    tx.update(postRef, { likeCount, dislikeCount });
  });
}

/** Picks a poll option; picking the same one again withdraws the vote. */
export async function votePoll(postId: string, uid: string, option: number) {
  await runTransaction(db, async (tx) => {
    const postRef = doc(db, 'posts', postId);
    const voteRef = doc(db, 'posts', postId, 'pollVotes', uid);
    const [p, v] = await Promise.all([tx.get(postRef), tx.get(voteRef)]);
    if (!p.exists()) return;
    const counts = [...((p.data().pollCounts as number[]) || [])];
    const before = v.exists() ? (v.data().option as number) : -1;
    const after = before === option ? -1 : option;
    if (before >= 0) counts[before] = Math.max(0, counts[before] - 1);
    if (after >= 0) counts[after] = (counts[after] || 0) + 1;
    if (after < 0) tx.delete(voteRef);
    else tx.set(voteRef, { option: after });
    tx.update(postRef, { pollCounts: counts });
  });
}

export async function toggleSaved(uid: string, post: CommunityPost, isSaved: boolean) {
  const ref = doc(db, 'users', uid, 'saved', post.id);
  if (isSaved) await deleteDoc(ref);
  else await setDoc(ref, { savedAt: now(), folder: post.category.slice(0, 60) });
}

// ---------------------------------------------------------------------------
// Comments and notifications
// ---------------------------------------------------------------------------

export async function addComment(params: {
  post: CommunityPost;
  author: { uid: string; name: string; imamId: string };
  body: string;
  parent: PostComment | null;
}) {
  const { post, author, body, parent } = params;
  const commentRef = doc(collection(db, 'posts', post.id, 'comments'));
  await runTransaction(db, async (tx) => {
    const postRef = doc(db, 'posts', post.id);
    const p = await tx.get(postRef);
    if (!p.exists()) throw new Error('post gone');
    tx.set(commentRef, {
      authorUid: author.uid,
      authorName: author.name.slice(0, 150),
      authorImamId: author.imamId,
      body: body.trim().slice(0, 3000),
      parentId: parent?.id ?? '',
      createdAt: now(),
    });
    tx.update(postRef, { commentCount: (p.data().commentCount as number) + 1, lastCommentId: commentRef.id });
  });

  // Notify the post author and, for a reply, the author of the answered comment.
  const targets = new Map<string, 'comment' | 'reply'>();
  if (post.authorUid !== author.uid) targets.set(post.authorUid, 'comment');
  if (parent && parent.authorUid !== author.uid) targets.set(parent.authorUid, 'reply');
  await Promise.all(
    Array.from(targets.entries()).map(([uid, type]) =>
      setDoc(doc(collection(db, 'users', uid, 'notifications')), {
        type,
        postId: post.id,
        postTitle: post.title.slice(0, 200),
        fromUid: author.uid,
        fromName: author.name.slice(0, 150),
        createdAt: now(),
        read: false,
      }).catch((e) => console.warn('[notify]', e))
    )
  );
}

export async function deleteComment(postId: string, comment: PostComment) {
  await runTransaction(db, async (tx) => {
    const postRef = doc(db, 'posts', postId);
    const p = await tx.get(postRef);
    if (!p.exists()) return;
    tx.delete(doc(db, 'posts', postId, 'comments', comment.id));
    tx.update(postRef, { commentCount: Math.max(0, (p.data().commentCount as number) - 1), lastCommentId: comment.id });
  });
}

export async function markNotificationsRead(uid: string, items: CommunityNotification[]) {
  await Promise.all(items.filter((n) => !n.read).map((n) => updateDoc(doc(db, 'users', uid, 'notifications', n.id), { read: true }).catch(() => {})));
}

export async function clearNotifications(uid: string) {
  const snap = await getDocs(collection(db, 'users', uid, 'notifications'));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}
