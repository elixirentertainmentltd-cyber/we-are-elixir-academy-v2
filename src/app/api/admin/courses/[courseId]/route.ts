import { CourseStatus, Difficulty } from '@prisma/client';
import { z } from 'zod';
import { requireAdminApi, apiErrorResponse, ApiError } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { getBuilderCourse } from '@/lib/builder';
import { uniqueCourseSlug } from '@/lib/slug';

const webUrl = z.string().trim().url().refine((value) => value.startsWith('https://') || value.startsWith('http://'), 'Use a public http or https URL.');

const updateSchema = z.object({
  title: z.string().trim().min(2).max(180).optional(),
  slug: z.string().trim().max(180).optional(),
  summary: z.string().trim().min(10).max(240).optional(),
  description: z.string().trim().min(20).max(20000).optional(),
  coverImage: z.union([webUrl, z.literal(''), z.null()]).optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  estimatedMinutes: z.coerce.number().int().min(1).max(10000).optional(),
  categoryId: z.string().min(1).optional(),
  featured: z.boolean().optional(),
  certificateEnabled: z.boolean().optional(),
  status: z.nativeEnum(CourseStatus).optional(),
});

type Params = { params: Promise<{ courseId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAdminApi();
    const { courseId } = await params;
    const course = await getBuilderCourse(courseId);
    if (!course) throw new ApiError('Course not found.', 404);
    return Response.json({ course });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdminApi();
    const { courseId } = await params;
    const existing = await db.course.findUnique({ where: { id: courseId } });
    if (!existing) throw new ApiError('Course not found.', 404);

    const input = updateSchema.parse(await request.json());
    if (input.status === CourseStatus.PUBLISHED) {
      throw new ApiError('Use the publish checklist to publish this course.', 400);
    }
    const slug = input.slug !== undefined
      ? await uniqueCourseSlug(input.slug || input.title || existing.title, courseId)
      : undefined;

    await db.course.update({
      where: { id: courseId },
      data: {
        ...input,
        ...(slug !== undefined ? { slug } : {}),
        ...(input.coverImage !== undefined ? { coverImage: input.coverImage || null } : {}),
      },
    });

    return Response.json({ course: await getBuilderCourse(courseId) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message || 'Invalid course details.' }, { status: 400 });
    }
    return apiErrorResponse(error);
  }
}
