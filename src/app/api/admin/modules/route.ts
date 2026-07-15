import { z } from 'zod';
import { requireAdminApi, apiErrorResponse } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { getBuilderCourse } from '@/lib/builder';

const schema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(5000).optional().default(''),
});

export async function POST(request: Request) {
  try {
    await requireAdminApi();
    const input = schema.parse(await request.json());
    const last = await db.module.findFirst({
      where: { courseId: input.courseId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    await db.module.create({
      data: {
        courseId: input.courseId,
        title: input.title,
        description: input.description || null,
        position: (last?.position || 0) + 1,
      },
    });

    return Response.json({ course: await getBuilderCourse(input.courseId) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message || 'Invalid module details.' }, { status: 400 });
    }
    return apiErrorResponse(error);
  }
}
