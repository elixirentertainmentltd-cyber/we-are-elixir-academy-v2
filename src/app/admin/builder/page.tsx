import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { Shell } from '@/components/shell';
import { CourseBuilder } from '@/components/builder/course-builder';
import { CourseQuizStudio } from '@/components/quiz/course-quiz-studio';
import type { CourseListItem } from '@/components/builder/types';

export default async function BuilderPage() {
  const admin = await requireAdmin();
  const [courses, categories, lessons] = await Promise.all([
    db.course.findMany({
      include: {
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { modules: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    db.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    }),
    db.lesson.findMany({
      include: {
        module: { include: { course: { select: { title: true } } } },
        quiz: {
          include: {
            questions: {
              include: { options: { orderBy: { position: 'asc' } } },
              orderBy: { position: 'asc' },
            },
          },
        },
      },
      orderBy: [
        { module: { course: { title: 'asc' } } },
        { module: { position: 'asc' } },
        { position: 'asc' },
      ],
    }),
  ]);

  const initialCourses: CourseListItem[] = courses.map((course) => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    status: course.status,
    difficulty: course.difficulty,
    categoryId: course.categoryId,
    category: course.category,
    updatedAt: course.updatedAt.toISOString(),
    _count: course._count,
  }));

  return <Shell user={admin}>
    <div className="page-title builder-page-title">
      <p className="eyebrow">ADMIN COURSE STUDIO</p>
      <h1>Build learning without leaving the page</h1>
      <p>Create courses, lessons, content and quizzes from one workspace.</p>
    </div>
    <CourseBuilder initialCourses={initialCourses} categories={categories} />
    <CourseQuizStudio lessons={JSON.parse(JSON.stringify(lessons))} />
  </Shell>;
}
