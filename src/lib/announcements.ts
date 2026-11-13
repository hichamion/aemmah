import { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Announcements of the home banner, managed by admins («إعلانات الواجهة»).
 * announcements/{id} (public read, admin write) and siteSettings/home { showDefaultSlides }.
 */
export type AnnouncementTarget = 'imams' | 'mosques' | 'community' | 'imam-register' | 'mosque-add' | 'contact' | 'url' | 'none';

export interface Announcement {
  id: string;
  chip: string;
  title: string;
  text: string;
  cta: string;
  target: AnnouncementTarget;
  url: string;
  /** Compressed JPEG data URL, or '' for the patterned background. */
  image: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
export type AnnouncementInput = Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>;

export const TARGETS: { value: AnnouncementTarget; label: string }[] = [
  { value: 'imams', label: 'قائمة الأئمة' },
  { value: 'mosques', label: 'إعلانات المساجد' },
  { value: 'community', label: 'ملتقى الأئمة' },
  { value: 'imam-register', label: 'التسجيل كإمام' },
  { value: 'mosque-add', label: 'نشر إعلان مسجد' },
  { value: 'contact', label: 'راسل الإدارة' },
  { value: 'url', label: 'رابط خارجي' },
  { value: 'none', label: 'بدون زر' },
];

const now = () => new Date().toISOString();

export function useAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [showDefaults, setShowDefaults] = useState(true);
  useEffect(() => {
    const a = onSnapshot(
      collection(db, 'announcements'),
      (s) => setItems(s.docs.map((d) => ({ ...(d.data() as Omit<Announcement, 'id'>), id: d.id })).sort((x, y) => x.order - y.order)),
      (e) => console.warn('[announcements]', e)
    );
    const b = onSnapshot(
      doc(db, 'siteSettings', 'home'),
      (s) => setShowDefaults(s.exists() ? s.data().showDefaultSlides !== false : true),
      () => {}
    );
    return () => {
      a();
      b();
    };
  }, []);
  return { items, showDefaults };
}

export async function createAnnouncement(input: AnnouncementInput) {
  const t = now();
  await addDoc(collection(db, 'announcements'), { ...input, createdAt: t, updatedAt: t });
}
export async function updateAnnouncement(id: string, patch: Partial<AnnouncementInput>) {
  await updateDoc(doc(db, 'announcements', id), { ...patch, updatedAt: now() });
}
export async function deleteAnnouncement(id: string) {
  await deleteDoc(doc(db, 'announcements', id));
}
/** Saves a new order (index = position). */
export async function reorderAnnouncements(ids: string[]) {
  const batch = writeBatch(db);
  ids.forEach((id, i) => batch.update(doc(db, 'announcements', id), { order: i, updatedAt: now() }));
  await batch.commit();
}
export async function setShowDefaultSlides(showDefaultSlides: boolean) {
  await setDoc(doc(db, 'siteSettings', 'home'), { showDefaultSlides });
}
