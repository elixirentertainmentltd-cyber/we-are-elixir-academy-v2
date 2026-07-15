import { readFile } from 'fs/promises';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { requireActiveUser } from '@/lib/auth';
import { db } from '@/lib/db';

function formatDate(value: Date) {
  return value.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).toUpperCase();
}

function fittedSize(
  text: string,
  font: { widthOfTextAtSize(value: string, size: number): number },
  preferredSize: number,
  maxWidth: number,
  minimumSize = 10,
) {
  let size = preferredSize;
  while (size > minimumSize && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 0.5;
  }
  return size;
}

function drawCentredText({
  page,
  text,
  font,
  size,
  y,
  colour = rgb(0.05, 0.05, 0.08),
}: {
  page: import('pdf-lib').PDFPage;
  text: string;
  font: import('pdf-lib').PDFFont;
  size: number;
  y: number;
  colour?: ReturnType<typeof rgb>;
}) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: (page.getWidth() - width) / 2,
    y,
    size,
    font,
    color: colour,
  });
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const user = await requireActiveUser();
  const { code } = await params;

  const certificate = await db.certificate.findUnique({
    where: { code },
    include: { user: true, course: true },
  });

  if (!certificate || (certificate.userId !== user.id && user.role !== 'ADMIN')) {
    return new Response('Not found', { status: 404 });
  }

  const templatePath = path.join(
    process.cwd(),
    'public',
    'certificates',
    'elixir-academy-certificate.png',
  );
  const templateBytes = await readFile(templatePath);

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]);
  const background = await pdf.embedPng(templateBytes);
  page.drawImage(background, { x: 0, y: 0, width: 842, height: 595 });

  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const signature = await pdf.embedFont(StandardFonts.TimesItalic);

  const learnerName = certificate.user.name.trim();
  const courseTitle = certificate.course.title.trim().toUpperCase();
  const issuedDate = formatDate(certificate.issuedAt);
  const appUrl = (process.env.APP_URL || 'https://academy.weareelixir.co.uk').replace(/\/$/, '');
  const verificationUrl = `${appUrl}/verify/${certificate.code}`;

  const nameSize = fittedSize(learnerName, signature, 34, 510, 18);
  drawCentredText({
    page,
    text: learnerName,
    font: signature,
    size: nameSize,
    y: 275,
    colour: rgb(0.20, 0.21, 0.68),
  });

  const courseSize = fittedSize(courseTitle, bold, 20, 500, 12);
  drawCentredText({
    page,
    text: courseTitle,
    font: bold,
    size: courseSize,
    y: 188,
    colour: rgb(0.18, 0.25, 0.72),
  });

  page.drawText(issuedDate, {
    x: 170 - bold.widthOfTextAtSize(issuedDate, 10) / 2,
    y: 94,
    size: 10,
    font: bold,
    color: rgb(0.07, 0.07, 0.10),
  });

  const signatureText = 'Ryan Evans';
  page.drawText(signatureText, {
    x: 589 - signature.widthOfTextAtSize(signatureText, 20) / 2,
    y: 91,
    size: 20,
    font: signature,
    color: rgb(0.05, 0.05, 0.08),
  });
  page.drawText('WE ARE ELIXIR', {
    x: 589 - bold.widthOfTextAtSize('WE ARE ELIXIR', 7.5) / 2,
    y: 79,
    size: 7.5,
    font: bold,
    color: rgb(0.25, 0.20, 0.65),
  });

  const codeText = `CERTIFICATE NO. ${certificate.code}`;
  drawCentredText({
    page,
    text: codeText,
    font: bold,
    size: fittedSize(codeText, bold, 7.5, 350, 6),
    y: 37,
    colour: rgb(0.10, 0.10, 0.14),
  });

  const verifyText = `VERIFY: ${verificationUrl}`;
  drawCentredText({
    page,
    text: verifyText,
    font: regular,
    size: fittedSize(verifyText, regular, 6.5, 690, 5),
    y: 25,
    colour: rgb(0.20, 0.25, 0.65),
  });

  const bytes = await pdf.save();

  return new Response(Buffer.from(bytes), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${certificate.code}.pdf"`,
      'cache-control': 'private, no-store',
    },
  });
}
