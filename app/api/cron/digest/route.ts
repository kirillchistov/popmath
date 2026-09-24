import { NextResponse } from 'next/server';
import { listStudentUsernames } from '@/lib/auth';
import { buildDigestPayload } from '@/lib/digest';
import { saveDigest } from '@/lib/digest-store';
import { listAttempts } from '@/lib/store';

export const runtime = 'nodejs';

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET ?? '';
  if (!secret) return false;
  const header = request.headers.get('authorization') ?? '';
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  return POST(request);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const extras = (await listAttempts()).map((item) => item.student_id);
  const students = listStudentUsernames(extras);
  const digests = [];
  for (const studentId of students) {
    const payload = await buildDigestPayload(studentId);
    digests.push(
      await saveDigest({
        student_id: studentId,
        week_start: payload.week_start,
        payload,
      }),
    );
  }

  return NextResponse.json({
    ok: true,
    count: digests.length,
    tokens: digests.map((item) => ({
      student_id: item.student_id,
      token: item.token,
      expires_at: item.expires_at,
    })),
  });
}
