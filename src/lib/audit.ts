import { Prisma } from '@prisma/client';
import { db } from './db';

export async function audit(
  userId: string | null,
  action: string,
  entity: string,
  entityId?: string,
  details?: Prisma.InputJsonObject,
) {
  await db.auditLog
    .create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ?? undefined,
      },
    })
    .catch(() => undefined);
}
