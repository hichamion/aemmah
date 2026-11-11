import React from 'react';
import { RefreshCw } from 'lucide-react';

/** Errors that mean «this page still runs an older version of the site» (its code files were replaced by an update). */
export const isStaleChunkError = (err: unknown) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Loading chunk/i.test(
    String((err as { message?: string })?.message ?? err)
  );

const RELOAD_KEY = 'aemmah-reloaded-for-update';

/** Reloads once per session to pick up the new version of the site. Returns false if it already did. */
export function reloadForUpdate(): boolean {
  try {
    if (sessionStorage.getItem(RELOAD_KEY)) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // storage blocked: reload anyway
  }
  window.location.reload();
  return true;
}

/**
 * Last line of defence: instead of a frozen / empty screen, show what happened and a reload button.
 * After an update, a phone that still runs the old version reloads itself automatically.
 */
export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: unknown }> {
  state = { error: null as unknown };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch(error: unknown) {
    console.error('[app]', error);
    if (isStaleChunkError(error)) reloadForUpdate();
  }

  render() {
    if (!this.state.error) return this.props.children;
    const stale = isStaleChunkError(this.state.error);
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-24" role="alert">
        <div className="max-w-sm text-center space-y-4 bg-white rounded-3xl border border-slate-200 shadow-xl p-7">
          <p className="text-4xl" aria-hidden>{stale ? '🔄' : '⚠️'}</p>
          <h2 className="text-xl font-black text-slate-900">{stale ? 'صدرت نسخة جديدة من الموقع' : 'حدث خطأ غير متوقع'}</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {stale ? 'أعد تحميل الصفحة لاستعمال النسخة الجديدة.' : 'أعد تحميل الصفحة. إن تكرر الخطأ فراسل الإدارة.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-full cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> إعادة التحميل
          </button>
        </div>
      </div>
    );
  }
}
