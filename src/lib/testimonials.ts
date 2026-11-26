import { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { nowIso } from './db';

/*
 * «What they said about Aemmah»: opinions sent by imams, mosques and visitors. Every opinion is saved as
 * «pending» and is shown on the site only after an admin approves it (also enforced by firestore.rules).
 */

export type TestimonialRole = 'imam' | 'mosque' | 'visitor';
export type TestimonialStatus = 'pending' | 'approved' | 'rejected';

export interface Testimonial {
  id: string;
  name: string;
  role: TestimonialRole;
  /** Job title or a short introduction, shown under the name. */
  bio?: string;
  city: string;
  /** Answers to the three questions (QUESTIONS). */
  idea?: string;
  design?: string;
  suggestions?: string;
  /** Free text of opinions sent before the questions existed. */
  text?: string;
  createdAt: string;
  status: TestimonialStatus;
  /** Chosen by the admin: shown first. */
  pinned?: boolean;
  uid?: string;
}

/** The three questions every opinion answers (at least one of them). */
export const QUESTIONS: { key: 'idea' | 'design' | 'suggestions'; label: string; placeholder: string }[] = [
  { key: 'idea', label: 'ما رأيك في فكرة المنصة؟', placeholder: 'هل تراها نافعة للأئمة والمساجد؟ ولماذا؟' },
  { key: 'design', label: 'ما رأيك في تصميمها ومحتواها؟', placeholder: 'الشكل، سهولة الاستعمال، المعلومات المعروضة…' },
  { key: 'suggestions', label: 'ما اقتراحاتك لتطويرها؟', placeholder: 'ما الذي تتمنى أن نضيفه أو نحسّنه؟' },
];

export const TESTIMONIAL_ROLES: { value: TestimonialRole; label: string }[] = [
  { value: 'imam', label: 'إمام / قارئ' },
  { value: 'mosque', label: 'مسجد / جمعية' },
  { value: 'visitor', label: 'زائر' },
];

export const TESTIMONIAL_MIN = 10; // per answered question
export const TESTIMONIAL_MAX = 600; // per question

export async function submitTestimonial(input: {
  name: string;
  role: TestimonialRole;
  bio: string;
  city: string;
  idea: string;
  design: string;
  suggestions: string;
  uid?: string | null;
}) {
  const cut = (v: string, n: number) => v.trim().slice(0, n);
  await addDoc(collection(db, 'testimonials'), {
    name: cut(input.name, 80),
    role: input.role,
    bio: cut(input.bio, 120),
    city: cut(input.city, 80),
    idea: cut(input.idea, TESTIMONIAL_MAX),
    design: cut(input.design, TESTIMONIAL_MAX),
    suggestions: cut(input.suggestions, TESTIMONIAL_MAX),
    createdAt: nowIso(),
    status: 'pending',
    ...(input.uid ? { uid: input.uid } : {}),
  });
}

/** Pinned first, then newest first. */
const sortNewest = (a: Testimonial, b: Testimonial) =>
  Number(!!b.pinned) - Number(!!a.pinned) || (b.createdAt || '').localeCompare(a.createdAt || '');

/** Approved opinions (public). `all` = every opinion, for the admin panel. */
export function useTestimonials(all = false): { items: Testimonial[]; loaded: boolean } {
  const [state, setState] = useState<{ items: Testimonial[]; loaded: boolean }>({ items: [], loaded: false });
  useEffect(() => {
    const col = collection(db, 'testimonials');
    const q = all ? col : query(col, where('status', '==', 'approved'));
    return onSnapshot(
      q,
      (snap) => setState({ items: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Testimonial, 'id'>) })).sort(sortNewest), loaded: true }),
      () => setState({ items: [], loaded: true })
    );
  }, [all]);
  return state;
}

export const setTestimonialStatus = (id: string, status: TestimonialStatus) => updateDoc(doc(db, 'testimonials', id), { status });
export const setTestimonialPinned = (id: string, pinned: boolean) => updateDoc(doc(db, 'testimonials', id), { pinned });
export const deleteTestimonial = (id: string) => deleteDoc(doc(db, 'testimonials', id));
