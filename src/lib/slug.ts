import { db } from './db';

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'untitled';
}

export async function uniqueCourseSlug(value: string, excludeId?: string) {
  const base = slugify(value);
  let candidate = base;
  let suffix = 2;

  while (
    await db.course.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function uniqueLessonSlug(moduleId: string, value: string, excludeId?: string) {
  const base = slugify(value);
  let candidate = base;
  let suffix = 2;

  while (
    await db.lesson.findFirst({
      where: {
        moduleId,
        slug: candidate,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}
