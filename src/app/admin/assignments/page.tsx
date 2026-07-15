import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { Shell } from '@/components/shell';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export default async function AssignmentAdmin() {
  const user = await requireAdmin();
  async function create(formData: FormData) {
    'use server';
    const admin=await requireAdmin();
    const item=await db.assignment.create({data:{title:String(formData.get('title')),instructions:String(formData.get('instructions')),courseId:String(formData.get('courseId')),published:formData.get('published')==='on'}});
    await audit(admin.id,'CREATE','Assignment',item.id,{title:item.title}); revalidatePath('/admin/assignments');
  }
  async function review(formData: FormData) {
    'use server';
    const admin=await requireAdmin(); const id=String(formData.get('id'));
    await db.assignmentSubmission.update({where:{id},data:{status:String(formData.get('status')) as 'APPROVED'|'NEEDS_CHANGES'|'REJECTED',grade:String(formData.get('grade')||'')||null,feedback:String(formData.get('feedback')||''),reviewedAt:new Date()}});
    await audit(admin.id,'REVIEW','AssignmentSubmission',id); revalidatePath('/admin/assignments');
  }
  const [courses,assignments,submissions]=await Promise.all([
    db.course.findMany({orderBy:{title:'asc'}}),
    db.assignment.findMany({include:{course:true},orderBy:{createdAt:'desc'}}),
    db.assignmentSubmission.findMany({where:{status:{in:['SUBMITTED','NEEDS_CHANGES']}},include:{assignment:true,user:true},orderBy:{submittedAt:'desc'}})
  ]);
  return <Shell user={user}><div className="page-title"><p className="eyebrow">ADMIN</p><h1>Assignment studio</h1></div>
    <form action={create} className="card form-grid"><label>Title<input name="title" required/></label><label>Course<select name="courseId">{courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label><label className="full">Instructions<textarea name="instructions" rows={5} required/></label><label className="builder-checkbox"><input type="checkbox" name="published"/> Publish immediately</label><button className="primary">Create assignment</button></form>
    <section className="section-block"><h2>Pending reviews</h2><div className="stack">{submissions.map(s=><article className="card" key={s.id}><h3>{s.assignment.title} · {s.user.name}</h3><p>{s.textAnswer}</p>{s.linkUrl&&<a href={s.linkUrl}>Open submitted link</a>}{Array.isArray(s.fileUrls)&&s.fileUrls.map((url)=><a key={String(url)} href={String(url)}>Open file</a>)}<form action={review} className="form-grid"><input type="hidden" name="id" value={s.id}/><label>Status<select name="status"><option value="APPROVED">Approve</option><option value="NEEDS_CHANGES">Needs changes</option><option value="REJECTED">Reject</option></select></label><label>Grade<input name="grade" placeholder="Pass, Merit, 92%..."/></label><label className="full">Feedback<textarea name="feedback" rows={3}/></label><button className="primary">Save review</button></form></article>)}</div></section>
    <section className="section-block"><h2>Assignments</h2><div className="table-wrap"><table><thead><tr><th>Title</th><th>Course</th><th>Status</th></tr></thead><tbody>{assignments.map(a=><tr key={a.id}><td>{a.title}</td><td>{a.course.title}</td><td>{a.published?'Published':'Draft'}</td></tr>)}</tbody></table></div></section>
  </Shell>;
}
