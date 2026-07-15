'use client';

import { DragEvent, FormEvent, useMemo, useState } from 'react';
import { GripVertical, ListChecks, Plus, Trash2, X } from 'lucide-react';
import styles from './course-quiz-studio.module.css';

type Option = { id?: string; text: string; correct: boolean };
type Question = { id?: string; prompt: string; explanation: string; options: Option[] };
type Quiz = { id: string; title: string; instructions: string | null; passScore: number; attemptLimit: number | null; published: boolean; questions: Question[] };
type Lesson = { id: string; title: string; module: { title: string; course: { title: string } }; quiz: Quiz | null };

type Draft = { title: string; instructions: string; passScore: number; attemptLimit: string; published: boolean; questions: Question[] };

const blankQuestion = (): Question => ({ prompt: '', explanation: '', options: [{ text: '', correct: true }, { text: '', correct: false }] });

export function CourseQuizStudio({ lessons: initialLessons }: { lessons: Lesson[] }) {
  const [lessons, setLessons] = useState(initialLessons);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [dragQuestion, setDragQuestion] = useState<number | null>(null);
  const [dragOption, setDragOption] = useState<{ question: number; option: number } | null>(null);

  const grouped = useMemo(() => lessons, [lessons]);
  const lesson = lessons.find((item) => item.id === editingId) || null;

  function openEditor(item: Lesson) {
    setEditingId(item.id);
    setError('');
    setNotice('');
    setDraft(item.quiz ? {
      title: item.quiz.title,
      instructions: item.quiz.instructions || '',
      passScore: item.quiz.passScore,
      attemptLimit: item.quiz.attemptLimit ? String(item.quiz.attemptLimit) : '',
      published: item.quiz.published,
      questions: item.quiz.questions.map((question) => ({ ...question, explanation: question.explanation || '', options: question.options.map((option) => ({ ...option })) })),
    } : {
      title: `${item.title} quiz`,
      instructions: 'Choose the best answer for every question.',
      passScore: 80,
      attemptLimit: '',
      published: false,
      questions: [],
    });
  }

  function updateQuestion(index: number, patch: Partial<Question>) {
    setDraft((current) => current ? { ...current, questions: current.questions.map((question, questionIndex) => questionIndex === index ? { ...question, ...patch } : question) } : current);
  }

  function updateOption(questionIndex: number, optionIndex: number, patch: Partial<Option>) {
    setDraft((current) => {
      if (!current) return current;
      return { ...current, questions: current.questions.map((question, qi) => qi === questionIndex ? { ...question, options: question.options.map((option, oi) => oi === optionIndex ? { ...option, ...patch } : option) } : question) };
    });
  }

  function chooseCorrect(questionIndex: number, optionIndex: number) {
    setDraft((current) => current ? { ...current, questions: current.questions.map((question, qi) => qi === questionIndex ? { ...question, options: question.options.map((option, oi) => ({ ...option, correct: oi === optionIndex })) } : question) } : current);
  }

  function moveQuestion(to: number) {
    if (dragQuestion === null || !draft || dragQuestion === to) return;
    const next = [...draft.questions];
    const [item] = next.splice(dragQuestion, 1);
    next.splice(to, 0, item);
    setDraft({ ...draft, questions: next });
    setDragQuestion(null);
  }

  function moveOption(questionIndex: number, to: number) {
    if (!dragOption || !draft || dragOption.question !== questionIndex || dragOption.option === to) return;
    const questions = [...draft.questions];
    const options = [...questions[questionIndex].options];
    const [item] = options.splice(dragOption.option, 1);
    options.splice(to, 0, item);
    questions[questionIndex] = { ...questions[questionIndex], options };
    setDraft({ ...draft, questions });
    setDragOption(null);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!lesson || !draft) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/admin/quizzes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lessonId: lesson.id, title: draft.title, instructions: draft.instructions, passScore: Number(draft.passScore), attemptLimit: draft.attemptLimit ? Number(draft.attemptLimit) : null, published: draft.published, questions: draft.questions }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to save quiz.');
      setLessons((current) => current.map((item) => item.id === lesson.id ? { ...item, quiz: body.quiz } : item));
      setNotice('Quiz saved.');
      setEditingId(null); setDraft(null);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to save quiz.'); }
    finally { setSaving(false); }
  }

  async function removeQuiz() {
    if (!lesson?.quiz || !confirm(`Delete the quiz for “${lesson.title}”?`)) return;
    setSaving(true); setError('');
    const response = await fetch(`/api/admin/quizzes?lessonId=${encodeURIComponent(lesson.id)}`, { method: 'DELETE' });
    const body = await response.json();
    setSaving(false);
    if (!response.ok) { setError(body.error || 'Unable to delete quiz.'); return; }
    setLessons((current) => current.map((item) => item.id === lesson.id ? { ...item, quiz: null } : item));
    setEditingId(null); setDraft(null); setNotice('Quiz deleted.');
  }

  return <section className={styles.studio}>
    <div className={styles.heading}><div><p className="eyebrow">QUIZZES</p><h2>Create quizzes inside Course Studio</h2><p>Nothing is created automatically. Choose a lesson and click Add quiz when you are ready.</p></div></div>
    {notice && <p className="builder-notice">{notice}</p>}
    <div className={styles.list}>{grouped.map((item) => <article className={styles.lesson} key={item.id}><div><strong>{item.title}</strong><small>{item.module.course.title} · {item.module.title}</small></div><div className={styles.actions}>{item.quiz && <span className={`${styles.badge} ${item.quiz.published ? styles.live : ''}`}>{item.quiz.published ? 'Published quiz' : 'Draft quiz'}</span>}<button className={item.quiz ? 'ghost' : 'primary'} onClick={() => openEditor(item)}><ListChecks /> {item.quiz ? 'Edit quiz' : 'Add quiz'}</button></div></article>)}</div>

    {lesson && draft && <div className={styles.modal}><form className={styles.panel} onSubmit={save}><button type="button" className={styles.close} onClick={() => { setEditingId(null); setDraft(null); }} aria-label="Close"><X /></button><p className="eyebrow">{lesson.module.course.title} · {lesson.module.title}</p><h2>{lesson.quiz ? 'Edit quiz' : 'Create quiz'} for {lesson.title}</h2><div className={styles.grid}><label>Quiz title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required /></label><label>Pass score<input type="number" min={1} max={100} value={draft.passScore} onChange={(event) => setDraft({ ...draft, passScore: Number(event.target.value) })} /></label><label className={styles.full}>Instructions<textarea rows={3} value={draft.instructions} onChange={(event) => setDraft({ ...draft, instructions: event.target.value })} /></label><label>Attempt limit<input type="number" min={1} placeholder="Unlimited" value={draft.attemptLimit} onChange={(event) => setDraft({ ...draft, attemptLimit: event.target.value })} /></label><label className="builder-checkbox"><input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} /> Published for learners</label></div>
    <div className={styles.questions}>{draft.questions.map((question, questionIndex) => <article className={styles.question} key={question.id || questionIndex} draggable onDragStart={() => setDragQuestion(questionIndex)} onDragOver={(event: DragEvent) => event.preventDefault()} onDrop={() => moveQuestion(questionIndex)}><div className={styles.questionHead}><span className={styles.drag}><GripVertical /> Question {questionIndex + 1}</span><button type="button" className="icon-button danger-icon" onClick={() => setDraft({ ...draft, questions: draft.questions.filter((_, index) => index !== questionIndex) })}><Trash2 /></button></div><label>Question<input value={question.prompt} onChange={(event) => updateQuestion(questionIndex, { prompt: event.target.value })} required /></label><label>Explanation<textarea rows={2} value={question.explanation} onChange={(event) => updateQuestion(questionIndex, { explanation: event.target.value })} /></label>{question.options.map((option, optionIndex) => <div className={styles.option} key={option.id || optionIndex} draggable onDragStart={(event) => { event.stopPropagation(); setDragOption({ question: questionIndex, option: optionIndex }); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.stopPropagation(); moveOption(questionIndex, optionIndex); }}><input type="radio" name={`correct-${questionIndex}`} checked={option.correct} onChange={() => chooseCorrect(questionIndex, optionIndex)} aria-label="Correct answer"/><input type="text" value={option.text} onChange={(event) => updateOption(questionIndex, optionIndex, { text: event.target.value })} placeholder={`Answer ${optionIndex + 1}`} required/><button type="button" className="icon-button danger-icon" disabled={question.options.length <= 2} onClick={() => updateQuestion(questionIndex, { options: question.options.filter((_, index) => index !== optionIndex) })}><Trash2 /></button></div>)}<button type="button" className="ghost small" onClick={() => updateQuestion(questionIndex, { options: [...question.options, { text: '', correct: false }] })}><Plus /> Add answer</button></article>)}</div>
    {!draft.questions.length && <div className={styles.empty}>No questions yet. Add your first question when you are ready.</div>}
    {error && <p className="error">{error}</p>}
    <div className={styles.footer}><button type="button" className="ghost" onClick={() => setDraft({ ...draft, questions: [...draft.questions, blankQuestion()] })}><Plus /> Add question</button><div className={styles.footerRight}>{lesson.quiz && <button type="button" className="ghost danger-text" disabled={saving} onClick={removeQuiz}>Delete quiz</button>}<button type="button" className="ghost" onClick={() => { setEditingId(null); setDraft(null); }}>Cancel</button><button className="primary" disabled={saving || !draft.questions.length}>{saving ? 'Saving…' : 'Save quiz'}</button></div></div></form></div>}
  </section>;
}
