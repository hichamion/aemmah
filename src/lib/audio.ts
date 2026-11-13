// Turns a recording or an uploaded audio file into a small mono MP3 (data URL) for the recitation sample.
// Everything runs in the browser; the MP3 encoder is loaded only when needed.

export const MAX_RECITATION_SECONDS = 60;
/** Uploaded files larger than this are refused before decoding (60 s of WAV is ~10 MB). */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const ALLOWED_AUDIO_EXT = /\.(mp3|m4a|wav)$/i;
export const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/wave'];

const SAMPLE_RATE = 22050;
const KBPS = 32;

export class AudioError extends Error {}

/** Checks an uploaded file's type and size (the duration is checked after decoding). */
export function checkAudioFile(file: File): string | null {
  const typeOk = ALLOWED_AUDIO_TYPES.includes(file.type) || ALLOWED_AUDIO_EXT.test(file.name);
  if (!typeOk) return 'نوع الملف غير مدعوم. المسموح: MP3 أو M4A أو WAV.';
  if (file.size > MAX_UPLOAD_BYTES) return 'حجم الملف كبير جداً.';
  return null;
}

/** Decodes any supported audio (recording or file) and re-encodes it as mono 22 kHz MP3 at 32 kbps. */
export async function encodeRecitation(blob: Blob): Promise<{ dataUrl: string; durationSec: number }> {
  const AC: typeof AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) throw new AudioError('متصفحك لا يدعم معالجة الصوت.');
  const ctx = new AC();
  let decoded: AudioBuffer;
  try {
    decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
  } catch {
    throw new AudioError('تعذر قراءة الملف الصوتي. جرّب ملفاً آخر بصيغة MP3 أو M4A أو WAV.');
  } finally {
    ctx.close().catch(() => {});
  }
  const durationSec = Math.round(decoded.duration * 10) / 10;
  if (durationSec < 1) throw new AudioError('التسجيل قصير جداً.');
  if (durationSec > MAX_RECITATION_SECONDS + 0.5) {
    throw new AudioError(`مدة التسجيل ${Math.round(durationSec)} ثانية. الحد الأقصى ${MAX_RECITATION_SECONDS} ثانية.`);
  }

  // Resample to mono 22 kHz.
  const frames = Math.ceil(decoded.duration * SAMPLE_RATE);
  const offline = new OfflineAudioContext(1, frames, SAMPLE_RATE);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  const mono = (await offline.startRendering()).getChannelData(0);

  const pcm = new Int16Array(mono.length);
  for (let i = 0; i < mono.length; i++) {
    const v = Math.max(-1, Math.min(1, mono[i]));
    pcm[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
  }

  const { Mp3Encoder } = await import('@breezystack/lamejs');
  const enc = new Mp3Encoder(1, SAMPLE_RATE, KBPS);
  const parts: Uint8Array[] = [];
  for (let i = 0; i < pcm.length; i += 1152) {
    const out = enc.encodeBuffer(pcm.subarray(i, i + 1152));
    if (out.length) parts.push(new Uint8Array(out));
  }
  const end = enc.flush();
  if (end.length) parts.push(new Uint8Array(end));

  const mp3 = new Blob(parts as BlobPart[], { type: 'audio/mpeg' });
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new AudioError('تعذر تجهيز الملف.'));
    r.readAsDataURL(mp3);
  });
  return { dataUrl, durationSec };
}

/** "0:45" */
export const formatSeconds = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Picks a recording format the browser supports (Chrome/Firefox: webm/opus, Safari: mp4/aac). */
export function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/ogg;codecs=opus'].find((t) =>
    MediaRecorder.isTypeSupported(t)
  );
}
