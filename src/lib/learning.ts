import { db } from './db';

export function courseStats(course:{modules:{lessons:{id:string;required:boolean}[]}[]}, completedIds:Set<string>) {
  const lessons = course.modules.flatMap(module => module.lessons).filter(lesson => lesson.required);
  const completed = lessons.filter(lesson => completedIds.has(lesson.id)).length;
  return { total: lessons.length, completed, percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0 };
}

export async function completedLessonIds(userId:string, courseId?:string) {
  const rows = await db.progress.findMany({
    where:{userId,completed:true,...(courseId?{lesson:{module:{courseId}}}:{})},
    select:{lessonId:true}
  });
  return new Set<string>(rows.map((row:{lessonId:string})=>row.lessonId));
}
