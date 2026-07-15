import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const optionSchema = z.object({ text: z.string().min(1), correct: z.boolean() });
const questionSchema = z.object({ prompt: z.string().min(2), explanation: z.string().optional().default(''), options: z.array(optionSchema).min(2) }).refine((value) => value.options.filter((option) => option.correct).length === 1, 'Each question must have exactly one correct option.');
const schema = z.object({ lessonId: z.string().min(1), title: z.string().min(2), instructions: z.string().optional().default(''), passScore: z.number().int().min(1).max(100), attemptLimit: z.number().int().min(1).nullable(), published: z.boolean(), questions: z.array(questionSchema).min(1) });

export async function POST(request: Request) {
  await requireAdmin();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid quiz.' }, { status: 400 });
  const data = parsed.data;
  const quiz = await db.$transaction(async (tx) => {
    const saved = await tx.quiz.upsert({ where: { lessonId: data.lessonId }, update: { title: data.title, instructions: data.instructions, passScore: data.passScore, attemptLimit: data.attemptLimit, published: data.published }, create: { lessonId: data.lessonId, title: data.title, instructions: data.instructions, passScore: data.passScore, attemptLimit: data.attemptLimit, published: data.published } });
    await tx.quizQuestion.deleteMany({ where: { quizId: saved.id } });
    for (let questionIndex = 0; questionIndex < data.questions.length; questionIndex++) {
      const questionData = data.questions[questionIndex];
      const question = await tx.quizQuestion.create({ data: { quizId: saved.id, prompt: questionData.prompt, explanation: questionData.explanation, position: questionIndex + 1 } });
      await tx.quizOption.createMany({ data: questionData.options.map((option, optionIndex) => ({ questionId: question.id, text: option.text, correct: option.correct, position: optionIndex + 1 })) });
    }
    return tx.quiz.findUniqueOrThrow({ where: { id: saved.id }, include: { questions: { include: { options: true }, orderBy: { position: 'asc' } } } });
  });
  return NextResponse.json({ quiz });
}
