/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock3, Eye } from 'lucide-react';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { getBuilderCourse } from '@/lib/builder';
import { Shell } from '@/components/shell';
import { LessonBlocks } from '@/components/lesson-blocks';

export default async function CoursePreviewPage({ params }: { params: Promise<{ courseId: string }> }) {
  const admin = await requireAdmin();
  const { courseId } = await params;
  const course = await getBuilderCourse(courseId);
  if (!course) notFound();

  const lessonCount = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);

  return <Shell user={admin}><div className="preview-topbar"><Link className="ghost" href="/admin/builder"><ArrowLeft /> Back to Course Studio</Link><span><Eye /> Admin preview · {course.status.toLowerCase()}</span></div><section className="course-hero preview-course-hero"><div><span className="pill">{course.category.name}</span><h1>{course.title}</h1><p>{course.description}</p><div className="course-hero-meta"><span><Clock3 /> {course.estimatedMinutes} minutes</span><span><BookOpen /> {lessonCount} lessons</span></div></div>{course.coverImage ? <div className="preview-cover"><img src={course.coverImage} alt="" /></div> : <div className="course-progress-panel"><Eye /><strong>Preview</strong><span>This is how the course content will appear to learners.</span></div>}</section><div className="preview-module-list">{course.modules.map((module, moduleIndex) => <section key={module.id} className="preview-module"><header><span>{String(moduleIndex + 1).padStart(2, '0')}</span><div><h2>{module.title}</h2>{module.description && <p>{module.description}</p>}</div></header>{module.lessons.map((lesson, lessonIndex) => <article key={lesson.id} className="preview-lesson"><div className="preview-lesson-heading"><span>{lessonIndex + 1}</span><div><p className="eyebrow">LESSON</p><h2>{lesson.title}</h2>{lesson.summary && <p>{lesson.summary}</p>}</div></div>{lesson.blocks.length ? <LessonBlocks blocks={lesson.blocks.map((block) => ({ ...block, data: block.data as Record<string, unknown> }))} /> : lesson.content ? <div className="prose">{lesson.content.split('\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div> : <div className="empty-state"><h3>No lesson content yet</h3><p>Add blocks in the Course Studio before publishing.</p></div>}</article>)}</section>)}</div></Shell>;
}
