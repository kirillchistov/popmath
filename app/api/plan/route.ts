import { NextResponse } from 'next/server';
import { getAllTopics } from '@/lib/content';
import { getStudentPlan } from '@/lib/student-plan';
import { savePlanOrder } from '@/lib/plan-store';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const asked = new URL(request.url).searchParams.get('student');
  const studentId =
    session.role === 'tutor' ? (asked ?? session.username) : session.username;
  if (session.role !== 'tutor' && asked && asked !== session.username) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const plan = await getStudentPlan(studentId);
  return NextResponse.json({ plan });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'tutor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as {
    student_id?: string;
    order?: string[];
  };
  const studentId = body.student_id?.trim() ?? '';
  const allowed = new Set(getAllTopics().map((topic) => topic.id));
  const order = (body.order ?? []).filter((id) => allowed.has(id));
  if (!studentId) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const saved = await savePlanOrder(studentId, order);
  const plan = await getStudentPlan(studentId);
  return NextResponse.json({ override: saved, plan });
}
