import Link from 'next/link';
import { BookOpen, Clock3, Signal } from 'lucide-react';
import { ProgressBar } from './progress-bar';
export function CourseCard({course,progress}:{course:{slug:string;title:string;summary:string;difficulty:string;estimatedMinutes:number;category:{name:string}},progress?:number}){
 return <article className="course-card"><div className="course-art"><span>{course.category.name}</span><BookOpen size={42}/></div><div className="course-body"><div className="course-meta"><span><Signal size={15}/>{course.difficulty.toLowerCase()}</span><span><Clock3 size={15}/>{course.estimatedMinutes} mins</span></div><h2>{course.title}</h2><p>{course.summary}</p>{typeof progress==='number'&&<ProgressBar value={progress}/>}<Link className="primary inline course-link" href={`/courses/${course.slug}`}>{progress?'Continue course':'View course'}</Link></div></article>
}
