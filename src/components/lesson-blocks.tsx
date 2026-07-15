import type { BuilderBlock } from '@/components/builder/types';
import { AlertTriangle, Download, ExternalLink, FileText, Lightbulb, Quote } from 'lucide-react';

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function youtubeEmbed(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) return url;
      const id = parsed.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function LessonBlocks({ blocks }: { blocks: BuilderBlock[] }) {
  if (!blocks.length) return null;

  return (
    <div className="lesson-blocks">
      {blocks.map((block) => {
        const data = block.data || {};

        switch (block.type) {
          case 'HEADING': {
            const text = stringValue(data.text);
            const level = numberValue(data.level, 2);
            return level === 3
              ? <h3 key={block.id} className="content-heading content-heading-3">{text}</h3>
              : <h2 key={block.id} className="content-heading">{text}</h2>;
          }
          case 'PARAGRAPH':
            return <p key={block.id} className="content-paragraph">{stringValue(data.text)}</p>;
          case 'IMAGE': {
            const url = stringValue(data.url);
            if (!url) return null;
            return (
              <figure key={block.id} className="content-image">
                {/* External learner resources are intentionally rendered as normal web images. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={stringValue(data.alt)} loading="lazy" />
                {stringValue(data.caption) && <figcaption>{stringValue(data.caption)}</figcaption>}
              </figure>
            );
          }
          case 'VIDEO': {
            const url = stringValue(data.url);
            if (!url) return null;
            const embed = youtubeEmbed(url);
            return embed ? (
              <div key={block.id} className="content-video">
                <iframe
                  src={embed}
                  title={stringValue(data.title) || 'Lesson video'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <a key={block.id} className="resource-box" href={url} target="_blank" rel="noreferrer">
                <ExternalLink /> {stringValue(data.title) || 'Open video'}
              </a>
            );
          }
          case 'PDF': {
            const url = stringValue(data.url);
            if (!url) return null;
            return (
              <div key={block.id} className="content-pdf">
                <iframe src={url} title={stringValue(data.title) || 'PDF resource'} />
                <a className="ghost inline" href={url} target="_blank" rel="noreferrer"><FileText /> Open PDF in a new tab</a>
              </div>
            );
          }
          case 'DOWNLOAD': {
            const url = stringValue(data.url);
            if (!url) return null;
            return <a key={block.id} className="resource-box" href={url} target="_blank" rel="noreferrer"><Download /> {stringValue(data.label) || 'Download resource'}</a>;
          }
          case 'QUOTE':
            return (
              <blockquote key={block.id} className="content-quote">
                <Quote />
                <p>{stringValue(data.text)}</p>
                {stringValue(data.attribution) && <cite>{stringValue(data.attribution)}</cite>}
              </blockquote>
            );
          case 'TIP':
            return <aside key={block.id} className="content-callout tip"><Lightbulb /><div><strong>Tip</strong><p>{stringValue(data.text)}</p></div></aside>;
          case 'WARNING':
            return <aside key={block.id} className="content-callout warning"><AlertTriangle /><div><strong>Important</strong><p>{stringValue(data.text)}</p></div></aside>;
          case 'BUTTON': {
            const url = stringValue(data.url);
            if (!url) return null;
            return <p key={block.id}><a className="primary inline" href={url} target="_blank" rel="noreferrer">{stringValue(data.label) || 'Open link'} <ExternalLink /></a></p>;
          }
          case 'DIVIDER':
            return <hr key={block.id} className="content-divider" />;
          default:
            return null;
        }
      })}
    </div>
  );
}
