// Turns a rendered CV (a DOM node) into a PNG or a one-page A4 PDF, and shares it.
// The libraries are loaded only when the user exports, so they do not slow down the site.

/** Waits for fonts and images inside the node, then renders it to a PNG at 2× resolution. */
export async function renderNodeToPng(node: HTMLElement): Promise<Blob> {
  await document.fonts.ready;
  await Promise.all(
    Array.from(node.querySelectorAll('img')).map((img) =>
      img.complete ? Promise.resolve() : new Promise((res) => img.addEventListener('load', res, { once: true }))
    )
  );
  const { toBlob } = await import('html-to-image');
  const blob = await toBlob(node, { pixelRatio: 2, cacheBust: true, backgroundColor: '#f7f9fa' });
  if (!blob) throw new Error('render failed');
  return blob;
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadPng(png: Blob, baseName: string) {
  saveBlob(png, `${baseName}.png`);
}

export async function downloadPdf(png: Blob, baseName: string) {
  const { jsPDF } = await import('jspdf');
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(png);
  });
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = dataUrl;
  });
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const width = 210;
  const height = Math.min(297, (img.height * width) / img.width);
  pdf.addImage(dataUrl, 'PNG', 0, 0, width, height, undefined, 'FAST');
  pdf.save(`${baseName}.pdf`);
}

/**
 * Shares the image through the phone's share sheet (WhatsApp appears there).
 * Where sharing files is not supported (most desktop browsers), downloads the image and opens WhatsApp
 * with a text message and the link instead. Returns how it was shared.
 */
export async function shareImage(png: Blob, baseName: string, text: string, link: string): Promise<'shared' | 'fallback'> {
  const file = new File([png], `${baseName}.png`, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: baseName, text: `${text}\n${link}` });
      return 'shared';
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return 'shared';
    }
  }
  saveBlob(png, `${baseName}.png`);
  window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${link}`)}`, '_blank', 'noopener');
  return 'fallback';
}

/** ASCII file name: browsers replace non-Latin download names with a generic "download". */
export const cvFileName = (id: string) => `Aemmah-CV-${id.replace(/[^\w-]/g, '').slice(0, 10)}`;
