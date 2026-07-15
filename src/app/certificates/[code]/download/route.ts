import { readFile } from 'fs/promises';
import path from 'path';
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib';
import { requireActiveUser } from '@/lib/auth';
import { db } from '@/lib/db';

function formatDate(value: Date) {
  return value.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function fittedSize(text: string, font: PDFFont, preferred: number, maxWidth: number, minimum = 8) {
  let size = preferred;
  while (size > minimum && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.5;
  return size;
}

function drawCentred(page: PDFPage, text: string, font: PDFFont, size: number, y: number, colour = rgb(0.05, 0.05, 0.08)) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (page.getWidth() - width) / 2, y, size, font, color: colour });
}

export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const user = await requireActiveUser();
  const { code } = await params;

  const certificate = await db.certificate.findUnique({
    where: { code },
    include: { user: true, course: true },
  });

  if (!certificate || (certificate.userId !== user.id && user.role !== 'ADMIN')) {
    return new Response('Not found', { status: 404 });
  }

  const templatePath = path.join(process.cwd(), 'public', 'certificates', 'elixir-academy-certificate.png');
  const templateBytes = await readFile(templatePath);

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]);
  const background = await pdf.embedPng(templateBytes);
  page.drawImage(background, { x: 0, y: 0, width: 842, height: 595 });

  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const italic = await pdf.embedFont(StandardFonts.TimesRomanItalic);

  const learnerName = certificate.user.name.trim();
  const courseTitle = certificate.course.title.trim();
  const issuedDate = formatDate(certificate.issuedAt);
  const appUrl = (process.env.APP_URL || 'https://academy.weareelixir.co.uk').replace(/\/$/, '');
  const verificationUrl = `${appUrl}/verify/${certificate.code}`;

  drawCentred(page, learnerName, italic, fittedSize(learnerName, italic, 34, 505, 17), 321, rgb(0.25, 0.18, 0.76));
  drawCentred(page, courseTitle, bold, fittedSize(courseTitle, bold, 20, 500, 11), 246, rgb(0.14, 0.24, 0.67));

  const dateSize = fittedSize(issuedDate, bold, 10, 130, 7);
  page.drawText(issuedDate, {
    x: 170 - bold.widthOfTextAtSize(issuedDate, dateSize) / 2,
    y: 106,
    size: dateSize,
    font: bold,
    color: rgb(0.07, 0.07, 0.1),
  });

  const signatureText = 'Ryan Evans';
  const signatureSize = fittedSize(signatureText, italic, 20, 150, 12);
  page.drawText(signatureText, {
    x: 526 - italic.widthOfTextAtSize(signatureText, signatureSize) / 2,
    y: 109,
    size: signatureSize,
    font: italic,
    color: rgb(0.05, 0.05, 0.08),
  });
  page.drawText('WE ARE ELIXIR', {
    x: 526 - bold.widthOfTextAtSize('WE ARE ELIXIR', 7.5) / 2,
    y: 92,
    size: 7.5,
    font: bold,
    color: rgb(0.25, 0.18, 0.65),
  });

  const codeText = `CERTIFICATE NO. ${certificate.code}`;
  drawCentred(page, codeText, bold, fittedSize(codeText, bold, 7.4, 300, 5.5), 29, rgb(0.08, 0.08, 0.12));

  const verifyText = `VERIFY: ${verificationUrl}`;
  drawCentred(page, verifyText, regular, fittedSize(verifyText, regular, 6.2, 620, 4.8), 17, rgb(0.18, 0.22, 0.66));

  const bytes = await pdf.save();

  return new Response(Buffer.from(bytes), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${certificate.code}.pdf"`,
      'cache-control': 'private, no-store',
    },
  });
}
