import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { Shell } from '@/components/shell';
import { QuizManager } from '@/components/quiz/quiz-manager';

export default async function AdminQuizzesPage() {
  const admin = await requireAdmin();
  const lessons = await db.lesson.findMany({
    include: { module: { include: { course: true } }, quiz: { include: { questions: { orderBy: { position: 'asc' } } } } },
    orderBy: [{ module: { course: { title: 'asc' } } }, { module: { position: 'asc' } }, { position: 'asc' }],
  });
  return <Shell user={admin}><div className="page-title"><p className="eyebrow">PART 4 · QUIZZES</p><h1>Quiz builder</h1><p>Create pass-to-complete assessments for any lesson.</p></div><QuizManager lessons={JSON.parse(JSON.stringify(lessons))} /></Shell>;
}
