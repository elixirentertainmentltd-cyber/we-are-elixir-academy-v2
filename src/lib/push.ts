import webPush from 'web-push';
import { db } from '@/lib/db';

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
};

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:info@weareelixir.co.uk';

  if (!publicKey || !privateKey) {
    throw new Error('Push notification VAPID keys are not configured.');
  }

  webPush.setVapidDetails(subject, publicKey, privateKey);
}

async function sendToSubscriptions(
  subscriptions: Array<{ id: string; endpoint: string; p256dh: string; auth: string }>,
  payload: PushPayload,
) {
  if (!subscriptions.length) return { sent: 0, removed: 0 };
  configureWebPush();

  let sent = 0;
  let removed = 0;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify({
            ...payload,
            icon: payload.icon || '/icons/icon-192.png',
            badge: payload.badge || '/icons/badge-96.png',
          }),
        );
        sent += 1;
      } catch (error) {
        const statusCode =
          typeof error === 'object' && error && 'statusCode' in error
            ? Number((error as { statusCode?: number }).statusCode)
            : 0;

        if (statusCode === 404 || statusCode === 410) {
          await db.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => undefined);
          removed += 1;
          return;
        }

        console.error('Push notification failed:', error);
      }
    }),
  );

  return { sent, removed };
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  return sendToSubscriptions(subscriptions, payload);
}

export async function sendPushToAll(payload: PushPayload) {
  const subscriptions = await db.pushSubscription.findMany({
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  return sendToSubscriptions(subscriptions, payload);
}
