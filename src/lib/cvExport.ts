// Turns a rendered CV (a DOM node) into a PNG (as tall as the CV) or an A4 PDF (one or more pages), and shares it.
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
  const options = { pixelRatio: 2, cacheBust: true, backgroundColor: '#f7f9fa' };
  // iPhone / iPad Safari often paints images and fonts only from the second render on: warm up once.
  if (isAppleTouch()) await toBlob(node, options).catch(() => null);
  const blob = await toBlob(node, options);
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

/** iPhone / iPad (iPadOS presents itself as a Mac with a touch screen). */
export const isAppleTouch = () =>
  /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1);

/**
 * Phones and tablets: a download started seconds after the tap (the CV takes time to render) is blocked
 * by the browser. There the file is handed to the user with a second tap (see ExportReadySheet).
 */
export const needsSecondTap = () => isAppleTouch() || window.matchMedia?.('(pointer: coarse)').matches;

export async function downloadPdf(png: Blob, baseName: string) {
  saveBlob(await pdfBlob(png), `${baseName}.pdf`);
}

/**
 * A4 PDF made from the rendered PNG, never squeezed: a tall CV continues on further pages. Each page
 * break is moved up to the nearest blank line, so no line of text is cut in two.
 */
export async function pdfBlob(png: Blob): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const dataUrl = await blobToDataUrl(png);
  const img = await loadImage(dataUrl);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageH = Math.round((img.width * 297) / 210); // one A4 page in image pixels
  if (img.height <= pageH * 1.02) {
    pdf.addImage(dataUrl, 'PNG', 0, 0, 210, (img.height * 210) / img.width, undefined, 'FAST');
    return pdf.output('blob');
  }
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const cuts = pageCuts(ctx, img.width, img.height, pageH);
  const page = document.createElement('canvas');
  page.width = img.width;
  const pctx = page.getContext('2d')!;
  cuts.forEach(([top, bottom], i) => {
    page.height = bottom - top;
    pctx.fillStyle = '#f7f9fa';
    pctx.fillRect(0, 0, page.width, page.height);
    pctx.drawImage(canvas, 0, top, img.width, bottom - top, 0, 0, img.width, bottom - top);
    if (i > 0) pdf.addPage('a4', 'portrait');
    pdf.addImage(page.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, ((bottom - top) * 210) / img.width, undefined, 'FAST');
  });
  return pdf.output('blob');
}

/** [top, bottom] of each page: a break goes on the quietest pixel row in the last 18% of the page. */
function pageCuts(ctx: CanvasRenderingContext2D, w: number, h: number, pageH: number): [number, number][] {
  const cuts: [number, number][] = [];
  let top = 0;
  while (h - top > pageH) {
    const target = top + pageH;
    const from = Math.round(target - pageH * 0.18);
    const rows = ctx.getImageData(0, from, w, target - from).data;
    let best = target;
    let bestScore = Infinity;
    for (let y = target - from - 1; y >= 0; y--) {
      // Count sharp colour changes along the row: text and lines give many, empty space almost none.
      let score = 0;
      const o = y * w * 4;
      for (let x = 4; x < w * 4; x += 8) {
        const d = Math.abs(rows[o + x] - rows[o + x - 4]) + Math.abs(rows[o + x + 1] - rows[o + x - 3]) + Math.abs(rows[o + x + 2] - rows[o + x - 2]);
        if (d > 60) score++;
      }
      if (score < bestScore) {
        bestScore = score;
        best = from + y;
        if (score === 0) break;
      }
    }
    cuts.push([top, best]);
    top = best;
  }
  cuts.push([top, h]);
  return cuts;
}

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(b);
  });

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

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
