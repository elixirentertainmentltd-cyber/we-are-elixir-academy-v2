import Link from 'next/link';
import { Download, ExternalLink, Share2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { requireActiveUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Shell } from '@/components/shell';
import styles from './certificate.module.css';

function certificateDate(value: Date) {
  return value.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
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
      <div className={styles.viewer}>
        <div className={styles.actions}>
          <Link className="ghost" href="/certificates">
            Back to certificates
          </Link>

          <div className={styles.actionGroup}>
            <Link className="ghost" href={verificationUrl} target="_blank">
              <ExternalLink /> Verify
            </Link>
            <a className="ghost" href={verificationUrl} target="_blank" rel="noreferrer">
              <Share2 /> Share
            </a>
            <Link className="primary" href={`/certificates/${certificate.code}/download`}>
              <Download /> Download PDF
            </Link>
          </div>
        </div>

        <div className={styles.frame}>
          <section className={styles.certificate} aria-label="Certificate of achievement">
            <img
              className={styles.template}
              src="/certificates/elixir-academy-certificate.png"
              alt="We Are Elixir Academy certificate template"
            />

            <div className={styles.name}>{certificate.user.name}</div>
            <div className={styles.course}>{certificate.course.title}</div>
            <div className={styles.date}>{certificateDate(certificate.issuedAt)}</div>

            <div className={styles.signature}>
              <strong>Ryan Evans</strong>
              <span>WE ARE ELIXIR</span>
            </div>

            <div className={styles.code}>CERTIFICATE NO. {certificate.code}</div>
            <div className={styles.verify}>VERIFY: {verificationUrl}</div>
          </section>
        </div>
      </div>
    </Shell>
  );
}
