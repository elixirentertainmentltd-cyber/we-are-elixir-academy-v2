import { currentUser } from '@/lib/auth';
import { sendPushToUser } from '@/lib/push';

export async function POST() {
  const user = await currentUser();
  if (!user || user.status !== 'ACTIVE') return Response.json({ error: 'Authentication required.' }, { status: 401 });

  try {
    const result = await sendPushToUser(user.id, {
      title: 'We Are Elixir Academy',
      body: 'Push notifications are working on this device.',
      url: '/notifications',
    });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to send notification.' }, { status: 500 });
  }
}
