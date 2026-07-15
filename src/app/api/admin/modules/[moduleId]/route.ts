import { z } from 'zod';
import { requireAdminApi, apiErrorResponse, ApiError } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { getBuilderCourse, resequenceModules } from '@/lib/builder';

const schema = z.object({
  title: z.string().trim().min(2).max(180).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
});

type Params = { params: Promise<{ moduleId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdminApi();
    const { moduleId } = await params;
    const existing = await db.module.findUnique({ where: { id: moduleId } });
    if (!existing) throw new ApiError('Module not found.', 404);
    const input = schema.parse(await request.json());

    await db.module.update({
      where: { id: moduleId },
      data: input,
    });

    return Response.json({ course: await getBuilderCourse(existing.courseId) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message || 'Invalid module details.' }, { status: 400 });
    }
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAdminApi();
    const { moduleId } = await params;
    const existing = await db.module.findUnique({ where: { id: moduleId } });
    if (!existing) throw new ApiError('Module not found.', 404);

    await db.module.delete({ where: { id: moduleId } });
    await resequenceModules(existing.courseId);

    return Response.json({ course: await getBuilderCourse(existing.courseId) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
