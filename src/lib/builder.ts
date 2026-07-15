import { BlockType, CourseStatus, Prisma } from '@prisma/client';
import { db } from './db';
import { isBlockReady } from './block-data';

export const builderCourseInclude = {
  category: true,
  modules: {
    orderBy: { position: 'asc' as const },
    include: {
      lessons: {
        orderBy: { position: 'asc' as const },
        include: {
          blocks: {
            orderBy: { position: 'asc' as const },
          },
        },
      },
    },
  },
} satisfies Prisma.CourseInclude;

export async function getBuilderCourse(courseId: string) {
  return db.course.findUnique({
    where: { id: courseId },
    include: builderCourseInclude,
  });
}

export type BuilderCourse = NonNullable<Awaited<ReturnType<typeof getBuilderCourse>>>;

export type PublishCheck = {
  id: string;
  label: string;
  passed: boolean;
  required: boolean;
};

export function publishChecklist(course: BuilderCourse): PublishCheck[] {
  const lessons = course.modules.flatMap((module) => module.lessons);
  const modulesReady = course.modules.length > 0 && course.modules.every((courseModule) => courseModule.lessons.length > 0);
  const contentReady = lessons.length > 0 && lessons.every((lesson) => {
    if (!lesson.blocks.length) {
      return Boolean(lesson.content.trim() || lesson.videoUrl || lesson.resourceUrl);
    }

    const hasLearningBlock = lesson.blocks.some((block) => block.type !== BlockType.DIVIDER);
    return hasLearningBlock && lesson.blocks.every((block) => isBlockReady(block.type, block.data));
  });

  return [
    { id: 'title', label: 'Course has a title', passed: Boolean(course.title.trim()), required: true },
    { id: 'summary', label: 'Course has a short summary', passed: Boolean(course.summary.trim()), required: true },
    { id: 'description', label: 'Course has a full description', passed: Boolean(course.description.trim()), required: true },
    { id: 'category', label: 'Course has a category', passed: Boolean(course.categoryId), required: true },
    { id: 'module', label: 'At least one module has been added', passed: course.modules.length > 0, required: true },
    { id: 'lesson', label: 'At least one lesson has been added', passed: lessons.length > 0, required: true },
    { id: 'module-lessons', label: 'Every module contains a lesson', passed: modulesReady, required: true },
    { id: 'content', label: 'Every lesson has content', passed: contentReady, required: true },
    { id: 'cover', label: 'Course has a cover image', passed: Boolean(course.coverImage), required: false },
  ];
}

export function canPublish(course: BuilderCourse) {
  return publishChecklist(course).filter((item) => item.required).every((item) => item.passed);
}

export const blockTypes = Object.values(BlockType);

export async function resequenceModules(courseId: string) {
  const rows = await db.module.findMany({
    where: { courseId },
    orderBy: { position: 'asc' },
    select: { id: true },
  });

  await db.$transaction(async (tx) => {
    await tx.module.updateMany({ where: { courseId }, data: { position: { increment: 10000 } } });
    for (let index = 0; index < rows.length; index += 1) {
      await tx.module.update({ where: { id: rows[index].id }, data: { position: index + 1 } });
    }
  });
}

export async function resequenceLessons(moduleId: string) {
  const rows = await db.lesson.findMany({
    where: { moduleId },
    orderBy: { position: 'asc' },
    select: { id: true },
  });

  await db.$transaction(async (tx) => {
    await tx.lesson.updateMany({ where: { moduleId }, data: { position: { increment: 10000 } } });
    for (let index = 0; index < rows.length; index += 1) {
      await tx.lesson.update({ where: { id: rows[index].id }, data: { position: index + 1 } });
    }
  });
}

export async function duplicateCourse(sourceId: string) {
  const source = await getBuilderCourse(sourceId);
  if (!source) return null;

  const copy = await db.$transaction(async (tx) => {
    const created = await tx.course.create({
      data: {
        title: `${source.title} Copy`,
        slug: `${source.slug}-copy-${Date.now().toString(36)}`,
        description: source.description,
        summary: source.summary,
        coverImage: source.coverImage,
        difficulty: source.difficulty,
        estimatedMinutes: source.estimatedMinutes,
        status: CourseStatus.DRAFT,
        featured: false,
        certificateEnabled: source.certificateEnabled,
        categoryId: source.categoryId,
      },
    });

    for (const courseModule of source.modules) {
      const newModule = await tx.module.create({
        data: {
          courseId: created.id,
          title: courseModule.title,
          description: courseModule.description,
          position: courseModule.position,
        },
      });

      for (const lesson of courseModule.lessons) {
        const newLesson = await tx.lesson.create({
          data: {
            moduleId: newModule.id,
            title: lesson.title,
            slug: lesson.slug,
            summary: lesson.summary,
            content: lesson.content,
            videoUrl: lesson.videoUrl,
            resourceUrl: lesson.resourceUrl,
            estimatedMinutes: lesson.estimatedMinutes,
            position: lesson.position,
            required: lesson.required,
          },
        });

        if (lesson.blocks.length) {
          await tx.lessonBlock.createMany({
            data: lesson.blocks.map((block) => ({
              lessonId: newLesson.id,
              type: block.type,
              position: block.position,
              data: block.data as Prisma.InputJsonValue,
            })),
          });
        }
      }
    }

    return created;
  });

  return getBuilderCourse(copy.id);
}
