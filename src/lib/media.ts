import path from 'path';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { randomUUID } from 'crypto';

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = new Set([
  'image/jpeg','image/png','image/webp','image/gif','application/pdf','video/mp4','video/webm',
  'audio/mpeg','audio/wav','application/zip','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation','text/plain','text/csv'
]);

export function mediaKind(mime: string) {
  if (mime.startsWith('image/')) return 'IMAGE' as const;
  if (mime === 'application/pdf') return 'PDF' as const;
  if (mime.startsWith('video/')) return 'VIDEO' as const;
  if (mime.startsWith('audio/')) return 'AUDIO' as const;
  if (mime.includes('zip')) return 'ARCHIVE' as const;
  if (mime.includes('document') || mime.includes('presentation') || mime.startsWith('text/')) return 'DOCUMENT' as const;
  return 'OTHER' as const;
}

export async function saveUpload(file: File) {
  if (!file.size || file.size > MAX_BYTES) throw new Error('File must be smaller than 25 MB.');
  if (!ALLOWED.has(file.type)) throw new Error('This file type is not allowed.');
  const extension = path.extname(file.name).replace(/[^.a-zA-Z0-9]/g, '').slice(0, 10);
  const stored = `${Date.now()}-${randomUUID()}${extension}`;
  const folder = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, stored), Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/${stored}`, stored };
}

export async function removeUpload(url: string) {
  if (!url.startsWith('/uploads/')) return;
  await unlink(path.join(process.cwd(), 'public', url)).catch(() => undefined);
}
