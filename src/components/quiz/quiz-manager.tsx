'use client';

import { DragEvent, FormEvent, useMemo, useState } from 'react';
import { CheckCircle2, GripVertical, Plus, Trash2 } from 'lucide-react';

type QuizOption = {
  id?: string;
  text: string;
  correct: boolean;
};

type QuizQuestion = {
  id?: string;
  prompt: string;
  explanation: string;
  options: QuizOption[];
};

type Lesson = {
  id: string;
  title: string;
  module: { title: string; course: { title: string } };
  quiz: {
    id: string;
    title: string;
    instructions: string;
    passScore: number;
    attemptLimit: number | null;
    published: boolean;
    questions: QuizQuestion[];
  } | null;
};

function blankQuestion(): QuizQuestion {
  return {
    prompt: '',
    explanation: '',
    options: [
      { text: '', correct: true },
      { text: '', correct: false },
    ],
  };
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function QuizManager({ lessons, initialLessonId = '' }: { lessons: Lesson[]; initialLessonId?: string }) {
  const firstLessonId = lessons.some((lesson) => lesson.id === initialLessonId)
    ? initialLessonId
    : lessons[0]?.id || '';
  const [items, setItems] = useState(lessons);
  const [selected, setSelected] = useState(firstLessonId);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [draggedQuestion, setDraggedQuestion] = useState<number | null>(null);
  const [draggedOption, setDraggedOption] = useState<{ question: number; option: number } | null>(null);

  const current = items.find((item) => item.id === selected);
  const [drafts, setDrafts] = useState<Record<string, QuizQuestion[]>>(() =>
    Object.fromEntries(
      lessons.map((lesson) => [
        lesson.id,
        lesson.quiz?.questions?.length
          ? lesson.quiz.questions.map((question) => ({
              ...question,
              explanation: question.explanation || '',
              options: question.options.map((option) => ({ ...option })),
            }))
          : [blankQuestion()],
      ]),
    ),
  );

  const questions = useMemo(() => drafts[selected] || [blankQuestion()], [drafts, selected]);

  function updateQuestions(next: QuizQuestion[]) {
    setDrafts((currentDrafts) => ({ ...currentDrafts, [selected]: next }));
  }

  function updateQuestion(index: number, patch: Partial<QuizQuestion>) {
    updateQuestions(questions.map((question, questionIndex) => questionIndex === index ? { ...question, ...patch } : question));
  }

  function updateOption(questionIndex: number, optionIndex: number, patch: Partial<QuizOption>) {
    const next = questions.map((question, index) => {
      if (index !== questionIndex) return question;
      return {
        ...question,
        options: question.options.map((option, currentOptionIndex) => currentOptionIndex === optionIndex ? { ...option, ...patch } : option),
      };
    });
    updateQuestions(next);
  }

  function setCorrectOption(questionIndex: number, optionIndex: number) {
    const next = questions.map((question, index) => {
      if (index !== questionIndex) return question;
      return {
        ...question,
        options: question.options.map((option, currentOptionIndex) => ({ ...option, correct: currentOptionIndex === optionIndex })),
      };
    });
    updateQuestions(next);
  }

  function addQuestion() {
    updateQuestions([...questions, blankQuestion()]);
  }

  function removeQuestion(index: number) {
    if (questions.length === 1) return;
    updateQuestions(questions.filter((_, questionIndex) => questionIndex !== index));
  }

  function addOption(questionIndex: number) {
    updateQuestion(questionIndex, { options: [...questions[questionIndex].options, { text: '', correct: false }] });
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    const question = questions[questionIndex];
    if (question.options.length <= 2) return;
    const nextOptions = question.options.filter((_, index) => index !== optionIndex);
    if (!nextOptions.some((option) => option.correct)) nextOptions[0].correct = true;
    updateQuestion(questionIndex, { options: nextOptions });
  }

  function dropQuestion(event: DragEvent, targetIndex: number) {
    event.preventDefault();
    if (draggedQuestion === null || draggedQuestion === targetIndex) return;
    updateQuestions(moveItem(questions, draggedQuestion, targetIndex));
    setDraggedQuestion(null);
  }

  function dropOption(event: DragEvent, questionIndex: number, targetIndex: number) {
    event.preventDefault();
    if (!draggedOption || draggedOption.question !== questionIndex || draggedOption.option === targetIndex) return;
    const question = questions[questionIndex];
    updateQuestion(questionIndex, { options: moveItem(question.options, draggedOption.option, targetIndex) });
    setDraggedOption(null);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!current) return;
    setSaving(true);
    setNotice('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/admin/quizzes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lessonId: selected,
          title: String(form.get('title') || ''),
          instructions: String(form.get('instructions') || ''),
          passScore: Number(form.get('passScore') || 80),
          attemptLimit: form.get('attemptLimit') ? Number(form.get('attemptLimit')) : null,
          published: form.get('published') === 'on',
          questions,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to save quiz.');
      setItems((all) => all.map((lesson) => lesson.id === selected ? { ...lesson, quiz: body.quiz } : lesson));
      setDrafts((all) => ({ ...all, [selected]: body.quiz.questions }));
      setNotice('Quiz saved successfully.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to save quiz.');
    } finally {
      setSaving(false);
    }
  }

  if (!lessons.length) return <div className="empty-state"><h2>Add a lesson first</h2><p>Quizzes are attached to lessons inside your courses.</p></div>;

  return <div className="quiz-studio-layout">
    <aside className="quiz-lesson-picker">
      <p className="eyebrow">CHOOSE LESSON</p>
      <select value={selected} onChange={(event) => setSelected(event.target.value)}>
        {items.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.module.course.title} · {lesson.module.title} · {lesson.title}</option>)}
      </select>
      <p>Passing a published quiz automatically completes the attached lesson.</p>
    </aside>

    {current && <form className="quiz-studio-form" onSubmit={save}>
      <header className="quiz-studio-header">
        <div><p className="eyebrow">QUIZ SETTINGS</p><h2>{current.quiz ? 'Edit quiz' : 'Create quiz'}</h2></div>
        <button className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save quiz'}</button>
      </header>

      <div className="builder-field-grid">
        <label className="full">Quiz title<input name="title" defaultValue={current.quiz?.title || `${current.title} quiz`} required /></label>
        <label className="full">Instructions<textarea name="instructions" rows={4} defaultValue={current.quiz?.instructions || 'Choose the best answer for every question.'} /></label>
        <label>Pass score (%)<input name="passScore" type="number" min={1} max={100} defaultValue={current.quiz?.passScore || 80} /></label>
        <label>Attempt limit<input name="attemptLimit" type="number" min={1} placeholder="Unlimited" defaultValue={current.quiz?.attemptLimit || ''} /></label>
        <label className="builder-checkbox full"><input name="published" type="checkbox" defaultChecked={current.quiz?.published || false} /> Published for learners</label>
      </div>

      <section className="quiz-question-list">
        <div className="quiz-question-heading"><div><p className="eyebrow">QUESTIONS</p><h2>Drag to reorder</h2></div><button type="button" className="primary" onClick={addQuestion}><Plus /> Add question</button></div>
        {questions.map((question, questionIndex) => <article
          key={question.id || `question-${questionIndex}`}
          className="quiz-question-card"
          draggable
          onDragStart={() => setDraggedQuestion(questionIndex)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => dropQuestion(event, questionIndex)}
        >
          <div className="quiz-question-card-header"><span className="quiz-drag-handle"><GripVertical /></span><strong>Question {questionIndex + 1}</strong><button type="button" className="icon-button danger-icon" disabled={questions.length === 1} onClick={() => removeQuestion(questionIndex)} aria-label="Delete question"><Trash2 /></button></div>
          <label>Question<input value={question.prompt} onChange={(event) => updateQuestion(questionIndex, { prompt: event.target.value })} placeholder="Enter your question" /></label>
          <label>Answer explanation<textarea rows={3} value={question.explanation} onChange={(event) => updateQuestion(questionIndex, { explanation: event.target.value })} placeholder="Shown after the learner submits" /></label>
          <div className="quiz-option-list">
            {question.options.map((option, optionIndex) => <div
              key={option.id || `option-${optionIndex}`}
              className={`quiz-option-row ${option.correct ? 'correct' : ''}`}
              draggable
              onDragStart={(event) => { event.stopPropagation(); setDraggedOption({ question: questionIndex, option: optionIndex }); }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => dropOption(event, questionIndex, optionIndex)}
            >
              <GripVertical className="quiz-option-grip" />
              <input type="radio" name={`correct-${questionIndex}`} checked={option.correct} onChange={() => setCorrectOption(questionIndex, optionIndex)} aria-label={`Mark answer ${optionIndex + 1} correct`} />
              <input value={option.text} onChange={(event) => updateOption(questionIndex, optionIndex, { text: event.target.value })} placeholder={`Answer ${optionIndex + 1}`} />
              {option.correct && <span className="quiz-correct-label"><CheckCircle2 /> Correct</span>}
              <button type="button" className="icon-button danger-icon" disabled={question.options.length <= 2} onClick={() => removeOption(questionIndex, optionIndex)} aria-label="Delete answer"><Trash2 /></button>
            </div>)}
            <button type="button" className="ghost quiz-add-option" onClick={() => addOption(questionIndex)}><Plus /> Add answer</button>
          </div>
        </article>)}
      </section>
      {notice && <p className={notice.includes('successfully') ? 'quiz-notice success' : 'quiz-notice error'}>{notice}</p>}
      <button className="primary quiz-save-bottom" disabled={saving}>{saving ? 'Saving…' : 'Save quiz'}</button>
    </form>}
  </div>;
}
