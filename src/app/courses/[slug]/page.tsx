import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookOpen, CheckCircle2, Clock3, PlayCircle } from 'lucide-react';
import { requireActiveUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Shell } from '@/components/shell';
import { ProgressBar } from '@/components/progress-bar';
import { completedLessonIds, courseStats } from '@/lib/learning';

export default async function CoursePage({params}:{params:Promise<{slug:string}>}){
 const user=await requireActiveUser(); const {slug}=await params;
 const course=await db.course.findFirst({where:{slug,status:'PUBLISHED'},include:{category:true,modules:{orderBy:{position:'asc'},include:{lessons:{orderBy:{position:'asc'}}}}}}); if(!course)notFound();
 await db.enrollment.upsert({where:{userId_courseId:{userId:user.id,courseId:course.id}},update:{lastOpenedAt:new Date()},create:{userId:user.id,courseId:course.id}});
 const completed=await completedLessonIds(user.id,course.id); const stats=courseStats(course,completed); const firstIncomplete=course.modules.flatMap(m=>m.lessons).find(l=>!completed.has(l.id))||course.modules[0]?.lessons[0];
 return <Shell user={user}><section className="course-hero"><div><span className="pill">{course.category.name}</span><h1>{course.title}</h1><p>{course.description}</p><div className="course-hero-meta"><span><Clock3/> {course.estimatedMinutes} minutes</span><span><BookOpen/> {stats.total} lessons</span><span><CheckCircle2/> {stats.completed} completed</span></div>{firstIncomplete&&<Link className="primary inline" href={`/courses/${course.slug}/${firstIncomplete.slug}`}><PlayCircle/> {stats.completed?'Continue learning':'Start course'}</Link>}</div><div className="course-progress-panel"><strong>{stats.percent}%</strong><span>complete</span><ProgressBar value={stats.percent} label={false}/></div></section>
 <div className="module-list">{course.modules.map((module,index)=><section className="module-card" key={module.id}><div className="module-heading"><span>{String(index+1).padStart(2,'0')}</span><div><h2>{module.title}</h2>{module.description&&<p>{module.description}</p>}</div></div><div className="lesson-list">{module.lessons.map((lesson,lessonIndex)=><Link className="lesson-row" key={lesson.id} href={`/courses/${course.slug}/${lesson.slug}`}><span className={completed.has(lesson.id)?'lesson-check done':'lesson-check'}>{completed.has(lesson.id)?'✓':lessonIndex+1}</span><div><strong>{lesson.title}</strong><small>{lesson.summary}</small></div><span>{lesson.estimatedMinutes} min</span></Link>)}</div></section>)}</div></Shell>
}
