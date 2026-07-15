'use client';
import { FormEvent, useState } from 'react';

type Lesson = { id: string; title: string; module: { title: string; course: { title: string } }; quiz: { id: string; title: string; passScore: number; attemptLimit: number | null; published: boolean; questions: { id: string }[] } | null };

export function QuizManager({ lessons }: { lessons: Lesson[] }) {
  const [items, setItems] = useState(lessons);
  const [selected, setSelected] = useState(lessons[0]?.id || '');
  const [notice, setNotice] = useState('');
  const current = items.find((item) => item.id === selected);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const questions = JSON.parse(String(form.get('questions') || '[]'));
    const response = await fetch('/api/admin/quizzes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lessonId: selected, title: form.get('title'), instructions: form.get('instructions'), passScore: Number(form.get('passScore')), attemptLimit: form.get('attemptLimit') ? Number(form.get('attemptLimit')) : null, published: form.get('published') === 'on', questions }) });
    const body = await response.json();
    if (!response.ok) { setNotice(body.error || 'Unable to save quiz.'); return; }
    setItems((all) => all.map((lesson) => lesson.id === selected ? { ...lesson, quiz: body.quiz } : lesson));
    setNotice('Quiz saved.');
  }

  const starter = current?.quiz ? JSON.stringify(current.quiz.questions.map((_, index) => ({ prompt: `Question ${index + 1}`, explanation: '', options: [{ text: 'Answer A', correct: true }, { text: 'Answer B', correct: false }] })), null, 2) : JSON.stringify([{ prompt: 'What is the correct answer?', explanation: 'Explain why this answer is correct.', options: [{ text: 'Correct answer', correct: true }, { text: 'Incorrect answer', correct: false }] }], null, 2);

  return <div className="quiz-admin-grid"><aside className="card"><h2>Choose lesson</h2><select value={selected} onChange={(event) => setSelected(event.target.value)}>{items.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.module.course.title} · {lesson.module.title} · {lesson.title}</option>)}</select><p className="muted">Quizzes are attached to one lesson. Passing automatically completes that lesson.</p></aside>{current && <form className="card quiz-form" onSubmit={save}><h2>{current.quiz ? 'Edit quiz' : 'Create quiz'}</h2><label>Quiz title<input name="title" defaultValue={current.quiz?.title || `${current.title} quiz`} required /></label><label>Instructions<textarea name="instructions" rows={4} defaultValue="Choose the best answer for every question." /></label><div className="builder-field-grid"><label>Pass score<input name="passScore" type="number" min={1} max={100} defaultValue={current.quiz?.passScore || 80} /></label><label>Attempt limit<input name="attemptLimit" type="number" min={1} placeholder="Unlimited" defaultValue={current.quiz?.attemptLimit || ''} /></label></div><label className="builder-checkbox"><input name="published" type="checkbox" defaultChecked={current.quiz?.published || false} /> Published for learners</label><label>Questions JSON<textarea name="questions" rows={18} defaultValue={starter} spellCheck={false} /></label><p className="muted">Each question needs a prompt, at least two options, and exactly one correct option.</p>{notice && <p>{notice}</p>}<button className="primary">Save quiz</button></form>}</div>;
}
