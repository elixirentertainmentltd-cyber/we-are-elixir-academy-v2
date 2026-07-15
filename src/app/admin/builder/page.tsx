import Link from 'next/link';
import { ListChecks } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { Shell } from '@/components/shell';
import { CourseBuilder } from '@/components/builder/course-builder';
import type { CourseListItem } from '@/components/builder/types';

export default async function BuilderPage() {
  const admin = await requireAdmin();
  const [courses, categories] = await Promise.all([
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
    <div className="builder-page-heading-row">
      <div className="page-title builder-page-title"><p className="eyebrow">ADMIN COURSE STUDIO</p><h1>Build learning without leaving the page</h1><p>Create, organise, preview and publish self-paced courses with a visual lesson editor.</p></div>
      <Link className="primary builder-quiz-link" href="/admin/quizzes"><ListChecks /> Build quizzes</Link>
    </div>
    <CourseBuilder initialCourses={initialCourses} categories={categories} />
  </Shell>;
}
