import { NextResponse } from 'next/server';
import { requireActiveUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { syncCourseCompletion } from '@/lib/quiz';
import { z } from 'zod';

const schema = z.object({ answers: z.array(z.object({ questionId: z.string(), optionId: z.string() })) });

export async function POST(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const user = await requireActiveUser();
  const { lessonId } = await params;
  const input = schema.safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: 'Invalid answers.' }, { status: 400 });
  const quiz = await db.quiz.findUnique({ where: { lessonId }, include: { lesson: { include: { module: true } }, questions: { include: { options: true }, orderBy: { position: 'asc' } } } });
  if (!quiz || (!quiz.published && user.role !== 'ADMIN')) return NextResponse.json({ error: 'Quiz not available.' }, { status: 404 });
  const used = await db.quizAttempt.count({ where: { quizId: quiz.id, userId: user.id } });
  if (quiz.attemptLimit && used >= quiz.attemptLimit) return NextResponse.json({ error: 'Attempt limit reached.' }, { status: 403 });
  const selected = new Map(input.data.answers.map((answer) => [answer.questionId, answer.optionId]));
  let correctCount = 0;
  const feedback = quiz.questions.map((question) => {
    const correct = question.options.find((option) => option.correct);
    const isCorrect = Boolean(correct && selected.get(question.id) === correct.id);
    if (isCorrect) correctCount++;
    return { questionId: question.id, correct: isCorrect, explanation: question.explanation };
  });
  const score = quiz.questions.length ? Math.round((correctCount / quiz.questions.length) * 100) : 0;
  const passed = score >= quiz.passScore;
  await db.quizAttempt.create({ data: { quizId: quiz.id, userId: user.id, score, passed, answers: input.data.answers } });
  if (passed) {
    await db.progress.upsert({ where: { userId_lessonId: { userId: user.id, lessonId } }, update: { completed: true, completedAt: new Date() }, create: { userId: user.id, lessonId, completed: true, completedAt: new Date() } });
    await syncCourseCompletion(user.id, quiz.lesson.module.courseId);
  }
  return NextResponse.json({ score, passed, feedback });
}
