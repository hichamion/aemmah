import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, Pause, Play, RotateCcw, Square, Trash2, Upload, Lock } from 'lucide-react';
import { ImamProfile, RecitationKind, RecitationMeta, RecitationVisibility } from '../types';
import {
  AudioError,
  checkAudioFile,
  encodeRecitation,
  formatSeconds,
  MAX_RECITATION_SECONDS,
  pickRecorderMime,
} from '../lib/audio';
import { deleteRecitation, saveRecitation, setRecitationVisibility } from '../lib/db';
import { formatDate } from '../utils/helpers';

export const RECITATION_KINDS: { value: RecitationKind; label: string }[] = [
  { value: 'fatiha', label: 'سورة الفاتحة' },
  { value: 'short_surah', label: 'سورة قصيرة' },
  { value: 'passage', label: 'مقطع قرآني أختاره' },
];

export const VISIBILITY_OPTIONS: { value: RecitationVisibility; label: string; hint: string }[] = [
  { value: 'public', label: 'الجميع', hint: 'كل زوار المنصة' },
  { value: 'members', label: 'المسجلون فقط', hint: 'الأئمة والمساجد المسجلون' },
  { value: 'mosques', label: 'المساجد الموثقة فقط', hint: 'المساجد التي وثقتها الإدارة' },
];

export const recitationLabel = (m: Pick<RecitationMeta, 'kind' | 'title'>) =>
  m.title.trim() || RECITATION_KINDS.find((k) => k.value === m.kind)?.label || 'عيّنة التلاوة';

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

