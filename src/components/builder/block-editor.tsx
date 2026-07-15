'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Copy,
  Download,
  FileText,
  Heading2,
  Image as ImageIcon,
  Lightbulb,
  Link2,
  Minus,
  Pilcrow,
  Plus,
  Quote,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { LessonBlocks } from '@/components/lesson-blocks';
import type { BuilderBlock, BuilderBlockType, BuilderCourse, BuilderLesson } from './types';
import { requestJson } from './request-json';

const palette: Array<{ type: BuilderBlockType; label: string; icon: React.ReactNode }> = [
  { type: 'HEADING', label: 'Heading', icon: <Heading2 /> },
  { type: 'PARAGRAPH', label: 'Paragraph', icon: <Pilcrow /> },
  { type: 'IMAGE', label: 'Image', icon: <ImageIcon /> },
  { type: 'VIDEO', label: 'Video', icon: <Video /> },
  { type: 'PDF', label: 'PDF', icon: <FileText /> },
  { type: 'DOWNLOAD', label: 'Download', icon: <Download /> },
  { type: 'QUOTE', label: 'Quote', icon: <Quote /> },
  { type: 'TIP', label: 'Tip', icon: <Lightbulb /> },
  { type: 'WARNING', label: 'Warning', icon: <AlertTriangle /> },
  { type: 'BUTTON', label: 'Button', icon: <Link2 /> },
  { type: 'DIVIDER', label: 'Divider', icon: <Minus /> },
];

