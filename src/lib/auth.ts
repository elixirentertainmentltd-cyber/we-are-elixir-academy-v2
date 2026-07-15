import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './db';
const COOKIE = 'elixir_session';
const hash = (value:string) => createHash('sha256').update(value).digest('hex');
export async function createSession(userId:string) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 86400000);
  await db.session.create({ data: { userId, tokenHash: hash(token), expiresAt } });
  (await cookies()).set(COOKIE, token, { httpOnly:true, secure:process.env.NODE_ENV==='production', sameSite:'lax', path:'/', expires:expiresAt });
}
export async function clearSession() {
  const jar = await cookies(); const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where:{ tokenHash:hash(token) } });
  jar.delete(COOKIE);
}
export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value; if (!token) return null;
  const session = await db.session.findUnique({ where:{tokenHash:hash(token)}, include:{user:true} });
  if (!session || session.expiresAt <= new Date()) return null;
  return session.user;
}
export async function requireActiveUser() {
  const user = await currentUser(); if (!user) redirect('/login');
  if (user.status === 'PENDING') redirect('/pending');
  if (user.status !== 'ACTIVE') redirect('/login?error=account');
  return user;
}
export async function requireAdmin() { const user=await requireActiveUser(); if(user.role!=='ADMIN') redirect('/dashboard'); return user; }
