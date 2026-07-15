import Link from 'next/link';
import { Download } from 'lucide-react';
import { notFound } from 'next/navigation';
import { requireActiveUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Shell } from '@/components/shell';

function certificateDate(value: Date) {
  return value.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).toUpperCase();
}

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const user = await requireActiveUser();
  const { code } = await params;

  const certificate = await db.certificate.findUnique({
    where: { code },
    include: { user: true, course: true },
  });

  if (!certificate || (certificate.userId !== user.id && user.role !== 'ADMIN')) {
    notFound();
  }

  const appUrl = (process.env.APP_URL || 'https://academy.weareelixir.co.uk').replace(/\/$/, '');
  const verificationUrl = `${appUrl}/verify/${certificate.code}`;

  return (
    <Shell user={user}>
      <div className="certificate-actions">
        <Link className="ghost" href="/certificates">
          Back to certificates
        </Link>
        <Link className="primary" href={`/certificates/${certificate.code}/download`}>
          <Download /> Download PDF
        </Link>
      </div>

      <section className="official-certificate-wrap" aria-label="Certificate of achievement">
        <div className="official-certificate">
          <img
            className="official-certificate-template"
            src="/certificates/elixir-academy-certificate.png"
            alt="We Are Elixir Academy certificate template"
          />

          <div className="official-certificate-name">{certificate.user.name}</div>
          <div className="official-certificate-course">{certificate.course.title}</div>
          <div className="official-certificate-date">{certificateDate(certificate.issuedAt)}</div>

          <div className="official-certificate-signature">
            <strong>Ryan Evans</strong>
            <span>WE ARE ELIXIR</span>
          </div>

          <div className="official-certificate-code">
            CERTIFICATE NO. {certificate.code}
          </div>
          <div className="official-certificate-verify">VERIFY: {verificationUrl}</div>
        </div>
      </section>
    </Shell>
  );
}
