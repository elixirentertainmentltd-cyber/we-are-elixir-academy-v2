import Link from 'next/link';
import { Download, ShieldCheck } from 'lucide-react';
import { notFound } from 'next/navigation';
import { requireActiveUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Shell } from '@/components/shell';
import { CertificateView } from '@/components/certificate-view';
import { getCertificateDesign } from '@/lib/certificate-design';

function certificateDate(value: Date) {
  return value.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default async function CertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const user = await requireActiveUser();
  const { code } = await params;
  const certificate = await db.certificate.findUnique({ where: { code }, include: { user: true, course: true } });
  if (!certificate || (certificate.userId !== user.id && user.role !== 'ADMIN')) notFound();

  const design = await getCertificateDesign();
  const appUrl = (process.env.APP_URL || 'https://academy.weareelixir.co.uk').replace(/\/$/, '');
  const verificationUrl = `${appUrl}/verify/${certificate.code}`;

  return <Shell user={user}>
    <div className="certificate-actions" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
      <Link className="ghost" href="/certificates">Back to certificates</Link>
      <div style={{ display: 'flex', gap: 10 }}>
        <Link className="ghost" href={`/verify/${certificate.code}`}><ShieldCheck /> Verify</Link>
        <Link className="primary" href={`/certificates/${certificate.code}/download`}><Download /> Download PDF</Link>
      </div>
    </div>
    <section style={{ width: 'min(1100px, 100%)', margin: '0 auto', borderRadius: 18, overflow: 'hidden', boxShadow: '0 22px 60px rgba(16,45,87,.16)' }}>
      <CertificateView
        design={design}
        data={{
          learnerName: certificate.user.name,
          courseTitle: certificate.course.title,
          date: certificateDate(certificate.issuedAt),
          signature: 'Ryan Evans',
          certificateNumber: `CERTIFICATE NO. ${certificate.code}`,
          verificationUrl,
        }}
      />
    </section>
  </Shell>;
}
