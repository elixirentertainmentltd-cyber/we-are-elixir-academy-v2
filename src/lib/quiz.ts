import { db } from '@/lib/db';

export async function syncCourseCompletion(userId: string, courseId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: { modules: { include: { lessons: { select: { id: true, required: true } } } } },
  });
  if (!course) return;
  const requiredIds = course.modules.flatMap((module) => module.lessons).filter((lesson) => lesson.required).map((lesson) => lesson.id);
  if (!requiredIds.length) return;
  const completed = await db.progress.count({ where: { userId, lessonId: { in: requiredIds }, completed: true } });
  await db.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: { completedAt: completed === requiredIds.length ? new Date() : null, lastOpenedAt: new Date() },
    create: { userId, courseId, completedAt: completed === requiredIds.length ? new Date() : null },
  });
}
