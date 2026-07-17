 'use client';
import { useState } from 'react';
import { BellRing, LoaderCircle, Send } from 'lucide-react';

type UserOption = { id: string; name: string; email: string };

export function AdminPushComposer({ users }: { users: UserOption[] }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/admin/push/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: form.get('title'),
          body: form.get('body'),
          url: form.get('url'),
          userId: form.get('userId') || undefined,
        }),
      });
      const data = (await response.json()) as { error?: string; sent?: number; removed?: number };
      if (!response.ok) throw new Error(data.error || 'Unable to send notification.');
      setMessage(`Sent to ${data.sent || 0} subscribed device(s). ${data.removed || 0} expired subscription(s) removed.`);
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send notification.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card form-grid" onSubmit={submit}>
      <div className="full push-composer-heading"><BellRing /><div><h2>Send a push notification</h2><p>Send to every subscribed device or choose one Academy user.</p></div></div>
      <label>Audience<select name="userId"><option value="">Everyone</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.email}</option>)}</select></label>
      <label>Open page<input name="url" defaultValue="/notifications" placeholder="/courses" /></label>
      <label className="full">Title<input name="title" maxLength={80} required placeholder="New Academy update" /></label>
      <label className="full">Message<textarea name="body" maxLength={240} rows={4} required placeholder="Write the notification message..." /></label>
      <button className="primary" disabled={busy}>{busy ? <LoaderCircle className="spin-icon" /> : <Send />} Send notification</button>
      {message && <p className="full push-settings-message">{message}</p>}
    </form>
  );
}