/** Play / pause, progress bar (click to seek), elapsed and total time. Never starts on its own. */
export const RecitationPlayer: React.FC<{ src: string; title: string; durationSec: number; date?: string; dark?: boolean }> = ({
  src,
  title,
  durationSec,
  date,
  dark,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(durationSec);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  };
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // RTL bar: progress grows from the right.
    const ratio = Math.min(1, Math.max(0, (rect.right - e.clientX) / rect.width));
    a.currentTime = ratio * duration;
  };
  const pct = duration ? Math.min(100, (time / duration) * 100) : 0;

  return (
    <div className={`rounded-2xl p-3.5 flex items-center gap-3 ${dark ? 'bg-white/10 ring-1 ring-white/20' : 'bg-[#e6f6f9] border border-[#0b3a4f]/15'}`}>
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'إيقاف مؤقت' : 'تشغيل التلاوة'}
        className="w-12 h-12 shrink-0 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center shadow cursor-pointer"
      >
        {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
      </button>
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className={`font-black truncate ${dark ? 'text-white' : 'text-[#0b3a4f]'}`}>{title}</span>
          <span className={`text-xs tabular-nums shrink-0 ${dark ? 'text-white/70' : 'text-slate-500'}`} dir="ltr">
            {formatSeconds(time)} / {formatSeconds(duration)}
          </span>
        </div>
        <div
          role="slider"
          aria-label="موضع التلاوة"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(time)}
          tabIndex={0}
          onClick={seek}
          className={`h-2 rounded-full cursor-pointer overflow-hidden ${dark ? 'bg-white/20' : 'bg-[#0b3a4f]/15'}`}
        >
          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
        </div>
        {date && <p className={`text-[11px] ${dark ? 'text-white/60' : 'text-slate-500'}`}>أُضيفت في {formatDate(date)}</p>}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Recorder / uploader (imam's own profile)
// ---------------------------------------------------------------------------

type Draft = { dataUrl: string; durationSec: number };

export const RecitationManager: React.FC<{
  imam: ImamProfile;
  /** Current audio (to listen before replacing it), if any and loaded. */
  currentAudio: string | null;
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
}> = ({ imam, currentAudio, onSaved, onError }) => {
  const meta = imam.recitationMeta || null;
  const [kind, setKind] = useState<RecitationKind>(meta?.kind || 'fatiha');
  const [title, setTitle] = useState(meta?.title || '');
  const [visibility, setVisibility] = useState<RecitationVisibility>(meta?.visibility || 'members');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [recState, setRecState] = useState<'idle' | 'recording' | 'paused' | 'processing'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');

  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);

  const stopTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };
  const releaseMic = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  useEffect(() => () => {
    stopTimer();
    releaseMic();
  }, []);

  const process = async (blob: Blob) => {
    setRecState('processing');
    setProblem('');
    try {
      setDraft(await encodeRecitation(blob));
    } catch (err) {
      setProblem(err instanceof AudioError ? err.message : 'تعذر معالجة التسجيل.');
    } finally {
      setRecState('idle');
    }
  };

  const startRecording = async () => {
    setProblem('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setProblem('التسجيل المباشر غير مدعوم في هذا المتصفح. يمكنك رفع ملف صوتي بدلاً منه.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      const mime = pickRecorderMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        stopTimer();
        releaseMic();
        process(new Blob(chunksRef.current, { type: rec.mimeType || mime || 'audio/webm' }));
      };
      recRef.current = rec;
      elapsedRef.current = 0;
      setElapsed(0);
      setDraft(null);
      rec.start(250);
      setRecState('recording');
      timerRef.current = window.setInterval(() => {
        if (recRef.current?.state !== 'recording') return;
        elapsedRef.current += 0.25;
        setElapsed(elapsedRef.current);
        if (elapsedRef.current >= MAX_RECITATION_SECONDS) recRef.current.stop(); // hard limit
      }, 250);
    } catch (err) {
      releaseMic();
      const name = (err as DOMException)?.name;
      setProblem(
        name === 'NotAllowedError'
          ? 'لم يُسمح باستعمال الميكروفون. اسمح به من إعدادات المتصفح ثم أعد المحاولة.'
          : name === 'NotFoundError'
          ? 'لم يُعثر على ميكروفون في هذا الجهاز. يمكنك رفع ملف صوتي بدلاً منه.'
          : 'تعذر بدء التسجيل. أعد المحاولة أو ارفع ملفاً صوتياً.'
      );
    }
  };

  const pauseResume = () => {
    const rec = recRef.current;
    if (!rec) return;
    if (rec.state === 'recording') {
      rec.pause();
      setRecState('paused');
    } else if (rec.state === 'paused') {
      rec.resume();
      setRecState('recording');
    }
  };
  const stopRecording = () => recRef.current?.state !== 'inactive' && recRef.current?.stop();

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const err = checkAudioFile(file);
    if (err) return setProblem(err);
    process(file);
  };

  const save = async () => {
    if (!draft) return;
    if (kind !== 'fatiha' && !title.trim()) return setProblem('اكتب اسم السورة أو المقطع.');
    setBusy(true);
    try {
      await saveRecitation(imam, { kind, title: kind === 'fatiha' && !title.trim() ? 'سورة الفاتحة' : title, durationSec: draft.durationSec, visibility }, draft.dataUrl);
      setDraft(null);
      onSaved('تم حفظ عيّنة التلاوة.');
    } catch (err) {
      console.error(err);
      onError('تعذر حفظ التسجيل. تأكد من الاتصال وحاول مجدداً.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('حذف عيّنة التلاوة الحالية؟')) return;
    setBusy(true);
    try {
      await deleteRecitation(imam.id);
      onSaved('تم حذف عيّنة التلاوة.');
    } catch {
      onError('تعذر حذف التسجيل.');
    } finally {
      setBusy(false);
    }
  };

  const changeVisibility = async (v: RecitationVisibility) => {
    setVisibility(v);
    if (!meta || draft) return;
    try {
      await setRecitationVisibility(imam, v);
      onSaved('تم تحديث من يستطيع سماع التلاوة.');
    } catch {
      onError('تعذر تحديث الخصوصية.');
    }
  };

  const field = 'w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-sm';
  const recording = recState === 'recording' || recState === 'paused';

  return (
    <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 space-y-5">
      <header className="space-y-1">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Mic className="w-5 h-5 text-[#0e4d64]" /> عيّنة التلاوة
          <span className="text-xs font-bold text-slate-400">(اختيارية)</span>
        </h3>
        <p className="text-xs text-slate-500">
          سجّل أو ارفع مقطعاً قصيراً من تلاوتك ({MAX_RECITATION_SECONDS} ثانية كحد أقصى) لتستمع إليه المساجد عند فتح ملفك.
        </p>
      </header>

      {/* Current sample */}
      {meta && !draft && (
        <div className="space-y-2">
          {currentAudio ? (
            <RecitationPlayer src={currentAudio} title={recitationLabel(meta)} durationSec={meta.durationSec} date={meta.createdAt} />
          ) : (
            <p className="text-sm text-slate-600">العيّنة الحالية: {recitationLabel(meta)} ({formatSeconds(meta.durationSec)})</p>
          )}
          <button type="button" onClick={remove} disabled={busy} className="text-red-600 text-xs font-bold inline-flex items-center gap-1 cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" /> حذف العيّنة الحالية
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="space-y-1">
          <span className="text-xs font-bold text-slate-700">ما الذي تتلوه؟</span>
          <select className={field} value={kind} onChange={(e) => setKind(e.target.value as RecitationKind)}>
            {RECITATION_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold text-slate-700">{kind === 'fatiha' ? 'العنوان (اختياري)' : 'اسم السورة أو المقطع'}</span>
          <input className={field} maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={kind === 'fatiha' ? 'سورة الفاتحة' : kind === 'short_surah' ? 'مثال: سورة الإخلاص' : 'مثال: البقرة 1–5'} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> من يستطيع السماع؟</span>
          <select className={field} value={visibility} onChange={(e) => changeVisibility(e.target.value as RecitationVisibility)}>
            {VISIBILITY_OPTIONS.map((v) => <option key={v.value} value={v.value}>{v.label} — {v.hint}</option>)}
          </select>
        </label>
      </div>

      {/* Record / upload */}
      {!draft && (
        <div className="flex flex-wrap items-center gap-3">
          {!recording ? (
            <button type="button" onClick={startRecording} disabled={recState === 'processing'}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-black px-5 py-3 rounded-full text-sm cursor-pointer disabled:opacity-60">
              <Mic className="w-4 h-4" /> {meta ? 'تسجيل جديد' : 'ابدأ التسجيل'}
            </button>
          ) : (
            <>
              <span className="inline-flex items-center gap-2 font-black text-red-600 tabular-nums" dir="ltr">
                <span className={`w-3 h-3 rounded-full bg-red-600 ${recState === 'recording' ? 'animate-pulse' : ''}`} />
                {formatSeconds(elapsed)} / {formatSeconds(MAX_RECITATION_SECONDS)}
              </span>
              <button type="button" onClick={pauseResume} className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 font-bold px-4 py-2.5 rounded-full text-sm cursor-pointer">
                {recState === 'recording' ? <><Pause className="w-4 h-4" /> إيقاف مؤقت</> : <><Play className="w-4 h-4" /> متابعة</>}
              </button>
              <button type="button" onClick={stopRecording} className="inline-flex items-center gap-1.5 bg-slate-900 text-white font-bold px-4 py-2.5 rounded-full text-sm cursor-pointer">
                <Square className="w-4 h-4" /> إنهاء ومراجعة
              </button>
            </>
          )}
          {!recording && (
            <label className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-5 py-3 rounded-full text-sm cursor-pointer">
              {recState === 'processing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {recState === 'processing' ? 'جاري التجهيز…' : 'رفع ملف (MP3 / M4A / WAV)'}
              <input type="file" accept=".mp3,.m4a,.wav,audio/mpeg,audio/mp4,audio/x-m4a,audio/wav" onChange={onPickFile} className="hidden" disabled={recState === 'processing'} />
            </label>
          )}
        </div>
      )}

      {/* Review before saving */}
      {draft && (
        <div className="space-y-3 bg-amber-50/60 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-black text-amber-950">استمع إلى التسجيل قبل حفظه:</p>
          <RecitationPlayer src={draft.dataUrl} title={title.trim() || RECITATION_KINDS.find((k) => k.value === kind)!.label} durationSec={draft.durationSec} />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={save} disabled={busy}
              className="inline-flex items-center gap-2 bg-[#0b3a4f] hover:bg-[#0e4d64] text-white font-black px-5 py-2.5 rounded-full text-sm cursor-pointer disabled:opacity-60">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} {meta ? 'استبدال العيّنة الحالية' : 'حفظ ونشر في ملفي'}
            </button>
            <button type="button" onClick={() => setDraft(null)} disabled={busy}
              className="inline-flex items-center gap-1.5 bg-white border border-slate-300 font-bold px-4 py-2.5 rounded-full text-sm cursor-pointer">
              <RotateCcw className="w-4 h-4" /> إعادة التسجيل
            </button>
          </div>
        </div>
      )}

      {problem && <p role="alert" className="text-sm font-bold text-red-700">{problem}</p>}
    </section>
  );
};
