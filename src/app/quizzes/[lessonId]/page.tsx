import { notFound, redirect } from 'next/navigation';
import { requireActiveUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Shell } from '@/components/shell';
import { QuizPlayer } from '@/components/quiz/quiz-player';

export default async function QuizPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const user = await requireActiveUser();;
  const { lessonId } = await params;
  const quiz = await db.quiz.findUnique({ where: { lessonId }, include: { questions: { include: { options: { select: { id: true, text: true, position: true } } }, orderBy: { position: 'asc' } } } });
  if (!quiz) notFound();
  if (!quiz.published && user.role !== 'ADMIN') redirect('/dashboard');
  const attemptsUsed = await db.quizAttempt.count({ where: { quizId: quiz.id, userId: user.id } });
  if (quiz.attemptLimit && attemptsUsed >= quiz.attemptLimit) return <Shell user={user}><div className="card"><h1>Attempt limit reached</h1><p>Please contact your Academy manager for support.</p></div></Shell>;
  return <Shell user={user}><QuizPlayer lessonId={lessonId} quiz={JSON.parse(JSON.stringify(quiz))} attemptsUsed={attemptsUsed} /></Shell>;
}
