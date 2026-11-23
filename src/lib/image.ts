import { t } from '../i18n';
/**
 * Resizes an image in the browser and returns a small JPEG data URL.
 * Profile photos are stored this way directly in Firestore (well below the 1 MB document limit),
 * so the app works without Cloud Storage for photos.
 */
export async function compressImage(file: File, maxSize = 320, maxBytes = 150_000): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error(t('الملف المختار ليس صورة.'));
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error(t('حجم الصورة كبير جداً (الحد الأقصى 15 ميغابايت).'));
  }

  const bitmap = await loadImage(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error(t('تعذر معالجة الصورة في هذا المتصفح.'));
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);

  // Lower quality step by step until the result is small enough.
  for (const quality of [0.85, 0.75, 0.65, 0.5, 0.4]) {
    const url = canvas.toDataURL('image/jpeg', quality);
    if (url.length <= maxBytes) return url;
  }
  throw new Error(t('تعذر ضغط الصورة إلى حجم مناسب. جرّب صورة أخرى.'));
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(t('تعذر قراءة الصورة.')));
    };
    img.src = url;
  });
}
