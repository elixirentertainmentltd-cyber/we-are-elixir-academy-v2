import { db } from './db';

export async function audit(userId: string | null, action: string, entity: string, entityId?: string, details?: Record<string, unknown>) {
  await db.auditLog.create({ data: { userId, action, entity, entityId, details: details ?? undefined } }).catch(() => undefined);
}
