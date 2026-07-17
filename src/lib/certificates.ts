import { randomBytes } from 'crypto';
import { db } from '@/lib/db';
import { sendPushToUser } from '@/lib/push';

function certificateCode() {
  return `WAE-${new Date().getFullYear()}-${randomBytes(5).toString('hex').toUpperCase()}`;
}

export async function issueCertificate(userId: string, courseId: string) {
  const course = await db.course.findUnique({ where: { id: courseId }, select: { certificateEnabled: true } });
  if (!course?.certificateEnabled) return null;
  const existing = await db.certificate.findUnique({ where: { userId_courseId: { userId, courseId } } });
  if (existing) return existing;
  const certificate = await db.certificate.create({ data: { userId, courseId, code: certificateCode() } });
  await sendPushToUser(userId, { title: 'Certificate earned', body: 'Your new Academy certificate is ready.', url: `/certificates/${certificate.code}` }).catch(() => undefined);
  return certificate;
}

export async function syncCourseCompletion(userId: string, courseId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: { modules: { include: { lessons: { select: { id: true, required: true } } } } },
  });
  if (!course) return { completed: false, certificate: null };

  const requiredIds = course.modules.flatMap((module) => module.lessons).filter((lesson) => lesson.required).map((lesson) => lesson.id);
  if (!requiredIds.length) return { completed: false, certificate: null };

  const completedCount = await db.progress.count({ where: { userId, lessonId: { in: requiredIds }, completed: true } });
  const completed = completedCount === requiredIds.length;
  const completedAt = completed ? new Date() : null;

  await db.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: { completedAt, lastOpenedAt: new Date() },
    create: { userId, courseId, completedAt },
  });

  const certificate = completed ? await issueCertificate(userId, courseId) : null;
  return { completed, certificate };
}
