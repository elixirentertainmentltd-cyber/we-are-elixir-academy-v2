import { requireAdminApi, apiErrorResponse, ApiError } from '@/lib/api-auth';
import { duplicateCourse } from '@/lib/builder';

type Params = { params: Promise<{ courseId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    await requireAdminApi();
    const { courseId } = await params;
    const course = await duplicateCourse(courseId);
    if (!course) throw new ApiError('Course not found.', 404);
    return Response.json({ course }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
