import { SignJWT, jwtVerify } from 'jose';
import type { AuthUser, SessionPayload, UserRole } from './types';

export const SESSION_COOKIE = 'oge-session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET must be at least 32 characters');
  }
  return new TextEncoder().encode(secret);
}

function asRole(value: string): UserRole | null {
  if (value === 'student' || value === 'tutor') return value;
  return null;
}

export function parseAuthUsers(): Map<string, AuthUser> {
  const raw = process.env.AUTH_USERS ?? '';
  const users = new Map<string, AuthUser>();

  for (const entry of raw.split(',')) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const firstColon = trimmed.indexOf(':');
    if (firstColon === -1) continue;

    const login = trimmed.slice(0, firstColon).trim();
    const rest = trimmed.slice(firstColon + 1);
    const lastColon = rest.lastIndexOf(':');

    let password = rest;
    let role: UserRole = 'student';

    if (lastColon !== -1) {
      const maybeRole = asRole(rest.slice(lastColon + 1).trim());
      if (maybeRole) {
        password = rest.slice(0, lastColon);
        role = maybeRole;
      }
    }

    if (login && password) {
      users.set(login, { username: login, password, role });
    }
  }

  return users;
}

export function getAuthUser(username: string): AuthUser | undefined {
  return parseAuthUsers().get(username);
}

export function verifyCredentials(username: string, password: string): boolean {
  const user = getAuthUser(username);
  return user !== undefined && user.password === password;
}

export async function createSessionToken(
  username: string,
  role: UserRole,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return new SignJWT({ username, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(exp)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.username !== 'string') return null;
    const role = asRole(String(payload.role ?? 'student'));
    if (!role) return null;
    return {
      username: payload.username,
      role,
      exp: typeof payload.exp === 'number' ? payload.exp : 0,
    };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge = SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
