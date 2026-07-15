import { CourseStatus, Difficulty } from '@prisma/client';
import { z } from 'zod';
import { requireAdminApi, apiErrorResponse } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { getBuilderCourse } from '@/lib/builder';
import { uniqueCourseSlug } from '@/lib/slug';

const webUrl = z.string().trim().url().refine((value) => value.startsWith('https://') || value.startsWith('http://'), 'Use a public http or https URL.');

const createSchema = z.object({
  title: z.string().trim().min(2).max(180),
  slug: z.string().trim().max(180).optional().default(''),
  summary: z.string().trim().min(10).max(240),
  description: z.string().trim().min(20).max(20000),
  coverImage: z.union([webUrl, z.literal('')]).optional().default(''),
  difficulty: z.nativeEnum(Difficulty).default(Difficulty.BEGINNER),
  estimatedMinutes: z.coerce.number().int().min(1).max(10000).default(30),
  categoryId: z.string().min(1),
  featured: z.boolean().default(false),
  certificateEnabled: z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    await requireAdminApi();
    const input = createSchema.parse(await request.json());
    const slug = await uniqueCourseSlug(input.slug || input.title);

    const course = await db.course.create({
      data: {
        title: input.title,
        slug,
        summary: input.summary,
        description: input.description,
        coverImage: input.coverImage || null,
        difficulty: input.difficulty,
        estimatedMinutes: input.estimatedMinutes,
        categoryId: input.categoryId,
        featured: input.featured,
        certificateEnabled: input.certificateEnabled,
        status: CourseStatus.DRAFT,
      },
    });

    return Response.json({ course: await getBuilderCourse(course.id) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message || 'Invalid course details.' }, { status: 400 });
    }
    return apiErrorResponse(error);
  }
}
