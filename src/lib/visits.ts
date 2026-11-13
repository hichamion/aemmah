import { useEffect, useState } from 'react';
import { addDoc, collection, getCountFromServer, query, serverTimestamp, Timestamp, where } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Anonymous visit statistics (admins only can read them).
 *
 * - Every new opening of the site adds visits/{auto} = { at: server time }. Reloads and back/forward
 *   navigations are not counted (Navigation Timing API), and only once per tab session.
 *   Nothing is stored on the device for this, no IP, no name, no fingerprint.
 * - Only if the visitor agrees (TDDDG § 25 / GDPR), a random number is kept in this browser so that
 *   a first visit also adds visitors/{auto} = { at } — this gives the approximate number of unique visitors.
 * - firestore.rules: create-only, the time must be the server's, nobody can edit or delete, admins read.
 */

const CONSENT_KEY = 'aemmah-stats-consent'; // 'yes' | 'no' — the visitor's own choice
const VISITOR_KEY = 'aemmah-vid';
const SESSION_KEY = 'aemmah-visit-counted';

export type StatsConsent = 'yes' | 'no' | null;

const safeGet = (s: Storage | undefined, k: string) => {
  try {
    return s?.getItem(k) ?? null;
  } catch {
    return null;
  }
};
const safeSet = (s: Storage | undefined, k: string, v: string) => {
  try {
    s?.setItem(k, v);
  } catch {
    // private mode / storage blocked: ignore
  }
};
const local = () => (typeof window !== 'undefined' ? window.localStorage : undefined);
const session = () => (typeof window !== 'undefined' ? window.sessionStorage : undefined);

/** Global Privacy Control / Do Not Track mean "no" without asking. */
const privacySignal = () =>
  typeof navigator !== 'undefined' &&
  ((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true || navigator.doNotTrack === '1');

export function getStatsConsent(): StatsConsent {
  if (privacySignal()) return 'no';
  const v = safeGet(local(), CONSENT_KEY);
  return v === 'yes' || v === 'no' ? v : null;
}

export function setStatsConsent(v: 'yes' | 'no') {
  safeSet(local(), CONSENT_KEY, v);
  if (v === 'no') {
    try {
      local()?.removeItem(VISITOR_KEY);
    } catch {
      // ignore
    }
  } else void countUniqueVisitor();
}

let started = false;

/** Called once when the app starts. */
export async function trackVisit() {
  if (started || typeof window === 'undefined') return;
  started = true;
  // Automated browsers (crawlers, test robots) are not visitors.
  if (navigator.webdriver) return;
  const nav = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (nav && (nav.type === 'reload' || nav.type === 'back_forward')) return;
  // The same visit continuing in this tab (e.g. coming back from a login redirect).
  if (getStatsConsent() === 'yes' && safeGet(session(), SESSION_KEY)) return;
  try {
    await addDoc(collection(db, 'visits'), { at: serverTimestamp() });
    if (getStatsConsent() === 'yes') {
      safeSet(session(), SESSION_KEY, '1');
      await countUniqueVisitor();
    }
  } catch (err) {
    console.warn('[visits]', err);
  }
}

async function countUniqueVisitor() {
  if (safeGet(local(), VISITOR_KEY)) return;
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random()).slice(2);
  safeSet(local(), VISITOR_KEY, id);
  try {
    await addDoc(collection(db, 'visitors'), { at: serverTimestamp() });
  } catch (err) {
    console.warn('[visitors]', err);
  }
}

// ---------------------------------------------------------------------------
// Admin: aggregated counts (Firestore count() queries — no documents are downloaded)
// ---------------------------------------------------------------------------

export interface VisitStats {
  visits: { total: number; d7: number; d30: number; today: number };
  visitors: { total: number; d7: number; d30: number };
  /** Visits per day, oldest first (last 14 days). */
  daily: { day: string; count: number }[];
}

const countSince = async (col: 'visits' | 'visitors', from?: Date, to?: Date) => {
  const c = collection(db, col);
  const parts = [];
  if (from) parts.push(where('at', '>=', Timestamp.fromDate(from)));
  if (to) parts.push(where('at', '<', Timestamp.fromDate(to)));
  const snap = await getCountFromServer(parts.length ? query(c, ...parts) : c);
  return snap.data().count;
};

export async function loadVisitStats(): Promise<VisitStats> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysAgo = (n: number) => new Date(startOfToday.getTime() - n * 86400000);
  const days = Array.from({ length: 14 }, (_, i) => daysAgo(13 - i));
  const [vTotal, v7, v30, vToday, uTotal, u7, u30, ...daily] = await Promise.all([
    countSince('visits'),
    countSince('visits', daysAgo(6)),
    countSince('visits', daysAgo(29)),
    countSince('visits', startOfToday),
    countSince('visitors'),
    countSince('visitors', daysAgo(6)),
    countSince('visitors', daysAgo(29)),
    ...days.map((d) => countSince('visits', d, new Date(d.getTime() + 86400000))),
  ]);
  return {
    visits: { total: vTotal, d7: v7, d30: v30, today: vToday },
    visitors: { total: uTotal, d7: u7, d30: u30 },
    daily: days.map((d, i) => ({ day: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, count: daily[i] })),
  };
}

export function useVisitStats(enabled: boolean) {
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setError('');
    loadVisitStats()
      .then((s) => !cancelled && setStats(s))
      .catch((e) => !cancelled && setError((e as { code?: string })?.code || 'error'));
    return () => {
      cancelled = true;
    };
  }, [enabled, tick]);
  return { stats, error, reload: () => setTick((t) => t + 1) };
}
