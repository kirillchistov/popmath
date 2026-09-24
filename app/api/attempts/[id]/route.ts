import { NextResponse } from 'next/server';
import { ERROR_TAG_OPTIONS, SELF_TAG_OPTIONS } from '@/lib/errors';
import { getSession } from '@/lib/session';
import { getAttempt, updateAttemptTag } from '@/lib/store';
import type { ErrorCode } from '@/lib/types';

export const runtime = 'nodejs';

const studentAllowed = new Set(SELF_TAG_OPTIONS.map((item) => item.code));
const tutorAllowed = new Set(ERROR_TAG_OPTIONS.map((item) => item.code));

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const current = await getAttempt(id);
  if (!current) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (session.role !== 'tutor' && current.student_id !== session.username) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as {
    self_tag?: string;
    error_code?: string;
  };
  const tag = (body.error_code ?? body.self_tag) as ErrorCode | undefined;
  const allowed = session.role === 'tutor' ? tutorAllowed : studentAllowed;
  if (!tag || !allowed.has(tag)) {
    return NextResponse.json({ error: 'Invalid tag' }, { status: 400 });
  }

  const attempt = await updateAttemptTag(id, tag, {
    replaceCodes: session.role === 'tutor' && Boolean(body.error_code),
  });
  return NextResponse.json({ attempt });
}
