import { CourseStatus } from '@prisma/client';
import { z } from 'zod';
import { requireAdminApi, apiErrorResponse, ApiError } from '@/lib/api-auth';
import { canPublish, getBuilderCourse, publishChecklist } from '@/lib/builder';
import { db } from '@/lib/db';

const actionSchema = z.object({ publish: z.boolean() });
type Params = { params: Promise<{ courseId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAdminApi();
    const { courseId } = await params;
    const course = await getBuilderCourse(courseId);
    if (!course) throw new ApiError('Course not found.', 404);
    const checks = publishChecklist(course);
    return Response.json({ checks, canPublish: canPublish(course), courseStatus: course.status });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    await requireAdminApi();
    const { courseId } = await params;
    const { publish } = actionSchema.parse(await request.json());
    const course = await getBuilderCourse(courseId);
    if (!course) throw new ApiError('Course not found.', 404);

    if (publish && !canPublish(course)) {
      throw new ApiError('Complete the required publish checklist items first.', 400);
    }

    await db.course.update({
      where: { id: courseId },
      data: { status: publish ? CourseStatus.PUBLISHED : CourseStatus.DRAFT },
    });

    return Response.json({ course: await getBuilderCourse(courseId) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid publish action.' }, { status: 400 });
    }
    return apiErrorResponse(error);
  }
}
