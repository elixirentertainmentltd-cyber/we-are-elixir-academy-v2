import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { Shell } from '@/components/shell';

export default async function QuizResultsPage() {
  const admin = await requireAdmin();
  const attempts = await db.quizAttempt.findMany({ include: { user: true, quiz: { include: { lesson: { include: { module: { include: { course: true } } } } } } }, orderBy: { submittedAt: 'desc' }, take: 250 });
  return <Shell user={admin}><div className="page-title"><p className="eyebrow">QUIZ REPORTING</p><h1>Learner quiz results</h1></div><div className="card table-wrap"><table><thead><tr><th>Learner</th><th>Course</th><th>Quiz</th><th>Score</th><th>Result</th><th>Date</th></tr></thead><tbody>{attempts.map((attempt) => <tr key={attempt.id}><td>{attempt.user.name}<br /><small>{attempt.user.email}</small></td><td>{attempt.quiz.lesson.module.course.title}</td><td>{attempt.quiz.title}</td><td>{attempt.score}%</td><td>{attempt.passed ? 'Passed' : 'Failed'}</td><td>{attempt.submittedAt.toLocaleDateString('en-GB')}</td></tr>)}</tbody></table></div></Shell>;
}
