import Link from 'next/link';
import { Award, Download, ShieldCheck } from 'lucide-react';
import { requireActiveUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Shell } from '@/components/shell';

export default async function CertificatesPage() {
  const user = await requireActiveUser();
  const certificates = await db.certificate.findMany({
    where: { userId: user.id },
    include: { course: true },
    orderBy: { issuedAt: 'desc' },
  });

  return <Shell user={user}><div className="page-title"><p className="eyebrow">ACHIEVEMENTS</p><h1>My certificates</h1><p>Your completed courses and verified Academy achievements.</p></div>
    {certificates.length ? <div className="course-grid">{certificates.map((certificate) => <article className="course-card" key={certificate.id}><div className="course-art"><Award /><span>Verified</span></div><div className="course-body"><h2>{certificate.course.title}</h2><p>Issued {certificate.issuedAt.toLocaleDateString('en-GB')}</p><p><strong>{certificate.code}</strong></p><div className="builder-header-actions"><Link className="ghost" href={`/certificates/${certificate.code}`}><ShieldCheck /> View</Link><Link className="primary" href={`/certificates/${certificate.code}/download`}><Download /> PDF</Link></div></div></article>)}</div> : <div className="empty-state"><Award /><h2>No certificates yet</h2><p>Complete a certificate-enabled course and your certificate will appear here automatically.</p><Link className="primary inline" href="/courses">Browse courses</Link></div>}
  </Shell>;
}
