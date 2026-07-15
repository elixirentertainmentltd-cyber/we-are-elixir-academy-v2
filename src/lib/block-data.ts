import { BlockType } from '@prisma/client';
import { z } from 'zod';

const webUrl = z.string().trim().url().max(2000).refine((value) => value.startsWith('https://') || value.startsWith('http://'), 'Use a public http or https URL.');
const optionalUrl = z.union([webUrl, z.literal('')]).default('');

const schemas: Record<BlockType, z.ZodType<Record<string, unknown>>> = {
  HEADING: z.object({
    text: z.string().max(300).default(''),
    level: z.coerce.number().int().min(2).max(3).default(2),
  }),
  PARAGRAPH: z.object({ text: z.string().max(20000).default('') }),
  IMAGE: z.object({
    url: optionalUrl,
    alt: z.string().trim().max(300).default(''),
    caption: z.string().trim().max(500).default(''),
  }),
  VIDEO: z.object({
    url: optionalUrl,
    title: z.string().trim().max(300).default(''),
  }),
  PDF: z.object({
    url: optionalUrl,
    title: z.string().trim().max(300).default('PDF resource'),
  }),
  DOWNLOAD: z.object({
    url: optionalUrl,
    label: z.string().trim().max(200).default('Download resource'),
  }),
  QUOTE: z.object({
    text: z.string().max(3000).default(''),
    attribution: z.string().trim().max(300).default(''),
  }),
  TIP: z.object({ text: z.string().max(5000).default('') }),
  WARNING: z.object({ text: z.string().max(5000).default('') }),
  BUTTON: z.object({
    url: optionalUrl,
    label: z.string().trim().max(120).default('Open link'),
  }),
  DIVIDER: z.object({}),
};

export function validateBlockData(type: BlockType, data: unknown) {
  return schemas[type].parse(data);
}

function text(data: unknown, key: string) {
  if (!data || typeof data !== 'object') return '';
  const value = (data as Record<string, unknown>)[key];
  return typeof value === 'string' ? value.trim() : '';
}

export function isBlockReady(type: BlockType, data: unknown) {
  switch (type) {
    case BlockType.HEADING:
    case BlockType.PARAGRAPH:
    case BlockType.QUOTE:
    case BlockType.TIP:
    case BlockType.WARNING:
      return Boolean(text(data, 'text'));
    case BlockType.IMAGE:
      return Boolean(text(data, 'url') && text(data, 'alt'));
    case BlockType.VIDEO:
    case BlockType.PDF:
      return Boolean(text(data, 'url'));
    case BlockType.DOWNLOAD:
    case BlockType.BUTTON:
      return Boolean(text(data, 'url') && text(data, 'label'));
    case BlockType.DIVIDER:
      return true;
  }
}

export function defaultBlockData(type: BlockType): Record<string, unknown> {
  switch (type) {
    case BlockType.HEADING:
      return { text: 'New heading', level: 2 };
    case BlockType.PARAGRAPH:
      return { text: '' };
    case BlockType.IMAGE:
      return { url: '', alt: '', caption: '' };
    case BlockType.VIDEO:
      return { url: '', title: '' };
    case BlockType.PDF:
      return { url: '', title: 'PDF resource' };
    case BlockType.DOWNLOAD:
      return { url: '', label: 'Download resource' };
    case BlockType.QUOTE:
      return { text: '', attribution: '' };
    case BlockType.TIP:
      return { text: '' };
    case BlockType.WARNING:
      return { text: '' };
    case BlockType.BUTTON:
      return { url: '', label: 'Open link' };
    case BlockType.DIVIDER:
      return {};
  }
}
