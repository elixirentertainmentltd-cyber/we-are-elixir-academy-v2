import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Clock3, Download, HelpCircle, Video } from 'lucide-react';
import { requireActiveUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Shell } from '@/components/shell';
import { CompleteLessonButton } from '@/components/complete-lesson-button';
import { LessonBlocks } from '@/components/lesson-blocks';

export default async function LessonPage({ params }: { params: Promise<{ slug: string; lessonSlug: string }> }) {
  const user = await requireActiveUser();
  const { slug, lessonSlug } = await params;
  const course = await db.course.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: {
      modules: {
        orderBy: { position: 'asc' },
        include: {
          lessons: {
            orderBy: { position: 'asc' },
            include: {
              blocks: { orderBy: { position: 'asc' } },
              quiz: { select: { id: true, title: true, published: true, passScore: true } },
            },
          },
        },
      },
    },
  });
  if (!course) notFound();

  const lessons = course.modules.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, moduleTitle: module.title })));
  const currentIndex = lessons.findIndex((lesson) => lesson.slug === lessonSlug);
  if (currentIndex < 0) notFound();
  const lesson = lessons[currentIndex];
  const progress = await db.progress.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } } });

  await db.enrollment.upsert({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
    update: { lastOpenedAt: new Date() },
    create: { userId: user.id, courseId: course.id },
  });

  const previous = lessons[currentIndex - 1];
  const next = lessons[currentIndex + 1];
  const blocks = lesson.blocks.map((block) => ({ ...block, data: block.data as Record<string, unknown> }));
  const hasPublishedQuiz = Boolean(lesson.quiz?.published);

  return <Shell user={user}>
    <div className="lesson-layout">
      <aside className="lesson-sidebar">
        <Link href={`/courses/${course.slug}`} className="back-link"><ArrowLeft /> Course overview</Link>
        <p className="eyebrow">{course.title}</p>
        {course.modules.map((module) => <div key={module.id} className="sidebar-module"><strong>{module.title}</strong>{module.lessons.map((item) => <Link className={item.id === lesson.id ? 'active' : ''} key={item.id} href={`/courses/${course.slug}/${item.slug}`}>{item.title}{item.quiz?.published && <span className="sidebar-quiz-mark"> · Quiz</span>}</Link>)}</div>)}
      </aside>
      <article className="lesson-content">
        <p className="eyebrow">{lesson.moduleTitle}</p>
        <h1>{lesson.title}</h1>
        <div className="lesson-meta"><Clock3 /> {lesson.estimatedMinutes} minutes</div>
        {blocks.length ? <LessonBlocks blocks={blocks} /> : <>
          {lesson.videoUrl && <a className="resource-box" href={lesson.videoUrl} target="_blank" rel="noreferrer"><Video /> Watch lesson video</a>}
          <div className="prose">{lesson.content.split('\n').filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
          {lesson.resourceUrl && <a className="resource-box" href={lesson.resourceUrl} target="_blank" rel="noreferrer"><Download /> Download resource</a>}
        </>}

        {hasPublishedQuiz ? <section className="lesson-quiz-panel">
          <div><span className="lesson-quiz-icon"><HelpCircle /></span><div><p className="eyebrow">LESSON QUIZ</p><h2>{lesson.quiz?.title}</h2><p>Score at least {lesson.quiz?.passScore}% to complete this lesson.</p></div></div>
          <Link className="primary" href={`/quizzes/${lesson.id}`}>{progress?.completed ? 'View quiz result' : 'Take quiz'} <ArrowRight /></Link>
        </section> : <CompleteLessonButton lessonId={lesson.id} completed={Boolean(progress?.completed)} />}

        <nav className="lesson-nav">
          {previous ? <Link className="ghost" href={`/courses/${course.slug}/${previous.slug}`}><ArrowLeft /> {previous.title}</Link> : <span />}
          {next ? <Link className="primary" href={`/courses/${course.slug}/${next.slug}`}>{next.title} <ArrowRight /></Link> : <Link className="primary" href={`/courses/${course.slug}`}>Course overview <ArrowRight /></Link>}
        </nav>
      </article>
    </div>
  </Shell>;
}
