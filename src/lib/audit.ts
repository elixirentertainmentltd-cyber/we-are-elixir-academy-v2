import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

export async function audit(
  userId: string | null,
  action: string,
  entity: string,
  entityId?: string,
  details?: Prisma.InputJsonValue,
) {
  try {
    await db.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId ?? null,
        details,
      },
    });
  } catch (error) {
    console.error('Unable to create audit log:', error);
  }
}
