import { useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  Query,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
  addDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { compressImage } from './image';
import {
  ADMIN_INBOX,
  Application,
  ApplicationStatus,
  AvailabilityState,
  FeedbackItem,
  ImamContact,
  ImamFormFiles,
  ImamProfile,
  MosqueContact,
  MosqueJob,
  PlatformMessage,
  Recitation,
  RecitationMeta,
  ReportItem,
  UserProfile,
  UserRole,
} from '../types';

export const nowIso = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Live subscriptions
// ---------------------------------------------------------------------------

type Source = Query | DocumentReference;

/**
 * Subscribes to several queries / documents at once and merges the results by id.
 * Needed because Firestore security rules require each query to be provably allowed
 * (e.g. "approved imams" + "my own imam profile" are two separate queries).
 */
function subscribeMerged<T extends { id: string }>(
  sources: Source[],
  onData: (items: T[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  if (sources.length === 0) {
    onData([]);
    return () => {};
  }
  const buckets: Map<string, T>[] = sources.map(() => new Map());
  const received = sources.map(() => false);

  const emit = () => {
    if (!received.every(Boolean)) return;
    const merged = new Map<string, T>();
    buckets.forEach((b) => b.forEach((v, k) => merged.set(k, v)));
    onData(Array.from(merged.values()));
  };

  const unsubs = sources.map((src, idx) => {
    const handleErr = (err: Error) => {
      received[idx] = true;
      buckets[idx] = new Map();
      onError(err);
      emit();
    };
    if (src.type === 'document') {
      return onSnapshot(
        src as DocumentReference,
        (snap) => {
          const m = new Map<string, T>();
          if (snap.exists()) m.set(snap.id, { ...(snap.data() as object), id: snap.id } as T);
          buckets[idx] = m;
          received[idx] = true;
          emit();
        },
        handleErr
      );
    }
    return onSnapshot(
      src as Query,
      (snap) => {
        const m = new Map<string, T>();
        snap.forEach((d) => m.set(d.id, { ...(d.data() as object), id: d.id } as T));
        buckets[idx] = m;
        received[idx] = true;
        emit();
      },
      handleErr
    );
  });

  return () => unsubs.forEach((u) => u());
}

const byDesc = <T,>(key: (x: T) => string | undefined) => (a: T, b: T) =>
  (key(b) || '').localeCompare(key(a) || '');

export interface PlatformData {
  imams: ImamProfile[];
  mosques: MosqueJob[];
  applications: Application[];
  messages: PlatformMessage[];
  reports: ReportItem[];
  feedback: FeedbackItem[];
  loading: boolean;
  /** Which data failed to load and why (Firestore error code), e.g. { source: 'البلاغات', code: 'permission-denied' }. */
  error: { source: string; code: string } | null;
}

/**
 * Loads everything the current user is allowed to see, live.
 * The queries mirror firestore.rules exactly — if you change one, change the other.
 */
export function usePlatformData(uid: string | null, role: UserRole): PlatformData {
  const [imams, setImams] = useState<ImamProfile[]>([]);
  const [mosques, setMosques] = useState<MosqueJob[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [messages, setMessages] = useState<PlatformMessage[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loadedImams, setLoadedImams] = useState(false);
  const [loadedMosques, setLoadedMosques] = useState(false);
  const [error, setError] = useState<PlatformData['error']>(null);

  useEffect(() => {
    const isAdmin = role === 'admin';
    setError(null);
    const onError = (source: string) => (err: Error) => {
      // A listener from the previous account (just after signing in/out) may fail before it is replaced; ignore it.
      if ((auth.currentUser?.uid ?? null) !== uid) return;
      const code = (err as { code?: string }).code || err.message;
      console.error(`[Firestore] ${source}:`, err);
      setError({ source, code });
    };

    // Imams
    const imamsCol = collection(db, 'imams');
    const imamSources: Source[] = isAdmin
      ? [imamsCol]
      : [query(imamsCol, where('approvalStatus', '==', 'approved'))];
    if (!isAdmin && uid && role === 'imam') imamSources.push(doc(db, 'imams', uid));

    // Mosques
    const mosquesCol = collection(db, 'mosques');
    const mosqueSources: Source[] = isAdmin
      ? [mosquesCol]
      : [query(mosquesCol, where('approvalStatus', '==', 'approved'))];
    if (!isAdmin && uid && role === 'mosque') mosqueSources.push(query(mosquesCol, where('ownerUid', '==', uid)));

    // Applications
    const appsCol = collection(db, 'applications');
    const appSources: Source[] = [];
    if (isAdmin) appSources.push(appsCol);
    else if (uid && role === 'imam') appSources.push(query(appsCol, where('imamUid', '==', uid)));
    else if (uid && role === 'mosque') appSources.push(query(appsCol, where('mosqueOwnerUid', '==', uid)));

    // Messages
    const msgCol = collection(db, 'messages');
    const msgSources: Source[] = [];
    if (uid && role !== 'visitor') msgSources.push(query(msgCol, where('participants', 'array-contains', uid)));
    if (isAdmin) msgSources.push(query(msgCol, where('receiverUid', '==', ADMIN_INBOX)));

    // Reports (admin only)
    const reportSources: Source[] = isAdmin ? [collection(db, 'reports')] : [];
    const feedbackSources: Source[] = isAdmin ? [collection(db, 'feedback')] : [];

    const unsubs = [
      subscribeMerged<ImamProfile>(imamSources, (items) => {
        setImams(items.sort(byDesc((i) => i.createdAt)));
        setLoadedImams(true);
      }, onError('الأئمة')),
      subscribeMerged<MosqueJob>(mosqueSources, (items) => {
        setMosques(items.sort(byDesc((m) => m.createdAt)));
        setLoadedMosques(true);
      }, onError('المساجد')),
      subscribeMerged<Application>(appSources, (items) => setApplications(items.sort(byDesc((a) => a.appliedAt))), onError('طلبات الترشح')),
      subscribeMerged<PlatformMessage>(msgSources, (items) => setMessages(items.sort(byDesc((m) => m.sentAt))), onError('الرسائل')),
      subscribeMerged<ReportItem>(reportSources, (items) => setReports(items.sort(byDesc((r) => r.reportedAt))), onError('البلاغات')),
      subscribeMerged<FeedbackItem>(feedbackSources, (items) => setFeedback(items.sort(byDesc((f) => f.createdAt))), onError('رسائل الزوار')),
    ];
    return () => unsubs.forEach((u) => u());
  }, [uid, role]);

  return {
    imams,
    mosques,
    applications,
    messages,
    reports,
    feedback,
    loading: !(loadedImams && loadedMosques),
    error,
  };
}

// ---------------------------------------------------------------------------
// Contact details (loaded on demand, protected by security rules)
// ---------------------------------------------------------------------------

const contactCache = new Map<string, ImamContact | MosqueContact | null>();

export function clearContactCache() {
  contactCache.clear();
}

/**
 * Loads the private contact details of an imam or a mosque.
 * Returns `denied: true` if the security rules refuse access (e.g. a visitor).
 */
export function useContact<T extends ImamContact | MosqueContact>(
  kind: 'imam' | 'mosque',
  id: string | undefined,
  enabled: boolean
): { contact: T | null; loading: boolean; denied: boolean } {
  const key = id ? `${kind}:${id}` : '';
  const [state, setState] = useState<{ contact: T | null; loading: boolean; denied: boolean }>(() => ({
    contact: (key && (contactCache.get(key) as T)) || null,
    loading: false,
    denied: false,
  }));

  useEffect(() => {
    if (!id || !enabled) {
      setState({ contact: null, loading: false, denied: !enabled });
      return;
    }
    if (contactCache.has(key)) {
      setState({ contact: (contactCache.get(key) as T) || null, loading: false, denied: false });
      return;
    }
    let cancelled = false;
    setState({ contact: null, loading: true, denied: false });
    getDoc(doc(db, kind === 'imam' ? 'imamContacts' : 'mosqueContacts', id))
      .then((snap) => {
        const data = snap.exists() ? (snap.data() as T) : null;
        contactCache.set(key, data);
        if (!cancelled) setState({ contact: data, loading: false, denied: false });
      })
      .catch((err) => {
        console.warn('[contact]', err);
        if (!cancelled) setState({ contact: null, loading: false, denied: true });
      });
    return () => {
      cancelled = true;
    };
  }, [key, enabled]);

  return state;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function createUserProfile(profile: UserProfile) {
  await setDoc(doc(db, 'users', profile.uid), profile);
}

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

// Private documents (visa, certificates) are stored in Firestore as base64 chunks:
// Cloud Storage is not enabled for this project (uploads there never finished).
// privateDocs/{imamId}_{kind} holds the details, privateDocs/{id}/chunks/{n} the data — owner and admins only.
const MAX_DOC_SIZE = 2 * 1024 * 1024; // 2 MB
const DOC_CHUNK = 700_000;
const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
export const PRIVATE_DOC_PREFIX = 'privateDocs/';

export function validateDocumentFile(file: File): string | null {
  if (!ALLOWED_DOC_TYPES.includes(file.type)) return 'نوع الملف غير مدعوم. المسموح: PDF أو JPG أو PNG أو WEBP.';
  // Photos are shrunk before upload, so only PDFs are limited by their raw size.
  if (file.type === 'application/pdf' && file.size > MAX_DOC_SIZE) return 'حجم ملف PDF أكبر من 2 ميغابايت. اضغطه أو صوّر الوثيقة بدلاً منه.';
  if (file.size > 15 * 1024 * 1024) return 'حجم الصورة أكبر من 15 ميغابايت.';
  return null;
}

async function readAsBase64(file: Blob): Promise<string> {
  const url = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('تعذر قراءة الملف.'));
    r.readAsDataURL(file);
  });
  return url.slice(url.indexOf(',') + 1);
}

async function uploadPrivateDocument(ownerUid: string, imamId: string, kind: 'visa' | 'certs', file: File) {
  let mime = file.type;
  let b64: string;
  if (mime.startsWith('image/')) {
    const dataUrl = await compressImage(file, 1600, 1_200_000);
    mime = 'image/jpeg';
    b64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  } else {
    b64 = await readAsBase64(file);
  }
  const chunks = Array.from({ length: Math.ceil(b64.length / DOC_CHUNK) }, (_, i) => b64.slice(i * DOC_CHUNK, (i + 1) * DOC_CHUNK));
  if (chunks.length > 4) throw new Error('الملف كبير جداً بعد المعالجة (الحد 2 ميغابايت).');
  const id = `${imamId}_${kind}`;
  const old = await getDoc(doc(db, 'privateDocs', id)).catch(() => null);
  const oldCount = old?.exists() ? Number(old.data().chunkCount) || 0 : 0;
  const batch = writeBatch(db);
  batch.set(doc(db, 'privateDocs', id), {
    ownerUid,
    imamId,
    kind,
    name: file.name.slice(0, 150),
    mime,
    size: Math.round((b64.length * 3) / 4),
    chunkCount: chunks.length,
    createdAt: nowIso(),
  });
  chunks.forEach((data, i) => batch.set(doc(db, 'privateDocs', id, 'chunks', String(i)), { data }));
  for (let i = chunks.length; i < oldCount; i++) batch.delete(doc(db, 'privateDocs', id, 'chunks', String(i)));
  await batch.commit();
  return { path: `${PRIVATE_DOC_PREFIX}${id}`, name: file.name.slice(0, 150) };
}

async function deletePrivateDocument(path?: string) {
  if (!path?.startsWith(PRIVATE_DOC_PREFIX)) return; // old Cloud Storage paths: nothing stored there
  const id = path.slice(PRIVATE_DOC_PREFIX.length);
  try {
    const meta = await getDoc(doc(db, 'privateDocs', id));
    const n = meta.exists() ? Number(meta.data().chunkCount) || 0 : 0;
    const batch = writeBatch(db);
    for (let i = 0; i < n; i++) batch.delete(doc(db, 'privateDocs', id, 'chunks', String(i)));
    batch.delete(doc(db, 'privateDocs', id));
    await batch.commit();
  } catch {
    // Already gone or no permission — not critical.
  }
}

/** Opens a private document (owner or admin) in a new tab / download. */
export async function openPrivateDocument(path: string) {
  if (!path.startsWith(PRIVATE_DOC_PREFIX)) throw new Error('هذا الملف رُفع بنسخة قديمة ولم يُحفظ. ارفعه من جديد.');
  const id = path.slice(PRIVATE_DOC_PREFIX.length);
  const meta = await getDoc(doc(db, 'privateDocs', id));
  if (!meta.exists()) throw new Error('الملف غير موجود.');
  const { chunkCount, mime, name } = meta.data() as { chunkCount: number; mime: string; name: string };
  const parts = await Promise.all(Array.from({ length: chunkCount }, (_, i) => getDoc(doc(db, 'privateDocs', id, 'chunks', String(i)))));
  const bin = atob(parts.map((p) => (p.data()?.data as string) || '').join(''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.download = `${id}.${mime === 'application/pdf' ? 'pdf' : 'jpg'}`;
  void name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// ---------------------------------------------------------------------------
// Imams
// ---------------------------------------------------------------------------

/** Fields an imam (or admin) may edit. */
export type ImamEditableFields = Pick<
  ImamProfile,
  | 'name'
  | 'age'
  | 'country'
  | 'nationality'
  | 'titles'
  | 'currentJob'
  | 'experiences'
  | 'certificates'
  | 'preferredLocations'
  | 'languageList'
  | 'maritalStatus'
  | 'livesInEurope'
  | 'hasVisa'
  | 'visaDetails'
  | 'hasCerts'
  | 'degree'
  | 'riwaya'
  | 'languages'
  | 'germanLevel'
  | 'youtubeUrl'
  | 'cvText'
  | 'availabilityState'
  | 'ramadanNote'
  | 'availableAfterDate'
>;

export async function saveImam(params: {
  existing: ImamProfile | null;
  fields: ImamEditableFields;
  contact: Omit<ImamContact, 'ownerUid'>;
  files: ImamFormFiles;
  actorUid: string;
  actorIsAdmin: boolean;
}): Promise<string> {
  const { existing, fields, contact, files, actorUid, actorIsAdmin } = params;

  // Self-registered imams: document id === uid (one profile per account).
  const id = existing?.id ?? (actorIsAdmin ? doc(collection(db, 'imams')).id : actorUid);
  const ownerUid = existing?.ownerUid ?? actorUid;

  const data: Record<string, unknown> = {
    ...fields,
    age: Math.round(Number(fields.age)),
    updatedAt: nowIso(),
  };
  if (files.photo !== undefined) data.photo = files.photo;

  // Private documents go to Firestore (owner and admins only).
  if (files.visaFile) {
    const up = await uploadPrivateDocument(ownerUid, id, 'visa', files.visaFile);
    data.visaFilePath = up.path;
    data.visaFileName = up.name;
    if (existing?.visaFilePath !== up.path) await deletePrivateDocument(existing?.visaFilePath);
  }
  if (files.certsFile) {
    const up = await uploadPrivateDocument(ownerUid, id, 'certs', files.certsFile);
    data.certsFilePath = up.path;
    data.certsFileName = up.name;
    if (existing?.certsFilePath !== up.path) await deletePrivateDocument(existing?.certsFilePath);
  }

  const batch = writeBatch(db);
  if (existing) {
    batch.set(doc(db, 'imams', id), data, { merge: true });
  } else {
    batch.set(doc(db, 'imams', id), {
      photo: '',
      ...data,
      ownerUid,
      approvalStatus: actorIsAdmin ? 'approved' : 'pending',
      isVerified: actorIsAdmin,
      createdAt: nowIso(),
    });
  }
  batch.set(doc(db, 'imamContacts', id), { ...contact, ownerUid });
  await batch.commit();
  contactCache.delete(`imam:${id}`);
  return id;
}

export async function updateImamAvailability(id: string, availabilityState: AvailabilityState) {
  await updateDoc(doc(db, 'imams', id), { availabilityState, updatedAt: nowIso() });
}

export async function updateImamRamadan(id: string, ramadanNote: string, availableAfterDate: string) {
  await updateDoc(doc(db, 'imams', id), { ramadanNote, availableAfterDate, updatedAt: nowIso() });
}

export async function setImamApproval(id: string, status: 'approved' | 'rejected') {
  await updateDoc(doc(db, 'imams', id), {
    approvalStatus: status,
    isVerified: status === 'approved',
    updatedAt: nowIso(),
  });
}

export async function deleteImam(imam: ImamProfile) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'imams', imam.id));
  batch.delete(doc(db, 'imamContacts', imam.id));
  batch.delete(doc(db, 'recitations', imam.id));
  await batch.commit();
  contactCache.delete(`imam:${imam.id}`);
  await deletePrivateDocument(imam.visaFilePath);
  await deletePrivateDocument(imam.certsFilePath);
}

// ---------------------------------------------------------------------------
// Recitation sample (audio in recitations/{imamId}, public summary in imams/{imamId}.recitationMeta)
// ---------------------------------------------------------------------------

/** Saves (or replaces) the imam's recitation sample. */
export async function saveRecitation(imam: Pick<ImamProfile, 'id' | 'ownerUid'>, meta: Omit<RecitationMeta, 'createdAt'>, audio: string) {
  const createdAt = nowIso();
  const summary: RecitationMeta = { ...meta, title: meta.title.trim().slice(0, 120), createdAt };
  const batch = writeBatch(db);
  batch.set(doc(db, 'recitations', imam.id), { ...summary, ownerUid: imam.ownerUid, audio } satisfies Recitation);
  batch.update(doc(db, 'imams', imam.id), { recitationMeta: summary, updatedAt: nowIso() });
  await batch.commit();
  recitationCache.delete(imam.id);
}

/** Changes who may listen, without re-uploading the audio. */
export async function setRecitationVisibility(imam: Pick<ImamProfile, 'id' | 'recitationMeta'>, visibility: RecitationMeta['visibility']) {
  if (!imam.recitationMeta) return;
  const batch = writeBatch(db);
  batch.update(doc(db, 'recitations', imam.id), { visibility });
  batch.update(doc(db, 'imams', imam.id), { recitationMeta: { ...imam.recitationMeta, visibility }, updatedAt: nowIso() });
  await batch.commit();
  recitationCache.delete(imam.id);
}

export async function deleteRecitation(imamId: string) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'recitations', imamId));
  batch.update(doc(db, 'imams', imamId), { recitationMeta: null, updatedAt: nowIso() });
  await batch.commit();
  recitationCache.delete(imamId);
}

