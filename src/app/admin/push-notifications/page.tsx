import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { Shell } from '@/components/shell';
import { AdminPushComposer } from '@/components/admin-push-composer';

export const dynamic = 'force-dynamic';

export default async function AdminPushNotificationsPage() {
  const admin = await requireAdmin();
  const [users, subscriptions] = await Promise.all([
    db.user.findMany({ where: { status: 'ACTIVE' }, select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } }),
    db.pushSubscription.count(),
  ]);

  return (
    <Shell user={admin}>
      <div className="page-title"><p className="eyebrow">ADMIN</p><h1>Push notifications</h1><p>{subscriptions} subscribed device{subscriptions === 1 ? '' : 's'} currently connected.</p></div>
      <AdminPushComposer users={users} />
    </Shell>
  );
}
