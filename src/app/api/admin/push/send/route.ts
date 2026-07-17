import { z } from 'zod';
import { requireAdminApi, apiErrorResponse } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { sendPushToAll, sendPushToUser } from '@/lib/push';
import { audit } from '@/lib/audit';

const schema = z.object({
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(240),
  url: z.string().max(500).optional(),
  userId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const admin = await requireAdminApi();
    const input = schema.parse(await request.json());
    const payload = { title: input.title, body: input.body, url: input.url || '/notifications' };

    const result = input.userId
      ? await sendPushToUser(input.userId, payload)
      : await sendPushToAll(payload);

    if (input.userId) {
      await db.notification.create({ data: { userId: input.userId, title: input.title, message: input.body, href: payload.url } });
    } else {
      const users = await db.user.findMany({ where: { status: 'ACTIVE' }, select: { id: true } });
      if (users.length) {
        await db.notification.createMany({ data: users.map((user) => ({ userId: user.id, title: input.title, message: input.body, href: payload.url })) });
      }
    }

    await audit(admin.id, 'SEND_PUSH', 'Notification', input.userId, { title: input.title, audience: input.userId ? 'user' : 'all' });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
