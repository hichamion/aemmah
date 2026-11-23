import React, { useEffect, useRef, useState } from 'react';
import { Bold, FileText, Heading2, Heading3, ImagePlus, List, ListOrdered, Loader2, Quote, Trash2, Wand2, X } from 'lucide-react';
import { CommunityPost, CommunitySettings, PostFile, PostType } from '../../types/community';
import {
  checkPdf,
  MAX_POST_FILES,
  MAX_POST_IMAGES,
  PostDraft,
  prepareImages,
  savePost,
  templateFor,
  useMediaImage,
} from '../../lib/community';
import { applyFormat, RichText } from '../../lib/richtext';
import { PostTypeGrid } from './PostParts';
import { useDialog } from '../../lib/useDialog';
import { t } from '../../i18n';

interface Props {
  open: boolean;
  initialType?: PostType;
  existing: CommunityPost | null;
  settings: CommunitySettings;
  author: { uid: string; name: string; imamId: string };
  onClose: () => void;
  onSaved: (msg: string, postId: string) => void;
  onError: (msg: string) => void;
}

const ExistingThumb: React.FC<{ id: string; onRemove: () => void }> = ({ id, onRemove }) => {
  const src = useMediaImage(id);
  return (
    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-100">
      {src && <img src={src} alt="" className="w-full h-full object-cover" />}
      <button type="button" onClick={onRemove} aria-label={t('حذف الصورة')} className="absolute top-1 end-1 bg-black/60 text-white rounded-full p-1 cursor-pointer">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const PostComposer: React.FC<Props> = ({ open, initialType, existing, settings, author, onClose, onSaved, onError }) => {
  const dialogRef = useDialog(open, onClose);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [type, setType] = useState<PostType>('khutba');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [keepImages, setKeepImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [keepFiles, setKeepFiles] = useState<PostFile[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState<'' | 'draft' | 'published' | 'images'>('');
  const [problem, setProblem] = useState('');

  useEffect(() => {
    if (!open) return;
    setProblem('');
    setPreview(false);
    if (existing) {
      setType(existing.type);
      setCategory(existing.category);
      setTitle(existing.title);
      setBody(existing.body);
      setKeepImages(existing.images);
      setKeepFiles(existing.files);
      setPollOptions(existing.poll?.options?.length ? existing.poll.options : ['', '']);
    } else {
      setType(initialType || 'khutba');
      // Categories are no longer chosen by the author (kept in the data for older posts).
      setCategory('عام');
      setTitle('');
      setBody('');
      setKeepImages([]);
      setKeepFiles([]);
      setPollOptions(['', '']);
    }
    setNewImages([]);
    setNewFiles([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existing?.id]);

  if (!open) return null;

  const tpl = templateFor(settings, type);
  const imageCount = keepImages.length + newImages.length;

  const format = (kind: Parameters<typeof applyFormat>[1]) => {
    const el = bodyRef.current;
    if (!el) return;
    const { value, cursor } = applyFormat(el, kind);
    setBody(value);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  };

  const useTemplate = () => {
    if (!tpl) return;
    if ((title.trim() || body.trim()) && !window.confirm(t('سيُستبدل العنوان والنص الحاليان بالنموذج. متابعة؟'))) return;
    setTitle(tpl.title);
    setBody(tpl.body);
    if (type === 'poll' && tpl.pollOptions?.length) setPollOptions(tpl.pollOptions.slice(0, 6));
  };

  const onImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_POST_IMAGES - imageCount);
    e.target.value = '';
    if (!files.length) return;
    setBusy('images');
    try {
      const urls = await prepareImages(files);
      setNewImages((prev) => [...prev, ...urls].slice(0, MAX_POST_IMAGES - keepImages.length));
    } catch (err) {
      setProblem((err as Error).message);
    } finally {
      setBusy('');
    }
  };

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    for (const f of picked) {
      const err = checkPdf(f);
      if (err) return setProblem(err);
    }
    setNewFiles((prev) => [...prev, ...picked].slice(0, MAX_POST_FILES - keepFiles.length));
  };

  const submit = async (status: 'draft' | 'published') => {
    setProblem('');
    if (!title.trim()) return setProblem(t('اكتب عنواناً للمنشور.'));
    if (status === 'published' && !body.trim() && imageCount === 0) return setProblem(t('اكتب نص المنشور أو أرفق صورة.'));
    if (type === 'poll' && pollOptions.filter((o) => o.trim()).length < 2) return setProblem(t('الاستطلاع يحتاج خيارين على الأقل.'));
    setBusy(status);
    try {
      const draft: PostDraft = { type, category, title, body, keepImages, newImages, keepFiles, newFiles, pollOptions };
      const id = await savePost({ existing, draft, status, author });
      onSaved(status === 'draft' ? t('حُفظت المسودة.') : existing ? t('تم تحديث المنشور.') : t('تم نشر المنشور.'), id);
      onClose();
    } catch (err) {
      console.error(err);
      const code = (err as { code?: string }).code || '';
      onError(code.includes('permission') ? t('لا يمكنك النشر الآن (قد يكون النشر موقوفاً مؤقتاً، أو ملفك غير معتمد بعد).') : t('تعذر حفظ المنشور. حاول مجدداً.'));
    } finally {
      setBusy('');
    }
  };

  const field = 'w-full border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600';
  const tool = 'p-2 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto"
      role="dialog" aria-modal="true" aria-label={t('منشور جديد')} ref={dialogRef} tabIndex={-1}>
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl my-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-l from-emerald-50 to-white">
          <h2 className="font-black text-lg text-emerald-950">{existing ? t('تعديل المنشور') : t('منشور جديد في ملتقى الأئمة')}</h2>
          <button onClick={onClose} aria-label={t('إغلاق')} className="p-2 rounded-full hover:bg-slate-100 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[75dvh] overflow-y-auto">
          <PostTypeGrid value={type} onPick={setType} />

          {tpl && (
            <button type="button" onClick={useTemplate} className="inline-flex items-center gap-1.5 text-xs font-black text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full cursor-pointer">
              <Wand2 className="w-3.5 h-3.5" /> {t('استخدم النموذج الجاهز لهذا النوع')}
            </button>
          )}

          <input className={`${field} w-full font-bold`} maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('عنوان المنشور')} aria-label={t('عنوان المنشور')} />

          <div className="border border-slate-300 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-600">
            <div className="flex flex-wrap items-center gap-0.5 px-2 py-1 border-b border-slate-200 bg-slate-50">
              <button type="button" className={tool} onClick={() => format('h2')} title={t('عنوان')}><Heading2 className="w-4 h-4" /></button>
              <button type="button" className={tool} onClick={() => format('h3')} title={t('عنوان فرعي')}><Heading3 className="w-4 h-4" /></button>
              <button type="button" className={tool} onClick={() => format('bold')} title={t('عريض')}><Bold className="w-4 h-4" /></button>
              <button type="button" className={tool} onClick={() => format('ul')} title={t('قائمة')}><List className="w-4 h-4" /></button>
              <button type="button" className={tool} onClick={() => format('ol')} title={t('قائمة مرقمة')}><ListOrdered className="w-4 h-4" /></button>
              <button type="button" className={tool} onClick={() => format('quote')} title={t('اقتباس')}><Quote className="w-4 h-4" /></button>
              <span className="flex-1" />
              <button type="button" onClick={() => setPreview((v) => !v)} className="text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
                {preview ? t('تحرير') : t('معاينة')}
              </button>
            </div>
            {preview ? (
              <div className="p-4 min-h-56 bg-white"><RichText text={body || '—'} /></div>
            ) : (
              <textarea ref={bodyRef} value={body} onChange={(e) => setBody(e.target.value)} rows={12} maxLength={60000}
                placeholder={t('اكتب هنا… استعمل الأزرار أعلاه للعناوين والقوائم.')} className="w-full p-4 text-sm leading-loose outline-none resize-y min-h-56" aria-label={t('نص المنشور')} />
            )}
          </div>

          {type === 'poll' && (
            <fieldset className="space-y-2 bg-sky-50/60 border border-sky-200 rounded-2xl p-4">
              <legend className="font-black text-sky-950 text-sm px-1">{t('خيارات الاستطلاع (2–6)')}</legend>
              {pollOptions.map((o, i) => (
                <div key={i} className="flex gap-2">
                  <input className={field} maxLength={120} value={o} placeholder={t('الخيار {n}', { n: i + 1 })}
                    onChange={(e) => setPollOptions((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))} />
                  {pollOptions.length > 2 && (
                    <button type="button" onClick={() => setPollOptions((prev) => prev.filter((_, j) => j !== i))} className="p-2 text-red-600 cursor-pointer" aria-label={t('حذف الخيار')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 6 && (
                <button type="button" onClick={() => setPollOptions((p) => [...p, ''])} className="text-xs font-bold text-sky-800 cursor-pointer">{t('+ إضافة خيار')}</button>
              )}
            </fieldset>
          )}

          {/* Attachments */}
          <div className="flex flex-wrap gap-2">
            <label className={`inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full border border-slate-300 cursor-pointer ${imageCount >= MAX_POST_IMAGES ? 'opacity-50 pointer-events-none' : 'hover:bg-slate-50'}`}>
              {busy === 'images' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4 text-emerald-700" />}
              {t('صور ({n}/{max})', { n: imageCount, max: MAX_POST_IMAGES })}
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onImages} className="hidden" />
            </label>
            <label className={`inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full border border-slate-300 cursor-pointer ${keepFiles.length + newFiles.length >= MAX_POST_FILES ? 'opacity-50 pointer-events-none' : 'hover:bg-slate-50'}`}>
              <FileText className="w-4 h-4 text-red-700" />
              {t('ملفات PDF ({n}/{max}، حتى 2MB)', { n: keepFiles.length + newFiles.length, max: MAX_POST_FILES })}
              <input type="file" accept="application/pdf,.pdf" multiple onChange={onFiles} className="hidden" />
            </label>
          </div>

          {imageCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {keepImages.map((id) => <ExistingThumb key={id} id={id} onRemove={() => setKeepImages((p) => p.filter((x) => x !== id))} />)}
              {newImages.map((src, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setNewImages((p) => p.filter((_, j) => j !== i))} aria-label={t('حذف الصورة')} className="absolute top-1 end-1 bg-black/60 text-white rounded-full p-1 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {keepFiles.length + newFiles.length > 0 && (
            <ul className="space-y-1.5 text-sm">
              {keepFiles.map((f) => (
                <li key={f.id} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                  <FileText className="w-4 h-4 text-red-700" /> <span className="flex-1 truncate">{f.name}</span>
                  <button type="button" onClick={() => setKeepFiles((p) => p.filter((x) => x.id !== f.id))} className="text-red-600 cursor-pointer" aria-label={t('حذف الملف')}><Trash2 className="w-4 h-4" /></button>
                </li>
              ))}
              {newFiles.map((f, i) => (
                <li key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                  <FileText className="w-4 h-4 text-red-700" /> <span className="flex-1 truncate">{f.name}</span>
                  <button type="button" onClick={() => setNewFiles((p) => p.filter((_, j) => j !== i))} className="text-red-600 cursor-pointer" aria-label={t('حذف الملف')}><Trash2 className="w-4 h-4" /></button>
                </li>
              ))}
            </ul>
          )}

          {problem && <p role="alert" className="text-sm font-bold text-red-700">{problem}</p>}
        </div>

        <div className="flex flex-wrap justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50">
          <button type="button" onClick={() => submit('draft')} disabled={!!busy}
            className="px-5 py-2.5 rounded-full border border-slate-300 bg-white font-bold text-sm cursor-pointer disabled:opacity-60 inline-flex items-center gap-2">
            {busy === 'draft' && <Loader2 className="w-4 h-4 animate-spin" />} {t('حفظ كمسودة')}
          </button>
          <button type="button" onClick={() => submit('published')} disabled={!!busy}
            className="px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white font-black text-sm cursor-pointer disabled:opacity-60 inline-flex items-center gap-2">
            {busy === 'published' && <Loader2 className="w-4 h-4 animate-spin" />} {existing?.status === 'published' ? t('حفظ التعديلات') : t('نشر')}
          </button>
        </div>
      </div>
    </div>
  );
};
