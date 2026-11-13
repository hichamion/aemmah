import React from 'react';

/*
 * Light, safe markup for community posts (no HTML is ever injected):
 *   "## title"  "### subtitle"  "- item"  "1. item"  "> quote"  "**bold**"  blank line = new paragraph.
 */

function inline(text: string, key: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={`${key}-${i}`}>{part.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={`${key}-${i}`}>{part}</React.Fragment>
    )
  );
}

export const RichText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const lines = text.replace(/\r/g, '').split('\n');
  const out: React.ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const line = lines[i];
    const key = `b${k++}`;
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      out.push(<h4 key={key} className="text-lg font-black text-slate-900 mt-4">{inline(line.slice(4), key)}</h4>);
      i++;
    } else if (line.startsWith('## ')) {
      out.push(<h3 key={key} className="text-xl font-black text-emerald-900 mt-5 font-amiri">{inline(line.slice(3), key)}</h3>);
      i++;
    } else if (/^- /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^- /.test(lines[i])) items.push(lines[i++].slice(2));
      out.push(
        <ul key={key} className="list-disc pr-6 space-y-1">
          {items.map((it, j) => <li key={j}>{inline(it, `${key}-${j}`)}</li>)}
        </ul>
      );
    } else if (/^\d+[.)] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)] /.test(lines[i])) items.push(lines[i++].replace(/^\d+[.)] /, ''));
      out.push(
        <ol key={key} className="list-decimal pr-6 space-y-1">
          {items.map((it, j) => <li key={j}>{inline(it, `${key}-${j}`)}</li>)}
        </ol>
      );
    } else if (line.startsWith('> ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) items.push(lines[i++].slice(2));
      out.push(
        <blockquote key={key} className="border-r-4 border-amber-400 bg-amber-50/60 pr-4 py-2 rounded-l-xl text-slate-700">
          {items.map((it, j) => <p key={j}>{inline(it, `${key}-${j}`)}</p>)}
        </blockquote>
      );
    } else {
      const para: string[] = [];
      while (i < lines.length && lines[i].trim() && !/^(#{2,3} |- |\d+[.)] |> )/.test(lines[i])) para.push(lines[i++]);
      out.push(
        <p key={key}>
          {para.map((p, j) => (
            <React.Fragment key={j}>
              {j > 0 && <br />}
              {inline(p, `${key}-${j}`)}
            </React.Fragment>
          ))}
        </p>
      );
    }
  }
  return <div className={`space-y-3 leading-loose text-slate-800 break-words ${className}`}>{out}</div>;
};

/** Plain-text excerpt for the wall (markup removed). */
export function excerpt(text: string, max = 260): string {
  const plain = text
    .replace(/^(#{2,3} |- |\d+[.)] |> )/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > max ? `${plain.slice(0, max).trimEnd()}…` : plain;
}

/** Toolbar helpers for a <textarea>: prefix the current lines, or wrap the selection. */
export function applyFormat(el: HTMLTextAreaElement, kind: 'h2' | 'h3' | 'ul' | 'ol' | 'quote' | 'bold'): { value: string; cursor: number } {
  const { value, selectionStart: s, selectionEnd: e } = el;
  if (kind === 'bold') {
    const sel = value.slice(s, e) || 'نص عريض';
    const next = `${value.slice(0, s)}**${sel}**${value.slice(e)}`;
    return { value: next, cursor: s + sel.length + 4 };
  }
  const lineStart = value.lastIndexOf('\n', s - 1) + 1;
  const lineEnd = value.indexOf('\n', e) === -1 ? value.length : value.indexOf('\n', e);
  const block = value.slice(lineStart, lineEnd).split('\n');
  const prefix = { h2: '## ', h3: '### ', ul: '- ', ol: '', quote: '> ' }[kind];
  const done = block.map((l, i) => {
    const clean = l.replace(/^(#{2,3} |- |\d+[.)] |> )/, '');
    return kind === 'ol' ? `${i + 1}. ${clean}` : `${prefix}${clean}`;
  });
  const next = value.slice(0, lineStart) + done.join('\n') + value.slice(lineEnd);
  return { value: next, cursor: lineStart + done.join('\n').length };
}
