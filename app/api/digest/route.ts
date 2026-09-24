import { NextResponse } from 'next/server';
import { listStudentUsernames } from '@/lib/auth';
import { buildDigestPayload } from '@/lib/digest';
import {
  listLatestDigests,
  markDigestSent,
  saveDigest,
} from '@/lib/digest-store';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'tutor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const students = listStudentUsernames();
  const latest = await listLatestDigests();
  return NextResponse.json({ students, digests: latest });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'tutor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as {
    student_id?: string;
    token?: string;
    mark_sent?: boolean;
  };

  if (body.mark_sent && body.token) {
    const digest = await markDigestSent(body.token);
    if (!digest) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ digest });
  }

  const studentId = body.student_id?.trim() ?? '';
  if (!studentId) {
    return NextResponse.json({ error: 'Unknown student' }, { status: 400 });
  }

  const payload = await buildDigestPayload(studentId);
  const digest = await saveDigest({
    student_id: studentId,
    week_start: payload.week_start,
    payload,
  });
  return NextResponse.json({ digest });
}
