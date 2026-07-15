import { z } from 'zod';
import { requireActiveUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { jsonError } from '@/lib/http';
import { syncCourseCompletion } from '@/lib/certificates';

const schema = z.object({ completed: z.literal(true) });

export async function PATCH(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    const user = await requireActiveUser();
    const { lessonId } = await params;
    schema.parse(await request.json());
    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, quiz: { select: { published: true } }, module: { select: { courseId: true } } },
    });
    if (!lesson) return jsonError('Lesson not found.', 404);
    if (lesson.quiz?.published) return jsonError('Pass the lesson quiz to complete this lesson.', 400);

    await db.progress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      update: { completed: true, completedAt: new Date() },
      create: { userId: user.id, lessonId, completed: true, completedAt: new Date() },
    });

    const result = await syncCourseCompletion(user.id, lesson.module.courseId);
    return Response.json({ ok: true, courseCompleted: result.completed, certificateCode: result.certificate?.code ?? null });
  } catch (error) {
    console.error(error);
    return jsonError('Unable to update progress.', 400);
  }
}
