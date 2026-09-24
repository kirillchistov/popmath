import { NextResponse } from 'next/server';
import {
  createSessionToken,
  getAuthUser,
  sessionCookieOptions,
  SESSION_COOKIE,
  verifyCredentials,
} from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    const username = body.username?.trim() ?? '';
    const password = body.password ?? '';

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    if (!verifyCredentials(username, password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = getAuthUser(username);
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await createSessionToken(user.username, user.role);
    const response = NextResponse.json({ ok: true, role: user.role });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ error: 'Auth misconfigured' }, { status: 500 });
  }
}
