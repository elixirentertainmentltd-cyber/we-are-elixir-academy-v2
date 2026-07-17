import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || user.status !== 'ACTIVE') return Response.json({ error: 'Authentication required.' }, { status: 401 });

  const input = subscriptionSchema.safeParse(await request.json());
  if (!input.success) return Response.json({ error: 'Invalid push subscription.' }, { status: 400 });

  await db.pushSubscription.upsert({
    where: { endpoint: input.data.endpoint },
    update: {
      userId: user.id,
      p256dh: input.data.keys.p256dh,
      auth: input.data.keys.auth,
      userAgent: request.headers.get('user-agent'),
    },
    create: {
      userId: user.id,
      endpoint: input.data.endpoint,
      p256dh: input.data.keys.p256dh,
      auth: input.data.keys.auth,
      userAgent: request.headers.get('user-agent'),
    },
  });

  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user || user.status !== 'ACTIVE') return Response.json({ error: 'Authentication required.' }, { status: 401 });

  const body = (await request.json()) as { endpoint?: string };
  if (!body.endpoint) return Response.json({ error: 'Endpoint required.' }, { status: 400 });

  await db.pushSubscription.deleteMany({ where: { endpoint: body.endpoint, userId: user.id } });
  return Response.json({ ok: true });
}
