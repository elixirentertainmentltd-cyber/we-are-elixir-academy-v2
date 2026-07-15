'use client';
import { FormEvent, useState } from 'react';

type Quiz = { title: string; instructions: string | null; passScore: number; attemptLimit: number | null; questions: { id: string; prompt: string; options: { id: string; text: string }[] }[] };

export function QuizPlayer({ lessonId, quiz, attemptsUsed }: { lessonId: string; quiz: Quiz; attemptsUsed: number }) {
  const [result, setResult] = useState<{ score: number; passed: boolean; feedback: { questionId: string; correct: boolean; explanation: string | null }[] } | null>(null);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget);
    const answers = quiz.questions.map((question) => ({ questionId: question.id, optionId: String(form.get(question.id) || '') }));
    const response = await fetch(`/api/quizzes/${lessonId}/submit`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ answers }) });
    const body = await response.json();
    if (!response.ok) { setError(body.error || 'Unable to submit quiz.'); return; }
    setResult(body);
  }
  if (result) return <div className={`card quiz-result ${result.passed ? 'passed' : 'failed'}`}><h2>{result.passed ? 'Quiz passed 🎉' : 'Not quite yet'}</h2><p>Your score: <strong>{result.score}%</strong>. Pass mark: {quiz.passScore}%.</p>{result.feedback.map((item, index) => <div key={item.questionId}><strong>Question {index + 1}: {item.correct ? 'Correct' : 'Incorrect'}</strong>{item.explanation && <p>{item.explanation}</p>}</div>)}</div>;
  return <form className="quiz-player" onSubmit={submit}><div className="card"><h1>{quiz.title}</h1>{quiz.instructions && <p>{quiz.instructions}</p>}<p className="muted">Pass mark: {quiz.passScore}%{quiz.attemptLimit ? ` · Attempt ${attemptsUsed + 1} of ${quiz.attemptLimit}` : ' · Unlimited attempts'}</p></div>{quiz.questions.map((question, index) => <fieldset className="card" key={question.id}><legend>{index + 1}. {question.prompt}</legend>{question.options.map((option) => <label className="quiz-option" key={option.id}><input type="radio" name={question.id} value={option.id} required /> {option.text}</label>)}</fieldset>)}{error && <p className="error">{error}</p>}<button className="primary">Submit answers</button></form>;
}
