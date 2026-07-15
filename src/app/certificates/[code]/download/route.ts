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
  return value
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    .toUpperCase();
}

function fittedSize(
  text: string,
  font: PDFFont,
  preferred: number,
  maxWidth: number,
  minimum = 8,
) {
  let size = preferred;

  while (
    size > minimum &&
    font.widthOfTextAtSize(text, size) > maxWidth
  ) {
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
  page: PDFPage;
  text: string;
  font: PDFFont;
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
    include: {
      user: true,
      course: true,
    },
  });

  if (
    !certificate ||
    (certificate.userId !== user.id && user.role !== 'ADMIN')
  ) {
    return new Response('Not found', {
      status: 404,
    });
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

  page.drawImage(background, {
    x: 0,
    y: 0,
    width: 842,
    height: 595,
  });

  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const signature = await pdf.embedFont(
    StandardFonts.TimesRomanItalic,
  );

  const learnerName = certificate.user.name.trim();
  const courseTitle = certificate.course.title.trim().toUpperCase();
  const issuedDate = formatDate(certificate.issuedAt);

  const appUrl = (
    process.env.APP_URL ||
    'https://academy.weareelixir.co.uk'
  ).replace(/\/$/, '');

  const verificationUrl = `${appUrl}/verify/${certificate.code}`;

  const nameSize = fittedSize(
    learnerName,
    signature,
    32,
    500,
    18,
  );

  drawCentredText({
    page,
    text: learnerName,
    font: signature,
    size: nameSize,
    y: 276,
    colour: rgb(0.2, 0.19, 0.72),
  });

  const courseSize = fittedSize(
    courseTitle,
    bold,
    18,
    500,
    11,
  );

  drawCentredText({
    page,
    text: courseTitle,
    font: bold,
    size: courseSize,
    y: 190,
    colour: rgb(0.13, 0.2, 0.7),
  });

  page.drawText(issuedDate, {
    x: 170 - bold.widthOfTextAtSize(issuedDate, 9.5) / 2,
    y: 91,
    size: 9.5,
    font: bold,
    color: rgb(0.07, 0.07, 0.1),
  });

  const signatureText = 'Ryan Evans';

  page.drawText(signatureText, {
    x:
      589 -
      signature.widthOfTextAtSize(signatureText, 18) / 2,
    y: 93,
    size: 18,
    font: signature,
    color: rgb(0.05, 0.05, 0.08),
  });

  page.drawText('WE ARE ELIXIR', {
    x:
      589 -
      bold.widthOfTextAtSize('WE ARE ELIXIR', 7) / 2,
    y: 79,
    size: 7,
    font: bold,
    color: rgb(0.25, 0.2, 0.65),
  });

  const codeText = `CERTIFICATE NO. ${certificate.code}`;

  drawCentredText({
    page,
    text: codeText,
    font: bold,
    size: fittedSize(codeText, bold, 7, 350, 5.5),
    y: 36,
    colour: rgb(0.1, 0.1, 0.14),
  });

  const verifyText = `VERIFY: ${verificationUrl}`;

  drawCentredText({
    page,
    text: verifyText,
    font: regular,
    size: fittedSize(verifyText, regular, 6, 690, 4.5),
    y: 24,
    colour: rgb(0.2, 0.25, 0.65),
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
