self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = { body: event.data ? event.data.text() : '' }; }
  const title = payload.title || 'We Are Elixir Academy';
  event.waitUntil(self.registration.showNotification(title, {
    body: payload.body || 'You have a new Academy update.',
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/badge-96.png',
    data: { url: payload.url || '/notifications' },
    tag: payload.tag || undefined,
    renotify: Boolean(payload.tag),
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/notifications', self.location.origin).href;
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    for (const windowClient of windows) {
      if (windowClient.url === target && 'focus' in windowClient) return windowClient.focus();
    }
    return clients.openWindow ? clients.openWindow(target) : undefined;
  }));
});
