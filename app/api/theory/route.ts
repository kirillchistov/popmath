import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getTheoryItem, getTheoryItems } from '@/lib/theory';
import { listTheoryMarks, upsertTheoryMark } from '@/lib/theory-store';
import type { TheoryMarkKind } from '@/lib/types';

export const runtime = 'nodejs';

const MARKS: TheoryMarkKind[] = ['remember', 'forgot', 'question'];

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const student =
    session.role === 'tutor'
      ? new URL(request.url).searchParams.get('student') || undefined
      : session.username;
  const [items, marks] = await Promise.all([
    Promise.resolve(getTheoryItems()),
    listTheoryMarks(student),
  ]);
  return NextResponse.json({ items, marks });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = (await request.json()) as {
    item_id?: string;
    mark?: TheoryMarkKind;
    note?: string;
    student_id?: string;
  };
  if (!body.item_id || !getTheoryItem(body.item_id)) {
    return NextResponse.json({ error: 'Unknown item' }, { status: 400 });
  }
  if (!body.mark || !MARKS.includes(body.mark)) {
    return NextResponse.json({ error: 'Invalid mark' }, { status: 400 });
  }
  const studentId =
    session.role === 'tutor' && body.student_id
      ? body.student_id
      : session.username;
  const mark = await upsertTheoryMark({
    student_id: studentId,
    item_id: body.item_id,
    mark: body.mark,
    note: body.note,
  });
  return NextResponse.json({ mark });
}
