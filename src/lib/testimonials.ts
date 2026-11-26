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
  city: string;
  text: string;
  createdAt: string;
  status: TestimonialStatus;
  uid?: string;
}

export const TESTIMONIAL_ROLES: { value: TestimonialRole; label: string }[] = [
  { value: 'imam', label: 'إمام / قارئ' },
  { value: 'mosque', label: 'مسجد / جمعية' },
  { value: 'visitor', label: 'زائر' },
];

export const TESTIMONIAL_MIN = 15;
export const TESTIMONIAL_MAX = 800;

export async function submitTestimonial(input: { name: string; role: TestimonialRole; city: string; text: string; uid?: string | null }) {
  await addDoc(collection(db, 'testimonials'), {
    name: input.name.trim().slice(0, 80),
    role: input.role,
    city: input.city.trim().slice(0, 80),
    text: input.text.trim().slice(0, TESTIMONIAL_MAX),
    createdAt: nowIso(),
    status: 'pending',
    ...(input.uid ? { uid: input.uid } : {}),
  });
}

const sortNewest = (a: Testimonial, b: Testimonial) => (b.createdAt || '').localeCompare(a.createdAt || '');

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
export const deleteTestimonial = (id: string) => deleteDoc(doc(db, 'testimonials', id));
