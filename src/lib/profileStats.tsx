import { useEffect, useState } from 'react';
import { collection, doc, increment, onSnapshot, setDoc } from 'firebase/firestore';
import { Eye, Headphones } from 'lucide-react';
import React from 'react';
import { db } from '../firebase';

/**
 * Anonymous counters per profile: how often an imam / mosque card was opened and how often the recitation
 * was played. profileStats/{imam|mosque}_{id} = { views, plays }. Anyone may add exactly +1 (firestore.rules),
 * only admins can read. Counted once per browser session and never for the owner or an admin.
 */
export type ProfileKind = 'imam' | 'mosque';
export interface ProfileStat {
  views: number;
  plays: number;
}

const SEEN_KEY = 'aemmah-counted';

function once(key: string): boolean {
  try {
    const seen = new Set<string>(JSON.parse(sessionStorage.getItem(SEEN_KEY) || '[]'));
    if (seen.has(key)) return false;
    seen.add(key);
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-300)));
  } catch {
    // storage blocked: count anyway (still at most once per mount)
  }
  return true;
}

const ref = (kind: ProfileKind, id: string) => doc(db, 'profileStats', `${kind}_${id}`);

export function countProfileView(kind: ProfileKind, id: string) {
  if (typeof navigator !== 'undefined' && navigator.webdriver) return;
  if (!once(`v:${kind}:${id}`)) return;
  setDoc(ref(kind, id), { views: increment(1) }, { merge: true }).catch((e) => console.warn('[profileStats]', e));
}

export function countRecitationPlay(imamId: string) {
  if (typeof navigator !== 'undefined' && navigator.webdriver) return;
  if (!once(`p:imam:${imamId}`)) return;
  setDoc(ref('imam', imamId), { plays: increment(1) }, { merge: true }).catch((e) => console.warn('[profileStats]', e));
}

/** Admin only: every counter, keyed "imam_<id>" / "mosque_<id>". */
export function useProfileStats(enabled: boolean): Map<string, ProfileStat> {
  const [stats, setStats] = useState<Map<string, ProfileStat>>(new Map());
  useEffect(() => {
    if (!enabled) return;
    return onSnapshot(
      collection(db, 'profileStats'),
      (snap) => setStats(new Map(snap.docs.map((d) => [d.id, { views: Number(d.data().views) || 0, plays: Number(d.data().plays) || 0 }]))),
      (err) => console.warn('[profileStats]', err)
    );
  }, [enabled]);
  return stats;
}

/** Counter of one profile (admin only). */
export function useProfileStat(kind: ProfileKind, id: string | undefined, enabled: boolean): ProfileStat | null {
  const [stat, setStat] = useState<ProfileStat | null>(null);
  useEffect(() => {
    if (!enabled || !id) return;
    return onSnapshot(
      ref(kind, id),
      (s) => setStat({ views: Number(s.data()?.views) || 0, plays: Number(s.data()?.plays) || 0 }),
      () => setStat(null)
    );
  }, [kind, id, enabled]);
  return stat;
}

/** Small admin strip in the profile windows: «👁 12 زيارة · 🎧 5 استماع». */
export const AdminStatStrip: React.FC<{ kind: ProfileKind; id: string; showPlays?: boolean }> = ({ kind, id, showPlays }) => {
  const stat = useProfileStat(kind, id, true);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600" title="للإدارة فقط: مرات فتح الملف ومرات الاستماع إلى التلاوة">
      <span className="inline-flex items-center gap-1 bg-slate-100 rounded-full px-2.5 py-1">
        <Eye className="w-3.5 h-3.5" /> <span className="tabular-nums">{stat?.views ?? 0}</span> زيارة
      </span>
      {showPlays && (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 rounded-full px-2.5 py-1">
          <Headphones className="w-3.5 h-3.5" /> <span className="tabular-nums">{stat?.plays ?? 0}</span> استماع
        </span>
      )}
    </span>
  );
};
