import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
const db = new PrismaClient();
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) { console.log('ADMIN_EMAIL/ADMIN_PASSWORD not set; admin seed skipped.'); return; }
  if (password.length < 12) throw new Error('ADMIN_PASSWORD must contain at least 12 characters.');
  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.upsert({ where: { email }, update: { role: Role.ADMIN, status: UserStatus.ACTIVE, passwordHash }, create: { name: 'Academy Admin', email, passwordHash, role: Role.ADMIN, status: UserStatus.ACTIVE } });
  console.log(`Admin ready: ${email}`);
}
main().finally(() => db.$disconnect());
