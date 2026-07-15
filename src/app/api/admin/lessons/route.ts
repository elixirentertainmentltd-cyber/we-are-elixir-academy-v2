import { z } from 'zod';
import { requireAdminApi, apiErrorResponse, ApiError } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { getBuilderCourse } from '@/lib/builder';
import { uniqueLessonSlug } from '@/lib/slug';

const schema = z.object({
  moduleId: z.string().min(1),
  title: z.string().trim().min(2).max(180),
  summary: z.string().trim().max(240).optional().default(''),
  estimatedMinutes: z.coerce.number().int().min(1).max(1000).default(5),
  required: z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    await requireAdminApi();
    const input = schema.parse(await request.json());
    const courseModule = await db.module.findUnique({ where: { id: input.moduleId } });
    if (!courseModule) throw new ApiError('Module not found.', 404);

    const last = await db.lesson.findFirst({
      where: { moduleId: input.moduleId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const slug = await uniqueLessonSlug(input.moduleId, input.title);

    const lesson = await db.lesson.create({
      data: {
        moduleId: input.moduleId,
        title: input.title,
        slug,
        summary: input.summary || null,
        content: '',
        estimatedMinutes: input.estimatedMinutes,
        required: input.required,
        position: (last?.position || 0) + 1,
      },
    });

    return Response.json({ course: await getBuilderCourse(courseModule.courseId), lessonId: lesson.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message || 'Invalid lesson details.' }, { status: 400 });
    }
    return apiErrorResponse(error);
  }
}
