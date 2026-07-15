import { requireActiveUser } from '@/lib/auth';
import { db } from '@/lib/db';

function escapePdf(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/[^\x20-\x7E]/g, '');
}

function makePdf(lines: { text: string; size: number; y: number }[]) {
  const stream = lines.map((line) => `BT /F1 ${line.size} Tf 1 0 0 1 72 ${line.y} Tm (${escapePdf(line.text)}) Tj ET`).join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}

export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const user = await requireActiveUser();
  const { code } = await params;
  const certificate = await db.certificate.findUnique({ where: { code }, include: { user: true, course: true } });
  if (!certificate || (certificate.userId !== user.id && user.role !== 'ADMIN')) return new Response('Not found', { status: 404 });
  const pdf = makePdf([
    { text: 'WE ARE ELIXIR ACADEMY', size: 18, y: 520 },
    { text: 'CERTIFICATE OF COMPLETION', size: 30, y: 450 },
    { text: 'This certifies that', size: 15, y: 385 },
    { text: certificate.user.name, size: 28, y: 335 },
    { text: 'has successfully completed', size: 15, y: 285 },
    { text: certificate.course.title, size: 24, y: 235 },
    { text: `Issued: ${certificate.issuedAt.toLocaleDateString('en-GB')}`, size: 13, y: 155 },
    { text: `Certificate: ${certificate.code}`, size: 13, y: 125 },
    { text: 'Learn. Grow. Create.', size: 14, y: 70 },
  ]);
  return new Response(pdf, { headers: { 'content-type': 'application/pdf', 'content-disposition': `attachment; filename="${certificate.code}.pdf"` } });
}