function newBlock(type: BuilderBlockType): BuilderBlock {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `block-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const data: Record<string, unknown> = (() => {
    switch (type) {
      case 'HEADING': return { text: 'New heading', level: 2 };
      case 'PARAGRAPH': return { text: '' };
      case 'IMAGE': return { url: '', alt: '', caption: '' };
      case 'VIDEO': return { url: '', title: '' };
      case 'PDF': return { url: '', title: 'PDF resource' };
      case 'DOWNLOAD': return { url: '', label: 'Download resource' };
      case 'QUOTE': return { text: '', attribution: '' };
      case 'TIP': return { text: '' };
      case 'WARNING': return { text: '' };
      case 'BUTTON': return { url: '', label: 'Open link' };
      case 'DIVIDER': return {};
    }
  })();

  return { id, type, position: 0, data };
}

function value(data: Record<string, unknown>, key: string) {
  const current = data[key];
  return typeof current === 'string' || typeof current === 'number' ? String(current) : '';
}

function BlockFields({ block, onChange }: { block: BuilderBlock; onChange: (data: Record<string, unknown>) => void }) {
  const update = (key: string, next: unknown) => onChange({ ...block.data, [key]: next });

  if (block.type === 'DIVIDER') {
    return <p className="builder-field-hint">A visual separator will be added to the lesson.</p>;
  }

  if (block.type === 'HEADING') {
    return <div className="builder-field-grid"><label>Heading text<input value={value(block.data, 'text')} onChange={(event) => update('text', event.target.value)} /></label><label>Size<select value={value(block.data, 'level') || '2'} onChange={(event) => update('level', Number(event.target.value))}><option value="2">Heading 2</option><option value="3">Heading 3</option></select></label></div>;
  }

  if (['PARAGRAPH', 'TIP', 'WARNING'].includes(block.type)) {
    return <label>Text<textarea rows={block.type === 'PARAGRAPH' ? 8 : 5} value={value(block.data, 'text')} onChange={(event) => update('text', event.target.value)} /></label>;
  }

  if (block.type === 'IMAGE') {
    return <div className="builder-field-grid"><label className="full">Image URL<input type="url" placeholder="https://..." value={value(block.data, 'url')} onChange={(event) => update('url', event.target.value)} /></label><label>Alternative text<input value={value(block.data, 'alt')} onChange={(event) => update('alt', event.target.value)} /></label><label>Caption<input value={value(block.data, 'caption')} onChange={(event) => update('caption', event.target.value)} /></label></div>;
  }

  if (block.type === 'VIDEO') {
    return <div className="builder-field-grid"><label className="full">YouTube or public video URL<input type="url" placeholder="https://..." value={value(block.data, 'url')} onChange={(event) => update('url', event.target.value)} /></label><label className="full">Accessible title<input value={value(block.data, 'title')} onChange={(event) => update('title', event.target.value)} /></label></div>;
  }

  if (block.type === 'PDF') {
    return <div className="builder-field-grid"><label className="full">Public PDF URL<input type="url" placeholder="https://..." value={value(block.data, 'url')} onChange={(event) => update('url', event.target.value)} /></label><label className="full">PDF title<input value={value(block.data, 'title')} onChange={(event) => update('title', event.target.value)} /></label></div>;
  }

  if (block.type === 'DOWNLOAD' || block.type === 'BUTTON') {
    return <div className="builder-field-grid"><label className="full">Link URL<input type="url" placeholder="https://..." value={value(block.data, 'url')} onChange={(event) => update('url', event.target.value)} /></label><label className="full">Label<input value={value(block.data, 'label')} onChange={(event) => update('label', event.target.value)} /></label></div>;
  }

  if (block.type === 'QUOTE') {
    return <div className="builder-field-grid"><label className="full">Quote<textarea rows={5} value={value(block.data, 'text')} onChange={(event) => update('text', event.target.value)} /></label><label className="full">Attribution<input value={value(block.data, 'attribution')} onChange={(event) => update('attribution', event.target.value)} /></label></div>;
  }

  return null;
}

export function BlockEditor({
  lesson,
  onClose,
  onSaved,
}: {
  lesson: BuilderLesson;
  onClose: () => void;
  onSaved: (course: BuilderCourse) => void;
}) {
  const [blocks, setBlocks] = useState<BuilderBlock[]>(lesson.blocks || []);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const ordered = useMemo(() => blocks.map((block, index) => ({ ...block, position: index + 1 })), [blocks]);

  function add(type: BuilderBlockType) {
    setBlocks((current) => [...current, newBlock(type)]);
    setPreview(false);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    setBlocks((current) => {
      const copy = [...current];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  function update(index: number, data: Record<string, unknown>) {
    setBlocks((current) => current.map((block, position) => position === index ? { ...block, data } : block));
  }

  function duplicate(index: number) {
    setBlocks((current) => {
      const copy = [...current];
      copy.splice(index + 1, 0, { ...newBlock(current[index].type), data: { ...current[index].data } });
      return copy;
    });
  }

  function remove(index: number) {
    setBlocks((current) => current.filter((_, position) => position !== index));
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      const result = await requestJson<{ course: BuilderCourse }>(`/api/admin/lessons/${lesson.id}/blocks`, {
        method: 'PUT',
        body: JSON.stringify({ blocks: ordered.map(({ id, type, data }) => ({ id, type, data })) }),
      });
      onSaved(result.course);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save lesson content.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="builder-modal-backdrop" role="presentation">
      <section className="builder-modal builder-block-modal" role="dialog" aria-modal="true" aria-labelledby="block-editor-title">
        <header className="builder-modal-header">
          <div><p className="eyebrow">VISUAL LESSON EDITOR</p><h2 id="block-editor-title">{lesson.title}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close lesson editor"><X /></button>
        </header>

        <div className="block-editor-toolbar">
          <div className="block-palette" aria-label="Add content block">
            {palette.map((item) => <button key={item.type} type="button" onClick={() => add(item.type)}>{item.icon}<span>{item.label}</span></button>)}
          </div>
          <div className="block-toolbar-actions"><button className="ghost" onClick={() => setPreview((current) => !current)}>{preview ? 'Edit blocks' : 'Preview lesson'}</button><button className="primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save lesson content'}</button></div>
        </div>

        {error && <p className="error builder-error">{error}</p>}

        <div className={preview ? 'block-editor-preview' : 'block-editor-canvas'}>
          {preview ? (
            <div className="lesson-content builder-preview-surface"><p className="eyebrow">LESSON PREVIEW</p><h1>{lesson.title}</h1>{ordered.length ? <LessonBlocks blocks={ordered} /> : <div className="empty-state"><h2>No content blocks yet</h2><p>Add a block from the toolbar above.</p></div>}</div>
          ) : ordered.length ? (
            ordered.map((block, index) => (
              <article className="block-editor-card" key={block.id}>
                <div className="block-editor-card-head"><div><span className="block-number">{index + 1}</span><strong>{palette.find((item) => item.type === block.type)?.label || block.type}</strong></div><div className="block-card-actions"><button className="icon-button" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Move block up"><ArrowUp /></button><button className="icon-button" disabled={index === ordered.length - 1} onClick={() => move(index, 1)} aria-label="Move block down"><ArrowDown /></button><button className="icon-button" onClick={() => duplicate(index)} aria-label="Duplicate block"><Copy /></button><button className="icon-button danger-icon" onClick={() => remove(index)} aria-label="Delete block"><Trash2 /></button></div></div>
                <BlockFields block={block} onChange={(data) => update(index, data)} />
              </article>
            ))
          ) : (
            <div className="empty-state"><Plus /><h2>Build this lesson visually</h2><p>Choose a content block above. You can reorder, duplicate and preview blocks before saving.</p></div>
          )}
        </div>
      </section>
    </div>
  );
}
