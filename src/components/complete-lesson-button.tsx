'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CompleteLessonButton({ lessonId, completed }: { lessonId: string; completed: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function complete() {
    if (completed || loading) return;
    setLoading(true);
    setError('');
    const response = await fetch(`/api/progress/${lessonId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(data.error || 'Unable to save progress.');
      return;
    }
    router.refresh();
  }

  return <div className="complete-action">
    <button className={completed ? 'ghost complete-button' : 'primary complete-button'} disabled={loading || completed} onClick={complete}>
      {loading ? 'Saving…' : completed ? '✓ Lesson completed' : 'Mark lesson complete'}
    </button>
    {error && <p className="error">{error}</p>}
  </div>;
}
