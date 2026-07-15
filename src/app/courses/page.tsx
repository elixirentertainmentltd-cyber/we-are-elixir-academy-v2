import { Search } from 'lucide-react';
import { requireActiveUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Shell } from '@/components/shell';
import { CourseCard } from '@/components/course-card';
import { completedLessonIds, courseStats } from '@/lib/learning';

export default async function CoursesPage({searchParams}:{searchParams:Promise<{q?:string;category?:string}>}){
 const user=await requireActiveUser(); const params=await searchParams; const q=params.q?.trim()||''; const category=params.category||'';
 const [courses,categories,completed]=await Promise.all([
  db.course.findMany({where:{status:'PUBLISHED',...(category?{category:{slug:category}}:{}),...(q?{OR:[{title:{contains:q}},{summary:{contains:q}},{description:{contains:q}},{category:{name:{contains:q}}}]}:{})},include:{category:true,modules:{include:{lessons:{select:{id:true,required:true}}},orderBy:{position:'asc'}}},orderBy:[{featured:'desc'},{title:'asc'}]}),
  db.category.findMany({orderBy:{name:'asc'}}), completedLessonIds(user.id)
 ]);
 return <Shell user={user}><div className="page-title split-title"><div><p className="eyebrow">COURSE LIBRARY</p><h1>Learn at your pace</h1><p>Practical training built for creators, staff and the wider Elixir community.</p></div></div>
 <form className="filter-bar"><label className="search-field"><Search size={19}/><input name="q" defaultValue={q} placeholder="Search courses"/></label><select name="category" defaultValue={category}><option value="">All categories</option>{categories.map(c=><option key={c.id} value={c.slug}>{c.name}</option>)}</select><button className="primary">Search</button></form>
 {courses.length?<div className="course-grid">{courses.map(course=><CourseCard key={course.id} course={course} progress={courseStats(course,completed).percent}/>)}</div>:<div className="empty-state"><h2>No courses found</h2><p>Try a broader search or choose another category.</p></div>}</Shell>
}
