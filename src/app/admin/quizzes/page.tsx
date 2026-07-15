import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { Shell } from '@/components/shell';
import { QuizManager } from '@/components/quiz/quiz-manager';

export default async function AdminQuizzesPage({ searchParams }: { searchParams: Promise<{ lessonId?: string }> }) {
  const admin = await requireAdmin();
  const { lessonId = '' } = await searchParams;
  const lessons = await db.lesson.findMany({
    include: {
      module: { include: { course: true } },
      quiz: {
        include: {
          questions: {
            include: { options: { orderBy: { position: 'asc' } } },
            orderBy: { position: 'asc' },
          },
        },
      },
    },
    orderBy: [{ module: { course: { title: 'asc' } } }, { module: { position: 'asc' } }, { position: 'asc' }],
  });

  return <Shell user={admin}>
    <div className="page-title"><p className="eyebrow">COURSE STUDIO · QUIZZES</p><h1>Visual quiz builder</h1><p>Create, drag, reorder and publish pass-to-complete quizzes for any lesson.</p></div>
    <QuizManager lessons={JSON.parse(JSON.stringify(lessons))} initialLessonId={lessonId} />
  </Shell>;
}
