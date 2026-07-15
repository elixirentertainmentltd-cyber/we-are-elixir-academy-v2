import { ShieldCheck, ShieldX } from 'lucide-react';
import { db } from '@/lib/db';

export default async function VerifyCertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const certificate = await db.certificate.findUnique({ where: { code }, include: { user: true, course: true } });
  return <main className="auth-page"><section className="auth-card centre">{certificate ? <><div className="status-icon"><ShieldCheck /></div><p className="eyebrow">VERIFIED CERTIFICATE</p><h1>Achievement confirmed</h1><p><strong>{certificate.user.name}</strong> completed <strong>{certificate.course.title}</strong> on {certificate.issuedAt.toLocaleDateString('en-GB')}.</p><p>Certificate number</p><h2>{certificate.code}</h2></> : <><div className="status-icon"><ShieldX /></div><p className="eyebrow">NOT FOUND</p><h1>Certificate not verified</h1><p>We could not find a certificate matching this number.</p></>}</section></main>;
}
