 'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, LoaderCircle, Send } from 'lucide-react';

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

export function PushNotificationSettings({ publicKey }: { publicKey: string }) {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function inspect() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !publicKey) {
        setSupported(false);
        setBusy(false);
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      const subscription = await registration.pushManager.getSubscription();
      setEnabled(Boolean(subscription));
      setBusy(false);
    }

    inspect().catch(() => {
      setSupported(false);
      setBusy(false);
    });
  }, [publicKey]);

  async function enable() {
    setBusy(true);
    setMessage('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Notification permission was not granted.');

      const registration = await navigator.serviceWorker.register('/sw.js');
      const subscription =
        (await registration.pushManager.getSubscription()) ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) throw new Error('Unable to save this device.');

      setEnabled(true);
      setMessage('Push notifications are enabled on this device.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to enable notifications.');
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMessage('');
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setEnabled(false);
      setMessage('Push notifications are disabled on this device.');
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/push/test', { method: 'POST' });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Unable to send test notification.');
      setMessage('Test notification sent.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send test notification.');
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return <p className="muted-note">Push notifications are unavailable in this browser or the VAPID key is not configured.</p>;
  }

  return (
    <div className="push-settings-card">
      <div>
        <strong>{enabled ? 'Push notifications enabled' : 'Push notifications disabled'}</strong>
        <p>Receive Academy updates on this device, even when the website is closed.</p>
      </div>
      <div className="push-settings-actions">
        <button className={enabled ? 'ghost' : 'primary'} type="button" onClick={enabled ? disable : enable} disabled={busy}>
          {busy ? <LoaderCircle className="spin-icon" /> : enabled ? <BellOff /> : <Bell />}
          {enabled ? 'Disable' : 'Enable'}
        </button>
        {enabled && (
          <button className="ghost" type="button" onClick={test} disabled={busy}>
            <Send /> Send test
          </button>
        )}
      </div>
      {message && <p className="push-settings-message">{message}</p>}
    </div>
  );
}
