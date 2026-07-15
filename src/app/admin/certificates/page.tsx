import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { Shell } from '@/components/shell';

export default async function AdminCertificatesPage() {
  const admin = await requireAdmin();
  const certificates = await db.certificate.findMany({ include: { user: true, course: true }, orderBy: { issuedAt: 'desc' } });
  return <Shell user={admin}><div className="page-title"><p className="eyebrow">ADMIN</p><h1>Certificate records</h1><p>Every certificate is unique and can be publicly verified.</p></div><div className="table-wrap"><table><thead><tr><th>Learner</th><th>Course</th><th>Issued</th><th>Certificate</th></tr></thead><tbody>{certificates.map((certificate) => <tr key={certificate.id}><td>{certificate.user.name}<br/><small>{certificate.user.email}</small></td><td>{certificate.course.title}</td><td>{certificate.issuedAt.toLocaleDateString('en-GB')}</td><td><Link href={`/certificates/${certificate.code}`}>{certificate.code}</Link></td></tr>)}</tbody></table></div></Shell>;
}
