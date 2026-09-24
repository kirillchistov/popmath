import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, verifySessionToken } from './auth';
import type { SessionPayload, UserRole } from './types';

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
}

export async function requireRole(role: UserRole): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== role) redirect('/');
  return session;
}
