'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Archive,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  FilePenLine,
  FolderOpen,
  Layers3,
  Pencil,
  Plus,
  Search,
  Send,
  RotateCcw,
  Settings2,
  Trash2,
  X,
} from 'lucide-react';
import { BlockEditor } from './block-editor';
import { requestJson } from './request-json';
import type {
  BuilderCategory,
  BuilderCourse,
  BuilderLesson,
  BuilderModule,
  CourseListItem,
  PublishCheck,
} from './types';

type StatusFilter = 'ALL' | BuilderCourse['status'];

type CourseDraft = {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  coverImage: string;
  difficulty: BuilderCourse['difficulty'];
  estimatedMinutes: number;
  categoryId: string;
  featured: boolean;
  certificateEnabled: boolean;
};

function courseToList(course: BuilderCourse): CourseListItem {
  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    status: course.status,
    difficulty: course.difficulty,
    updatedAt: course.updatedAt,
    categoryId: course.categoryId,
    category: course.category,
    _count: { modules: course.modules.length },
  };
}

function Modal({ children, onClose, wide = false }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return <div className="builder-modal-backdrop" role="presentation"><section className={`builder-modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true">{children}<button className="builder-modal-dismiss" onClick={onClose} aria-label="Close"><X /></button></section></div>;
}

function CourseForm({
  course,
  categories,
  onClose,
  onSaved,
}: {
  course?: BuilderCourse;
  categories: BuilderCategory[];
  onClose: () => void;
  onSaved: (course: BuilderCourse) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const initial: CourseDraft = {
    id: course?.id,
    title: course?.title || '',
    slug: course?.slug || '',
    summary: course?.summary || '',
    description: course?.description || '',
    coverImage: course?.coverImage || '',
    difficulty: course?.difficulty || 'BEGINNER',
    estimatedMinutes: course?.estimatedMinutes || 30,
    categoryId: course?.categoryId || categories[0]?.id || '',
    featured: course?.featured || false,
    certificateEnabled: course?.certificateEnabled ?? true,
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get('title') || ''),
      slug: String(form.get('slug') || ''),
      summary: String(form.get('summary') || ''),
      description: String(form.get('description') || ''),
      coverImage: String(form.get('coverImage') || ''),
      difficulty: String(form.get('difficulty') || 'BEGINNER'),
      estimatedMinutes: Number(form.get('estimatedMinutes') || 30),
      categoryId: String(form.get('categoryId') || ''),
      featured: form.get('featured') === 'on',
      certificateEnabled: form.get('certificateEnabled') === 'on',
    };

    try {
      const result = await requestJson<{ course: BuilderCourse }>(course ? `/api/admin/courses/${course.id}` : '/api/admin/courses', {
        method: course ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      onSaved(result.course);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save course.');
    } finally {
      setSaving(false);
    }
  }

  return <Modal onClose={onClose} wide><header className="builder-modal-header"><div><p className="eyebrow">COURSE SETTINGS</p><h2>{course ? 'Edit course' : 'Create a course'}</h2></div></header><form className="builder-form" onSubmit={submit}><div className="builder-field-grid"><label>Course title<input name="title" defaultValue={initial.title} required minLength={2} /></label><label>URL slug<input name="slug" defaultValue={initial.slug} placeholder="created-from-title" /></label><label className="full">Short summary<textarea name="summary" rows={3} defaultValue={initial.summary} required minLength={10} maxLength={240} /></label><label className="full">Full description<textarea name="description" rows={7} defaultValue={initial.description} required minLength={20} /></label><label className="full">Cover image URL<input name="coverImage" type="url" defaultValue={initial.coverImage} placeholder="https://..." /></label><label>Category<select name="categoryId" defaultValue={initial.categoryId} required>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Difficulty<select name="difficulty" defaultValue={initial.difficulty}><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></select></label><label>Estimated minutes<input name="estimatedMinutes" type="number" min={1} max={10000} defaultValue={initial.estimatedMinutes} /></label><label className="builder-checkbox"><input name="featured" type="checkbox" defaultChecked={initial.featured} /> Featured course</label><label className="builder-checkbox"><input name="certificateEnabled" type="checkbox" defaultChecked={initial.certificateEnabled} /> Certificate enabled</label></div>{error && <p className="error">{error}</p>}<div className="builder-form-actions"><button type="button" className="ghost" onClick={onClose}>Cancel</button><button className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save course'}</button></div></form></Modal>;
}

function ModuleForm({ courseId, module, onClose, onSaved }: { courseId: string; module?: BuilderModule; onClose: () => void; onSaved: (course: BuilderCourse) => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const payload = { courseId, title: String(form.get('title') || ''), description: String(form.get('description') || '') };
    try {
      const result = await requestJson<{ course: BuilderCourse }>(module ? `/api/admin/modules/${module.id}` : '/api/admin/modules', { method: module ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      onSaved(result.course);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save module.');
    } finally { setSaving(false); }
  }

  return <Modal onClose={onClose}><header className="builder-modal-header"><div><p className="eyebrow">COURSE STRUCTURE</p><h2>{module ? 'Edit module' : 'Add module'}</h2></div></header><form className="builder-form" onSubmit={submit}><label>Module title<input name="title" defaultValue={module?.title || ''} required minLength={2} /></label><label>Description<textarea name="description" rows={5} defaultValue={module?.description || ''} /></label>{error && <p className="error">{error}</p>}<div className="builder-form-actions"><button type="button" className="ghost" onClick={onClose}>Cancel</button><button className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save module'}</button></div></form></Modal>;
}

function LessonForm({ moduleId, lesson, onClose, onSaved, onCreated }: { moduleId: string; lesson?: BuilderLesson; onClose: () => void; onSaved: (course: BuilderCourse) => void; onCreated?: (lesson: BuilderLesson, course: BuilderCourse) => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const payload = { moduleId, title: String(form.get('title') || ''), slug: String(form.get('slug') || ''), summary: String(form.get('summary') || ''), estimatedMinutes: Number(form.get('estimatedMinutes') || 5), required: form.get('required') === 'on' };
    try {
      const result = await requestJson<{ course: BuilderCourse; lessonId?: string }>(lesson ? `/api/admin/lessons/${lesson.id}` : '/api/admin/lessons', { method: lesson ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      onSaved(result.course);
      const targetId = lesson?.id || result.lessonId;
      const newLesson = result.course.modules.flatMap((item) => item.lessons).find((item) => item.id === targetId);
      onClose();
      if (!lesson && newLesson && onCreated) onCreated(newLesson, result.course);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save lesson.');
    } finally { setSaving(false); }
  }

  return <Modal onClose={onClose}><header className="builder-modal-header"><div><p className="eyebrow">LESSON SETTINGS</p><h2>{lesson ? 'Edit lesson' : 'Add lesson'}</h2></div></header><form className="builder-form" onSubmit={submit}><label>Lesson title<input name="title" defaultValue={lesson?.title || ''} required minLength={2} /></label>{lesson && <label>URL slug<input name="slug" defaultValue={lesson.slug} /></label>}<label>Short summary<textarea name="summary" rows={4} maxLength={240} defaultValue={lesson?.summary || ''} /></label><label>Estimated minutes<input name="estimatedMinutes" type="number" min={1} max={1000} defaultValue={lesson?.estimatedMinutes || 5} /></label><label className="builder-checkbox"><input name="required" type="checkbox" defaultChecked={lesson?.required ?? true} /> Required for course completion</label>{error && <p className="error">{error}</p>}<div className="builder-form-actions"><button type="button" className="ghost" onClick={onClose}>Cancel</button><button className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save lesson'}</button></div></form></Modal>;
}

function PublishModal({ course, onClose, onSaved }: { course: BuilderCourse; onClose: () => void; onSaved: (course: BuilderCourse) => void }) {
  const [checks, setChecks] = useState<PublishCheck[] | null>(null);
  const [canPublish, setCanPublish] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    requestJson<{ checks: PublishCheck[]; canPublish: boolean }>(`/api/admin/courses/${course.id}/publish`)
      .then((result) => {
        if (!cancelled) {
          setChecks(result.checks);
          setCanPublish(result.canPublish);
        }
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to check course.');
      });
    return () => { cancelled = true; };
  }, [course.id]);

  async function setPublished(publish: boolean) {
    setWorking(true);
    setError('');
    try {
      const result = await requestJson<{ course: BuilderCourse }>(`/api/admin/courses/${course.id}/publish`, { method: 'POST', body: JSON.stringify({ publish }) });
      onSaved(result.course);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update publication status.');
    } finally { setWorking(false); }
  }

  return <Modal onClose={onClose}><header className="builder-modal-header"><div><p className="eyebrow">PUBLISH CHECKLIST</p><h2>{course.status === 'PUBLISHED' ? 'Manage publication' : 'Ready for learners?'}</h2></div></header>{error && <p className="error">{error}</p>}{checks ? <div className="publish-checklist">{checks.map((check) => <div key={check.id} className={check.passed ? 'publish-check passed' : 'publish-check failed'}><span>{check.passed ? <Check /> : <X />}</span><div><strong>{check.label}</strong><small>{check.required ? 'Required' : 'Recommended'}</small></div></div>)}</div> : <p>Checking your course…</p>}<div className="builder-form-actions"><button className="ghost" onClick={onClose}>Close</button>{course.status === 'PUBLISHED' ? <button className="ghost" disabled={working} onClick={() => setPublished(false)}>Move back to draft</button> : <button className="primary" disabled={working || !canPublish} onClick={() => setPublished(true)}>{working ? 'Publishing…' : 'Publish course'}</button>}</div></Modal>;
}

export function CourseBuilder({ initialCourses, categories }: { initialCourses: CourseListItem[]; categories: BuilderCategory[] }) {
  const [courses, setCourses] = useState(initialCourses);
  const [selected, setSelected] = useState<BuilderCourse | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [courseForm, setCourseForm] = useState<BuilderCourse | 'NEW' | null>(null);
  const [moduleForm, setModuleForm] = useState<BuilderModule | 'NEW' | null>(null);
  const [moduleCourseId, setModuleCourseId] = useState('');
  const [lessonForm, setLessonForm] = useState<BuilderLesson | 'NEW' | null>(null);
  const [lessonModuleId, setLessonModuleId] = useState('');
  const [blockLesson, setBlockLesson] = useState<BuilderLesson | null>(null);
  const [publishCourse, setPublishCourse] = useState<BuilderCourse | null>(null);
  const [working, setWorking] = useState('');

  const visibleCourses = useMemo(() => courses.filter((course) => {
    const matchesStatus = filter === 'ALL' || course.status === filter;
    const haystack = `${course.title} ${course.category.name}`.toLowerCase();
    return matchesStatus && haystack.includes(query.toLowerCase());
  }), [courses, filter, query]);

  function syncCourse(course: BuilderCourse) {
    setSelected(course);
    setCourses((current) => {
      const item = courseToList(course);
      const exists = current.some((entry) => entry.id === course.id);
      return exists ? current.map((entry) => entry.id === course.id ? item : entry) : [item, ...current];
    });
  }

  async function selectCourse(id: string) {
    setLoadingCourse(true);
    setError('');
    try {
      const result = await requestJson<{ course: BuilderCourse }>(`/api/admin/courses/${id}`);
      syncCourse(result.course);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to open course.');
    } finally { setLoadingCourse(false); }
  }

  async function mutate(url: string, init: RequestInit, message: string) {
    setWorking(url);
    setError('');
    try {
      const result = await requestJson<{ course: BuilderCourse }>(url, init);
      syncCourse(result.course);
      setNotice(message);
      window.setTimeout(() => setNotice(''), 2600);
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to complete the action.');
    } finally { setWorking(''); }
  }

  async function duplicate() {
    if (!selected || !window.confirm(`Duplicate “${selected.title}” and all its content?`)) return;
    setWorking('duplicate');
    try {
      const result = await requestJson<{ course: BuilderCourse }>(`/api/admin/courses/${selected.id}/duplicate`, { method: 'POST' });
      syncCourse(result.course);
      setNotice('Course duplicated as a new draft.');
    } catch (duplicateError) { setError(duplicateError instanceof Error ? duplicateError.message : 'Unable to duplicate course.'); }
    finally { setWorking(''); }
  }

  async function archive() {
    if (!selected || !window.confirm(`Archive “${selected.title}”? Learners will no longer see it.`)) return;
    await mutate(`/api/admin/courses/${selected.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'ARCHIVED' }) }, 'Course archived.');
  }

  async function restore() {
    if (!selected) return;
    await mutate(`/api/admin/courses/${selected.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'DRAFT' }) }, 'Course restored as a draft.');
  }

  async function removeModule(module: BuilderModule) {
    if (!window.confirm(`Delete module “${module.title}” and all of its lessons?`)) return;
    await mutate(`/api/admin/modules/${module.id}`, { method: 'DELETE' }, 'Module deleted.');
  }

  async function removeLesson(lesson: BuilderLesson) {
    if (!window.confirm(`Delete lesson “${lesson.title}”?`)) return;
    await mutate(`/api/admin/lessons/${lesson.id}`, { method: 'DELETE' }, 'Lesson deleted.');
  }

  async function reorder(kind: 'module' | 'lesson', id: string, direction: 'up' | 'down') {
    await mutate('/api/admin/reorder', { method: 'POST', body: JSON.stringify({ kind, id, direction }) }, 'Course order updated.');
  }

  return <div className="builder-app">
    <aside className="builder-course-panel"><div className="builder-panel-heading"><div><p className="eyebrow">COURSE STUDIO</p><h2>Your courses</h2></div><button className="primary small" onClick={() => setCourseForm('NEW')}><Plus /> New</button></div><label className="builder-search"><Search /><input aria-label="Search courses" placeholder="Search courses" value={query} onChange={(event) => setQuery(event.target.value)} /></label><div className="builder-filters">{(['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'] as StatusFilter[]).map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item === 'ALL' ? 'All' : item.toLowerCase()}</button>)}</div><div className="builder-course-list">{visibleCourses.map((course) => <button key={course.id} className={selected?.id === course.id ? 'builder-course-item active' : 'builder-course-item'} onClick={() => selectCourse(course.id)}><span className={`status-dot ${course.status.toLowerCase()}`} /><div><strong>{course.title}</strong><small>{course.category.name} · {course._count.modules} modules</small></div><span className="status-label">{course.status}</span></button>)}{!visibleCourses.length && <div className="builder-list-empty"><FolderOpen /><p>No courses in this view.</p></div>}</div></aside>

    <section className="builder-workspace">{notice && <div className="builder-notice"><CheckCircle2 /> {notice}</div>}{error && <p className="error builder-error">{error}</p>}{loadingCourse ? <div className="builder-loading"><span className="builder-spinner" /><p>Opening course studio…</p></div> : selected ? <><header className="builder-course-header"><div><div className="builder-title-row"><span className={`builder-status ${selected.status.toLowerCase()}`}>{selected.status}</span><span>{selected.category.name}</span></div><h1>{selected.title}</h1><p>{selected.summary}</p></div><div className="builder-header-actions"><button className="ghost" onClick={() => setCourseForm(selected)}><Settings2 /> Settings</button><Link className="ghost" href={`/admin/builder/${selected.id}/preview`} target="_blank"><Eye /> Preview</Link><button className="ghost" disabled={working === 'duplicate'} onClick={duplicate}><Copy /> Duplicate</button>{selected.status !== 'ARCHIVED' && <button className="primary" onClick={() => setPublishCourse(selected)}><Send /> {selected.status === 'PUBLISHED' ? 'Published' : 'Publish'}</button>}{selected.status === 'ARCHIVED' ? <button className="primary" onClick={restore}><RotateCcw /> Restore draft</button> : <button className="ghost danger-text" onClick={archive}><Archive /> Archive</button>}</div></header>

      <div className="builder-overview-grid"><article><BookOpen /><div><strong>{selected.modules.reduce((sum, module) => sum + module.lessons.length, 0)}</strong><span>Lessons</span></div></article><article><Layers3 /><div><strong>{selected.modules.length}</strong><span>Modules</span></div></article><article><FilePenLine /><div><strong>{selected.modules.flatMap((module) => module.lessons).filter((lesson) => lesson.blocks.length || lesson.content.trim()).length}</strong><span>Lessons with content</span></div></article></div>

      <div className="builder-structure-heading"><div><p className="eyebrow">COURSE STRUCTURE</p><h2>Modules and lessons</h2><p>Add content in small, self-paced lessons. Changes save without reloading the page.</p></div><button className="primary" onClick={() => { setModuleCourseId(selected.id); setModuleForm('NEW'); }}><Plus /> Add module</button></div>

      <div className="builder-module-list">{selected.modules.map((module, moduleIndex) => <article key={module.id} className="builder-module-card"><header><div className="builder-order-number">{String(moduleIndex + 1).padStart(2, '0')}</div><div className="builder-module-title"><h3>{module.title}</h3>{module.description && <p>{module.description}</p>}</div><div className="builder-row-actions"><button className="icon-button" disabled={moduleIndex === 0} onClick={() => reorder('module', module.id, 'up')} aria-label="Move module up"><ArrowUp /></button><button className="icon-button" disabled={moduleIndex === selected.modules.length - 1} onClick={() => reorder('module', module.id, 'down')} aria-label="Move module down"><ArrowDown /></button><button className="icon-button" onClick={() => { setModuleCourseId(selected.id); setModuleForm(module); }} aria-label="Edit module"><Pencil /></button><button className="icon-button danger-icon" onClick={() => removeModule(module)} aria-label="Delete module"><Trash2 /></button><button className="primary small" onClick={() => { setLessonModuleId(module.id); setLessonForm('NEW'); }}><Plus /> Lesson</button></div></header><div className="builder-lesson-list">{module.lessons.map((lesson, lessonIndex) => <div key={lesson.id} className="builder-lesson-row"><span className="lesson-order">{lessonIndex + 1}</span><div className="builder-lesson-main"><strong>{lesson.title}</strong><small>{lesson.summary || 'No summary yet'} · {lesson.estimatedMinutes} min {lesson.required ? '· Required' : '· Optional'}</small></div><span className={lesson.blocks.length || lesson.content.trim() ? 'content-state ready' : 'content-state'}>{lesson.blocks.length || lesson.content.trim() ? `${lesson.blocks.length || 1} block${lesson.blocks.length === 1 ? '' : 's'}` : 'No content'}</span><div className="builder-row-actions"><button className="primary small" onClick={() => setBlockLesson(lesson)}><FilePenLine /> Content</button><button className="icon-button" disabled={lessonIndex === 0} onClick={() => reorder('lesson', lesson.id, 'up')} aria-label="Move lesson up"><ArrowUp /></button><button className="icon-button" disabled={lessonIndex === module.lessons.length - 1} onClick={() => reorder('lesson', lesson.id, 'down')} aria-label="Move lesson down"><ArrowDown /></button><button className="icon-button" onClick={() => { setLessonModuleId(module.id); setLessonForm(lesson); }} aria-label="Edit lesson"><Pencil /></button><button className="icon-button danger-icon" onClick={() => removeLesson(lesson)} aria-label="Delete lesson"><Trash2 /></button></div></div>)}{!module.lessons.length && <button className="builder-add-first" onClick={() => { setLessonModuleId(module.id); setLessonForm('NEW'); }}><Plus /> Add the first lesson to this module</button>}</div></article>)}{!selected.modules.length && <div className="empty-state builder-empty"><Layers3 /><h2>Start with your first module</h2><p>Modules group related lessons together and give learners a clear path.</p><button className="primary" onClick={() => { setModuleCourseId(selected.id); setModuleForm('NEW'); }}><Plus /> Add first module</button></div>}</div>
    </> : <div className="empty-state builder-empty"><BookOpen /><h1>Choose a course to begin</h1><p>Select a course from the left, or create a new one. The studio will keep your structure and content in one tidy workspace.</p><button className="primary" onClick={() => setCourseForm('NEW')}><Plus /> Create your first course</button></div>}</section>

    {courseForm && <CourseForm course={courseForm === 'NEW' ? undefined : courseForm} categories={categories} onClose={() => setCourseForm(null)} onSaved={syncCourse} />}
    {moduleForm && <ModuleForm courseId={moduleCourseId} module={moduleForm === 'NEW' ? undefined : moduleForm} onClose={() => setModuleForm(null)} onSaved={syncCourse} />}
    {lessonForm && <LessonForm moduleId={lessonModuleId} lesson={lessonForm === 'NEW' ? undefined : lessonForm} onClose={() => setLessonForm(null)} onSaved={syncCourse} onCreated={(lesson, course) => { syncCourse(course); setBlockLesson(lesson); }} />}
    {blockLesson && <BlockEditor lesson={blockLesson} onClose={() => setBlockLesson(null)} onSaved={syncCourse} />}
    {publishCourse && <PublishModal course={publishCourse} onClose={() => setPublishCourse(null)} onSaved={syncCourse} />}
  </div>;
}
