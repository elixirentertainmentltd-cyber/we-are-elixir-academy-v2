import { z } from 'zod';
import { requireActiveUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { jsonError } from '@/lib/http';

const schema = z.object({ completed: z.literal(true) });

export async function PATCH(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    const user = await requireActiveUser();
    const { lessonId } = await params;
    schema.parse(await request.json());
    const lesson = await db.lesson.findUnique({ where: { id: lessonId }, select: { id: true, module: { select: { courseId: true } } } });
    if (!lesson) return jsonError('Lesson not found.', 404);

    await db.progress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      update: { completed: true, completedAt: new Date() },
      create: { userId: user.id, lessonId, completed: true, completedAt: new Date() },
    });
    await db.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId: lesson.module.courseId } },
      update: { lastOpenedAt: new Date() },
      create: { userId: user.id, courseId: lesson.module.courseId },
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonError('Unable to update progress.', 400);
  }
}
