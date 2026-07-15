import { revalidatePath } from 'next/cache';
import { requireActiveUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Shell } from '@/components/shell';
import { saveUpload } from '@/lib/media';

export const dynamic = 'force-dynamic';

export default async function AssignmentsPage() {
  const user = await requireActiveUser();
  async function submit(formData: FormData) {
    'use server';
    const learner = await requireActiveUser();
    const assignmentId = String(formData.get('assignmentId') || '');
    const file = formData.get('file');
    let fileUrls: string[] = [];
    if (file instanceof File && file.size) fileUrls = [(await saveUpload(file)).url];
    await db.assignmentSubmission.upsert({
      where: { assignmentId_userId: { assignmentId, userId: learner.id } },
      update: { status: 'SUBMITTED', textAnswer: String(formData.get('textAnswer') || ''), linkUrl: String(formData.get('linkUrl') || '') || null, fileUrls, submittedAt: new Date(), version: { increment: 1 } },
      create: { assignmentId, userId: learner.id, status: 'SUBMITTED', textAnswer: String(formData.get('textAnswer') || ''), linkUrl: String(formData.get('linkUrl') || '') || null, fileUrls, submittedAt: new Date() },
    });
    revalidatePath('/assignments');
  }
  const assignments = await db.assignment.findMany({ where: { published: true }, include: { course: true, submissions: { where: { userId: user.id } } }, orderBy: { createdAt: 'desc' } });
  return <Shell user={user}><div className="page-title"><p className="eyebrow">PRACTICAL LEARNING</p><h1>Assignments</h1><p>Submit work, receive feedback, and build your creator portfolio.</p></div>
    <div className="stack">{assignments.map(item => { const submission=item.submissions[0]; return <article className="card" key={item.id}><div className="section-heading"><div><span className="badge active">{item.course.title}</span><h2>{item.title}</h2></div><span className="badge">{submission?.status || 'NOT STARTED'}</span></div><p>{item.instructions}</p>{submission?.feedback && <div className="feedback-box"><strong>Staff feedback</strong><p>{submission.feedback}</p></div>}<form action={submit} className="form-grid"><input type="hidden" name="assignmentId" value={item.id}/><label className="full">Written response<textarea name="textAnswer" rows={5} defaultValue={submission?.textAnswer || ''}/></label><label>Link<input name="linkUrl" type="url" defaultValue={submission?.linkUrl || ''}/></label><label>File<input name="file" type="file" /></label><button className="primary">{submission ? 'Resubmit assignment' : 'Submit assignment'}</button></form></article>})}{!assignments.length && <div className="empty-state"><h2>No assignments yet</h2><p>Published assignments will appear here.</p></div>}</div>
  </Shell>;
}