const recitationCache = new Map<string, string | null>();

/**
 * Loads the audio of a recitation sample when the viewer opens the profile (never autoplayed).
 * `denied` = the imam's privacy setting does not allow this viewer.
 */
export function useRecitationAudio(imamId: string | undefined, enabled: boolean, version?: string) {
  const [state, setState] = useState<{ audio: string | null; loading: boolean; denied: boolean }>({ audio: null, loading: false, denied: false });
  useEffect(() => {
    if (!imamId || !enabled) {
      setState({ audio: null, loading: false, denied: false });
      return;
    }
    if (recitationCache.has(imamId)) {
      setState({ audio: recitationCache.get(imamId) ?? null, loading: false, denied: false });
      return;
    }
    let cancelled = false;
    setState({ audio: null, loading: true, denied: false });
    getDoc(doc(db, 'recitations', imamId))
      .then((snap) => {
        const audio = snap.exists() ? (snap.data() as Recitation).audio : null;
        recitationCache.set(imamId, audio);
        if (!cancelled) setState({ audio, loading: false, denied: false });
      })
      .catch(() => !cancelled && setState({ audio: null, loading: false, denied: true }));
    return () => {
      cancelled = true;
    };
  }, [imamId, enabled, version]);
  return state;
}

// ---------------------------------------------------------------------------
// Mosques
// ---------------------------------------------------------------------------

