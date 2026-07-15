import { BlockType, Prisma } from '@prisma/client';
import { z } from 'zod';
import { requireAdminApi, apiErrorResponse, ApiError } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { getBuilderCourse } from '@/lib/builder';
import { validateBlockData } from '@/lib/block-data';

const blockSchema = z.object({
  id: z.string().optional(),
  type: z.nativeEnum(BlockType),
  data: z.unknown(),
});

const payloadSchema = z.object({
  blocks: z.array(blockSchema).max(250),
});

type Params = { params: Promise<{ lessonId: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    await requireAdminApi();
    const { lessonId } = await params;
    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { select: { courseId: true } } },
    });
    if (!lesson) throw new ApiError('Lesson not found.', 404);

    const input = payloadSchema.parse(await request.json());
    const blocks = input.blocks.map((block, index) => ({
      id: block.id,
      type: block.type,
      position: index + 1,
      data: validateBlockData(block.type, block.data) as Prisma.InputJsonValue,
    }));

    await db.$transaction(async (tx) => {
      await tx.lessonBlock.deleteMany({ where: { lessonId } });
      for (const block of blocks) {
        await tx.lessonBlock.create({
          data: {
            ...(block.id ? { id: block.id } : {}),
            lessonId,
            type: block.type,
            position: block.position,
            data: block.data,
          },
        });
      }
      await tx.lesson.update({
        where: { id: lessonId },
        data: { content: '', videoUrl: null, resourceUrl: null },
      });
    });

    return Response.json({ course: await getBuilderCourse(lesson.module.courseId) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message || 'Invalid lesson blocks.' }, { status: 400 });
    }
    return apiErrorResponse(error);
  }
}
