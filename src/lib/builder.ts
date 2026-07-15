import { BlockType, CourseStatus, Prisma } from '@prisma/client';
import { db } from './db';
import { isBlockReady } from './block-data';

export const builderCourseInclude = {
  category: true,
  modules: { orderBy: { position: 'asc' as const }, include: { lessons: { orderBy: { position: 'asc' as const }, include: { blocks: { orderBy: { position: 'asc' as const } }, quiz: { include: { questions: { orderBy: { position: 'asc' as const }, include: { options: { orderBy: { position: 'asc' as const } } } } } } } } } },
} satisfies Prisma.CourseInclude;

export async function getBuilderCourse(courseId:string){ return db.course.findUnique({where:{id:courseId},include:builderCourseInclude}); }
export type BuilderCourse = NonNullable<Awaited<ReturnType<typeof getBuilderCourse>>>;
export type PublishCheck={id:string;label:string;passed:boolean;required:boolean};
export function publishChecklist(course:BuilderCourse):PublishCheck[]{
 const lessons=course.modules.flatMap(m=>m.lessons);
 const modulesReady=course.modules.length>0&&course.modules.every(m=>m.lessons.length>0);
 const contentReady=lessons.length>0&&lessons.every(l=>l.blocks.length?l.blocks.some(b=>b.type!==BlockType.DIVIDER)&&l.blocks.every(b=>isBlockReady(b.type,b.data)):Boolean(l.content.trim()||l.videoUrl||l.resourceUrl));
 return [
  {id:'title',label:'Course has a title',passed:Boolean(course.title.trim()),required:true},
  {id:'summary',label:'Course has a short summary',passed:Boolean(course.summary.trim()),required:true},
  {id:'description',label:'Course has a full description',passed:Boolean(course.description.trim()),required:true},
  {id:'category',label:'Course has a category',passed:Boolean(course.categoryId),required:true},
  {id:'module',label:'At least one module has been added',passed:course.modules.length>0,required:true},
  {id:'lesson',label:'At least one lesson has been added',passed:lessons.length>0,required:true},
  {id:'module-lessons',label:'Every module contains a lesson',passed:modulesReady,required:true},
  {id:'content',label:'Every lesson has content',passed:contentReady,required:true},
  {id:'cover',label:'Course has a cover image',passed:Boolean(course.coverImage),required:false},
 ];
}
export function canPublish(course:BuilderCourse){return publishChecklist(course).filter(i=>i.required).every(i=>i.passed)}
export const blockTypes=Object.values(BlockType);
export async function resequenceModules(courseId:string){const rows=await db.module.findMany({where:{courseId},orderBy:{position:'asc'},select:{id:true}});await db.$transaction(async tx=>{await tx.module.updateMany({where:{courseId},data:{position:{increment:10000}}});for(let i=0;i<rows.length;i++)await tx.module.update({where:{id:rows[i].id},data:{position:i+1}})})}
export async function resequenceLessons(moduleId:string){const rows=await db.lesson.findMany({where:{moduleId},orderBy:{position:'asc'},select:{id:true}});await db.$transaction(async tx=>{await tx.lesson.updateMany({where:{moduleId},data:{position:{increment:10000}}});for(let i=0;i<rows.length;i++)await tx.lesson.update({where:{id:rows[i].id},data:{position:i+1}})})}
export async function duplicateCourse(sourceId:string){const source=await getBuilderCourse(sourceId);if(!source)return null;const copy=await db.$transaction(async tx=>{const created=await tx.course.create({data:{title:`${source.title} Copy`,slug:`${source.slug}-copy-${Date.now().toString(36)}`,description:source.description,summary:source.summary,coverImage:source.coverImage,difficulty:source.difficulty,estimatedMinutes:source.estimatedMinutes,status:CourseStatus.DRAFT,featured:false,certificateEnabled:source.certificateEnabled,categoryId:source.categoryId}});for(const m of source.modules){const nm=await tx.module.create({data:{courseId:created.id,title:m.title,description:m.description,position:m.position}});for(const l of m.lessons){const nl=await tx.lesson.create({data:{moduleId:nm.id,title:l.title,slug:l.slug,summary:l.summary,content:l.content,videoUrl:l.videoUrl,resourceUrl:l.resourceUrl,estimatedMinutes:l.estimatedMinutes,position:l.position,required:l.required}});if(l.blocks.length)await tx.lessonBlock.createMany({data:l.blocks.map(b=>({lessonId:nl.id,type:b.type,position:b.position,data:b.data as Prisma.InputJsonValue}))});if(l.quiz){const q=await tx.quiz.create({data:{lessonId:nl.id,title:l.quiz.title,instructions:l.quiz.instructions,passScore:l.quiz.passScore,attemptLimit:l.quiz.attemptLimit,published:false}});for(const question of l.quiz.questions){const nq=await tx.quizQuestion.create({data:{quizId:q.id,prompt:question.prompt,explanation:question.explanation,position:question.position}});await tx.quizOption.createMany({data:question.options.map(o=>({questionId:nq.id,text:o.text,correct:o.correct,position:o.position}))})}}}}return created});return getBuilderCourse(copy.id)}
