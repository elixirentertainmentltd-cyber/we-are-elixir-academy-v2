import { z } from 'zod';
import { requireAdminApi, apiErrorResponse, ApiError } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { getBuilderCourse } from '@/lib/builder';

const schema = z.object({
  kind: z.enum(['module', 'lesson']),
  id: z.string().min(1),
  direction: z.enum(['up', 'down']),
});

export async function POST(request: Request) {
  try {
    await requireAdminApi();
    const input = schema.parse(await request.json());

    if (input.kind === 'module') {
      const current = await db.module.findUnique({ where: { id: input.id } });
      if (!current) throw new ApiError('Module not found.', 404);

      const sibling = await db.module.findFirst({
        where: {
          courseId: current.courseId,
          position: input.direction === 'up' ? { lt: current.position } : { gt: current.position },
        },
        orderBy: { position: input.direction === 'up' ? 'desc' : 'asc' },
      });

      if (sibling) {
        const temp = Math.max(current.position, sibling.position) + 100000;
        await db.$transaction([
          db.module.update({ where: { id: current.id }, data: { position: temp } }),
          db.module.update({ where: { id: sibling.id }, data: { position: current.position } }),
          db.module.update({ where: { id: current.id }, data: { position: sibling.position } }),
        ]);
      }

      return Response.json({ course: await getBuilderCourse(current.courseId) });
    }

    const current = await db.lesson.findUnique({
      where: { id: input.id },
      include: { module: { select: { courseId: true } } },
    });
    if (!current) throw new ApiError('Lesson not found.', 404);

    const sibling = await db.lesson.findFirst({
      where: {
        moduleId: current.moduleId,
        position: input.direction === 'up' ? { lt: current.position } : { gt: current.position },
      },
      orderBy: { position: input.direction === 'up' ? 'desc' : 'asc' },
    });

    if (sibling) {
      const temp = Math.max(current.position, sibling.position) + 100000;
      await db.$transaction([
        db.lesson.update({ where: { id: current.id }, data: { position: temp } }),
        db.lesson.update({ where: { id: sibling.id }, data: { position: current.position } }),
        db.lesson.update({ where: { id: current.id }, data: { position: sibling.position } }),
      ]);
    }

    return Response.json({ course: await getBuilderCourse(current.module.courseId) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid reorder request.' }, { status: 400 });
    }
    return apiErrorResponse(error);
  }
}
