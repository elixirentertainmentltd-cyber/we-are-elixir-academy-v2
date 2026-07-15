import { readFile } from 'fs/promises';
import path from 'path';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { requireActiveUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getCertificateDesign, type CertificateField } from '@/lib/certificate-design';

function formatDate(value: Date) {
  return value.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

function bytesFromDataUrl(value: string) {
  const [, base64 = ''] = value.split(',', 2);
  return Buffer.from(base64, 'base64');
}

function hexColour(value: string) {
  const cleaned = value.replace('#', '');
  const number = Number.parseInt(cleaned, 16);
  return rgb(((number >> 16) & 255) / 255, ((number >> 8) & 255) / 255, (number & 255) / 255);
}

function fontFor(field: CertificateField, fonts: { sans: PDFFont; serif: PDFFont; script: PDFFont }) {
  return field.font === 'serif' ? fonts.serif : field.font === 'script' ? fonts.script : fonts.sans;
}

function fittedSize(text: string, font: PDFFont, preferred: number, maxWidth: number, minimum = 5) {
  let size = preferred;
  while (size > minimum && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.5;
  return size;
}

function drawField(page: PDFPage, field: CertificateField, text: string, font: PDFFont) {
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const maxWidth = (field.width / 100) * pageWidth;
  const size = fittedSize(text, font, field.fontSize * 0.72, maxWidth);
  const textWidth = font.widthOfTextAtSize(text, size);
  let x = (field.x / 100) * pageWidth;
  if (field.align === 'center') x -= textWidth / 2;
  if (field.align === 'right') x -= textWidth;
  const y = pageHeight - (field.y / 100) * pageHeight - size / 3;
  page.drawText(text, { x, y, size, font, color: hexColour(field.colour), maxWidth });
}

export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const user = await requireActiveUser();
  const { code } = await params;
  const certificate = await db.certificate.findUnique({ where: { code }, include: { user: true, course: true } });
  if (!certificate || (certificate.userId !== user.id && user.role !== 'ADMIN')) return new Response('Not found', { status: 404 });

  const design = await getCertificateDesign();
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]);

  const backgroundBytes = design.backgroundData
    ? bytesFromDataUrl(design.backgroundData)
    : await readFile(path.join(process.cwd(), 'public', 'certificates', 'elixir-academy-certificate.png'));
  const background = design.backgroundData?.startsWith('data:image/jpeg')
    ? await pdf.embedJpg(backgroundBytes)
    : await pdf.embedPng(backgroundBytes);
  page.drawImage(background, { x: 0, y: 0, width: 842, height: 595 });

  const fonts = {
    sans: await pdf.embedFont(StandardFonts.HelveticaBold),
    serif: await pdf.embedFont(StandardFonts.TimesRoman),
    script: await pdf.embedFont(StandardFonts.TimesRomanItalic),
  };

  const appUrl = (process.env.APP_URL || 'https://academy.weareelixir.co.uk').replace(/\/$/, '');
  const verificationUrl = `${appUrl}/verify/${certificate.code}`;
  drawField(page, design.layout.learnerName, certificate.user.name.trim(), fontFor(design.layout.learnerName, fonts));
  drawField(page, design.layout.courseTitle, certificate.course.title.trim(), fontFor(design.layout.courseTitle, fonts));
  drawField(page, design.layout.date, formatDate(certificate.issuedAt), fontFor(design.layout.date, fonts));
  drawField(page, design.layout.certificateNumber, `CERTIFICATE NO. ${certificate.code}`, fontFor(design.layout.certificateNumber, fonts));
  drawField(page, design.layout.verificationUrl, verificationUrl, fontFor(design.layout.verificationUrl, fonts));

  if (design.signatureData) {
    const signatureBytes = bytesFromDataUrl(design.signatureData);
    const signatureImage = design.signatureData.startsWith('data:image/jpeg') ? await pdf.embedJpg(signatureBytes) : await pdf.embedPng(signatureBytes);
    const field = design.layout.signature;
    const width = (field.width / 100) * page.getWidth();
    const ratio = signatureImage.height / signatureImage.width;
    const height = Math.min(width * ratio, 70);
    page.drawImage(signatureImage, {
      x: (field.x / 100) * page.getWidth() - width / 2,
      y: page.getHeight() - (field.y / 100) * page.getHeight() - height / 2,
      width,
      height,
    });
  } else {
    drawField(page, design.layout.signature, 'Ryan Evans', fontFor(design.layout.signature, fonts));
  }

  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${certificate.code}.pdf"`,
      'cache-control': 'private, no-store',
    },
  });
}