export type MosqueEditableFields = Pick<
  MosqueJob,
  | 'mosqueName'
  | 'legalName'
  | 'country'
  | 'city'
  | 'fullAddress'
  | 'lookingType'
  | 'riwayaRequired'
  | 'activeState'
  | 'requirements'
  | 'details'
  | 'salaryAndBenefits'
  | 'housingProvided'
  | 'photo'
>;

export async function saveMosque(params: {
  existing: MosqueJob | null;
  fields: MosqueEditableFields;
  contact: Omit<MosqueContact, 'ownerUid'>;
  actorUid: string;
  actorIsAdmin: boolean;
}): Promise<string> {
  const { existing, fields, contact, actorUid, actorIsAdmin } = params;
  const id = existing?.id ?? doc(collection(db, 'mosques')).id;
  const ownerUid = existing?.ownerUid ?? actorUid;

  const batch = writeBatch(db);
  if (existing) {
    batch.set(doc(db, 'mosques', id), { ...fields, updatedAt: nowIso() }, { merge: true });
  } else {
    batch.set(doc(db, 'mosques', id), {
      ...fields,
      ownerUid,
      approvalStatus: actorIsAdmin ? 'approved' : 'pending',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  }
  batch.set(doc(db, 'mosqueContacts', id), { ...contact, ownerUid });
  await batch.commit();
  contactCache.delete(`mosque:${id}`);
  return id;
}

/**
 * Approving a mosque also marks its owner as a "verified mosque", which unlocks imam contact details.
 */
export async function setMosqueApproval(mosque: MosqueJob, status: 'approved' | 'rejected', adminUid: string) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'mosques', mosque.id), { approvalStatus: status, updatedAt: nowIso() });
  if (status === 'approved' && mosque.ownerUid !== adminUid) {
    batch.update(doc(db, 'users', mosque.ownerUid), { verified: true });
  }
  await batch.commit();
  if (status === 'rejected' && mosque.ownerUid !== adminUid) await refreshOwnerVerified(mosque.ownerUid);
}

