import Link from 'next/link';
import { Download, Printer, ShieldCheck } from 'lucide-react';
import { notFound } from 'next/navigation';
import { requireActiveUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Shell } from '@/components/shell';

export default async function CertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const user = await requireActiveUser();
  const { code } = await params;
  const certificate = await db.certificate.findUnique({ where: { code }, include: { user: true, course: true } });
  if (!certificate || (certificate.userId !== user.id && user.role !== 'ADMIN')) notFound();

  return <Shell user={user}><div className="certificate-actions"><Link className="ghost" href="/certificates">Back to certificates</Link><Link className="primary" href={`/certificates/${code}/download`}><Download /> Download PDF</Link></div><section className="certificate-sheet"><div className="certificate-border"><p className="eyebrow">WE ARE ELIXIR ACADEMY</p><h1>Certificate of Completion</h1><p>This certifies that</p><h2>{certificate.user.name}</h2><p>has successfully completed</p><h3>{certificate.course.title}</h3><div className="certificate-meta"><span><strong>Issued</strong>{certificate.issuedAt.toLocaleDateString('en-GB')}</span><span><strong>Certificate</strong>{certificate.code}</span></div><div className="certificate-seal"><ShieldCheck /><span>Verified achievement</span></div><p className="certificate-signature">We Are Elixir Academy</p></div></section><p className="centre">Verification: {process.env.APP_URL || ''}/verify/{certificate.code}</p></Shell>;
}
