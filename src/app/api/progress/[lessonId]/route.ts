import { z } from 'zod';
import { requireActiveUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { jsonError } from '@/lib/http';
const schema=z.object({completed:z.boolean()});
export async function PATCH(req:Request,{params}:{params:Promise<{lessonId:string}>}){
  try{
    const user=await requireActiveUser(); const {lessonId}=await params; const {completed}=schema.parse(await req.json());
    const lesson=await db.lesson.findUnique({where:{id:lessonId},select:{id:true,module:{select:{courseId:true}}}}); if(!lesson)return jsonError('Lesson not found.',404);
    await db.progress.upsert({where:{userId_lessonId:{userId:user.id,lessonId}},update:{completed,completedAt:completed?new Date():null},create:{userId:user.id,lessonId,completed,completedAt:completed?new Date():null}});
    await db.enrollment.upsert({where:{userId_courseId:{userId:user.id,courseId:lesson.module.courseId}},update:{lastOpenedAt:new Date()},create:{userId:user.id,courseId:lesson.module.courseId}});
    return Response.json({ok:true});
  }catch(e){console.error(e);return jsonError('Unable to update progress.',400)}
}