/**
 * Removes the "verified mosque" flag from an owner who no longer has any approved mosque
 * (after a rejection or a deletion), so they stop seeing imam contact details.
 * Callable by an admin or by the owner (the rules only let owners set verified to false).
 */
async function refreshOwnerVerified(ownerUid: string) {
  try {
    const owned = await getDocs(query(collection(db, 'mosques'), where('ownerUid', '==', ownerUid)));
    if (owned.docs.some((d) => d.data().approvalStatus === 'approved')) return;
    await updateDoc(doc(db, 'users', ownerUid), { verified: false });
  } catch (err) {
    console.warn('[verified]', err);
  }
}

export async function setMosqueActive(id: string, activeState: 'active' | 'closed') {
  await updateDoc(doc(db, 'mosques', id), { activeState, updatedAt: nowIso() });
}

export async function deleteMosque(mosque: Pick<MosqueJob, 'id' | 'ownerUid'>, refreshVerified = true) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'mosques', mosque.id));
  batch.delete(doc(db, 'mosqueContacts', mosque.id));
  await batch.commit();
  contactCache.delete(`mosque:${mosque.id}`);
  if (refreshVerified && mosque.ownerUid) await refreshOwnerVerified(mosque.ownerUid);
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

export async function applyToMosque(mosque: MosqueJob, imam: ImamProfile, imamUid: string, note: string) {
  const id = `${mosque.id}_${imamUid}`;
  const app: Omit<Application, 'id'> = {
    mosqueId: mosque.id,
    mosqueOwnerUid: mosque.ownerUid,
    mosqueName: mosque.mosqueName,
    imamId: imam.id,
    imamUid,
    imamName: imam.name,
    imamCountry: imam.country,
    imamRiwaya: imam.riwaya,
    appliedAt: nowIso(),
    status: 'pending',
    note: note.trim().slice(0, 2000),
  };
  await setDoc(doc(db, 'applications', id), app);
}

