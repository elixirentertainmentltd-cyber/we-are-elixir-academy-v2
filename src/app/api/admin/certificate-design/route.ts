import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import {
  defaultCertificateLayout,
  getCertificateDesign,
  saveCertificateDesign,
} from '@/lib/certificate-design';

const fieldSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  fontSize: z.number().min(6).max(100),
  colour: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  font: z.enum(['serif', 'sans', 'script']),
  width: z.number().min(5).max(100),
  align: z.enum(['left', 'center', 'right']),
});

const layoutSchema = z.object({
  learnerName: fieldSchema,
  courseTitle: fieldSchema,
  date: fieldSchema,
  signature: fieldSchema,
  certificateNumber: fieldSchema,
  verificationUrl: fieldSchema,
});

const dataImage = z.string().max(12_000_000).refine(
  (value) => value.startsWith('data:image/png;base64,') || value.startsWith('data:image/jpeg;base64,') || value.startsWith('data:image/webp;base64,'),
  'Only PNG, JPG, and WebP images are supported.',
);

const bodySchema = z.object({
  backgroundData: dataImage.nullable(),
  signatureData: dataImage.nullable(),
  layout: layoutSchema,
});

export async function GET() {
  await requireAdmin();
  return NextResponse.json({ design: await getCertificateDesign(), defaults: defaultCertificateLayout });
}

export async function PUT(request: Request) {
  await requireAdmin();
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid certificate design.' }, { status: 400 });
  }
  return NextResponse.json({ design: await saveCertificateDesign(parsed.data) });
}
