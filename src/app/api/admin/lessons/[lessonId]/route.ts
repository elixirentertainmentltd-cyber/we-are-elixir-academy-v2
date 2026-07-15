import { z } from 'zod';
import { requireAdminApi, apiErrorResponse, ApiError } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { getBuilderCourse, resequenceLessons } from '@/lib/builder';
import { uniqueLessonSlug } from '@/lib/slug';

const schema = z.object({
  title: z.string().trim().min(2).max(180).optional(),
  slug: z.string().trim().max(180).optional(),
  summary: z.string().trim().max(240).nullable().optional(),
  estimatedMinutes: z.coerce.number().int().min(1).max(1000).optional(),
  required: z.boolean().optional(),
});

type Params = { params: Promise<{ lessonId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdminApi();
    const { lessonId } = await params;
    const existing = await db.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { select: { courseId: true } } },
    });
    if (!existing) throw new ApiError('Lesson not found.', 404);

    const input = schema.parse(await request.json());
    const slug = input.slug !== undefined || input.title !== undefined
      ? await uniqueLessonSlug(existing.moduleId, input.slug || input.title || existing.title, lessonId)
      : undefined;

    await db.lesson.update({
      where: { id: lessonId },
      data: {
        ...input,
        ...(slug !== undefined ? { slug } : {}),
      },
    });

    return Response.json({ course: await getBuilderCourse(existing.module.courseId) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message || 'Invalid lesson details.' }, { status: 400 });
    }
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAdminApi();
    const { lessonId } = await params;
    const existing = await db.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { select: { courseId: true } } },
    });
    if (!existing) throw new ApiError('Lesson not found.', 404);

    await db.lesson.delete({ where: { id: lessonId } });
    await resequenceLessons(existing.moduleId);

    return Response.json({ course: await getBuilderCourse(existing.module.courseId) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