export async function setApplicationStatus(id: string, status: ApplicationStatus) {
  await updateDoc(doc(db, 'applications', id), { status });
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export type NewMessage = Omit<PlatformMessage, 'id' | 'sentAt' | 'isRead' | 'participants'>;

export async function sendMessage(msg: NewMessage) {
  const clean: Record<string, unknown> = {
    ...msg,
    subject: msg.subject.trim().slice(0, 200),
    content: msg.content.trim().slice(0, 5000),
    participants: [msg.senderUid, msg.receiverUid],
    sentAt: nowIso(),
    isRead: false,
  };
  // Firestore rejects `undefined` values.
  Object.keys(clean).forEach((k) => clean[k] === undefined && delete clean[k]);
  await addDoc(collection(db, 'messages'), clean);
}

export async function markMessageRead(id: string) {
  await updateDoc(doc(db, 'messages', id), { isRead: true });
}

export async function deleteMessage(id: string) {
  await deleteDoc(doc(db, 'messages', id));
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export async function createReport(report: Omit<ReportItem, 'id' | 'reportedAt' | 'status'>) {
  await addDoc(collection(db, 'reports'), {
    ...report,
    reason: report.reason.slice(0, 300),
    details: report.details.trim().slice(0, 2000),
    reportedAt: nowIso(),
    status: 'pending',
  });
}

export async function resolveReport(id: string) {
  await updateDoc(doc(db, 'reports', id), { status: 'reviewed' });
}

// ---------------------------------------------------------------------------
// Feedback ("contact the admin" / suggestions) — anyone may send, only admins read
// ---------------------------------------------------------------------------

export async function sendFeedback(item: Pick<FeedbackItem, 'kind' | 'name' | 'email' | 'message'>) {
  const uid = auth.currentUser?.uid;
  await addDoc(collection(db, 'feedback'), {
    kind: item.kind,
    name: item.name.trim().slice(0, 120),
    email: item.email.trim().slice(0, 200),
    message: item.message.trim().slice(0, 3000),
    ...(uid ? { senderUid: uid } : {}),
    createdAt: nowIso(),
    status: 'new',
  });
}

export async function setFeedbackHandled(id: string) {
  await updateDoc(doc(db, 'feedback', id), { status: 'handled' });
}

export async function deleteFeedback(id: string) {
  await deleteDoc(doc(db, 'feedback', id));
}

// ---------------------------------------------------------------------------
// Account deletion (GDPR "right to erasure")
// ---------------------------------------------------------------------------

export async function deleteMyData(uid: string) {
  // Imam profile (id === uid for self-registered imams)
  const imamSnap = await getDoc(doc(db, 'imams', uid)).catch(() => null);
  if (imamSnap?.exists()) {
    await deleteImam({ ...(imamSnap.data() as ImamProfile), id: uid });
  }

  // Mosques owned by this user
  const myMosques = await getDocs(query(collection(db, 'mosques'), where('ownerUid', '==', uid)));
  for (const m of myMosques.docs) await deleteMosque({ id: m.id, ownerUid: uid }, false);

  // Applications sent as an imam, and applications received as a mosque
  const myApps = await getDocs(query(collection(db, 'applications'), where('imamUid', '==', uid)));
  for (const a of myApps.docs) await deleteDoc(a.ref);
  const receivedApps = await getDocs(query(collection(db, 'applications'), where('mosqueOwnerUid', '==', uid)));
  for (const a of receivedApps.docs) await deleteDoc(a.ref);

  // Messages sent or received
  const myMsgs = await getDocs(query(collection(db, 'messages'), where('participants', 'array-contains', uid)));
  for (const m of myMsgs.docs) await deleteDoc(m.ref);

  // Community: own posts, saved posts and notifications (comments on others' posts stay, under the author's name).
  const myPosts = await getDocs(query(collection(db, 'posts'), where('authorUid', '==', uid))).catch(() => null);
  for (const p of myPosts?.docs ?? []) await deleteDoc(p.ref).catch(() => {});
  for (const sub of ['saved', 'notifications']) {
    const snap = await getDocs(collection(db, 'users', uid, sub)).catch(() => null);
    for (const d of snap?.docs ?? []) await deleteDoc(d.ref).catch(() => {});
  }

  await deleteDoc(doc(db, 'users', uid));

  // Finally the Firebase Auth account. The caller re-authenticates first (reauthenticate() in lib/auth),
  // otherwise Firebase refuses with "requires-recent-login" after the data is already gone.
  if (auth.currentUser && auth.currentUser.uid === uid) {
    await auth.currentUser.delete();
  }
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export function describeError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  if (code.includes('permission-denied')) return 'ليست لديك صلاحية لتنفيذ هذا الإجراء.';
  if (code.includes('unavailable') || code.includes('network')) return 'تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.';
  if (code.includes('requires-recent-login')) return 'لأسباب أمنية، يرجى تسجيل الخروج ثم الدخول مجدداً وإعادة المحاولة.';
  if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) return 'تم إغلاق نافذة تسجيل الدخول قبل الإكمال.';
  if (code.includes('popup-blocked')) return 'المتصفح منع نافذة تسجيل الدخول. اسمح بالنوافذ المنبثقة لهذا الموقع.';
  if (code.includes('account-exists-with-different-credential'))
    return 'هذا البريد مسجل مسبقاً بطريقة دخول أخرى. جرّب الدخول بجوجل.';
  if (code.includes('unauthorized-domain')) return 'هذا النطاق غير مصرح به في إعدادات Firebase Authentication.';
  if (code.includes('operation-not-allowed')) return 'طريقة تسجيل الدخول هذه غير مفعلة في إعدادات Firebase.';
  if (code.includes('storage/')) return 'تعذر رفع الملف. تحقق من حجمه ونوعه ثم أعد المحاولة.';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found'))
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  if (code.includes('email-already-in-use')) return 'هذا البريد مسجّل مسبقاً. سجّل الدخول، أو استعمل «نسيت كلمة المرور».';
  if (code.includes('weak-password')) return 'كلمة المرور ضعيفة. استعمل 8 أحرف على الأقل.';
  if (code.includes('invalid-email')) return 'البريد الإلكتروني غير صحيح.';
  if (code.includes('invalid-phone-number')) return 'رقم الهاتف غير صحيح. اكتبه بالصيغة الدولية، مثل ‎+49 151 2345678';
  if (code.includes('invalid-verification-code')) return 'رمز التحقق غير صحيح.';
  if (code.includes('code-expired')) return 'انتهت صلاحية الرمز. اطلب رمزاً جديداً.';
  if (code.includes('too-many-requests')) return 'محاولات كثيرة. انتظر قليلاً ثم حاول مجدداً.';
  if (code.includes('billing-not-enabled') || code.includes('quota-exceeded'))
    return 'الدخول بالهاتف غير متاح حالياً (يتطلب تفعيل الرسائل في Firebase).';
  return 'حدث خطأ غير متوقع. حاول مرة أخرى.';
}
