import { NextResponse } from 'next/server';
import { getLiveTask } from '@/lib/live-content';
import { assignTaskToStudent, unassignTaskFromStudent } from '@/lib/plan-store';
import { getSession } from '@/lib/session';
import { getStudentPlan } from '@/lib/student-plan';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'tutor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as {
    student_id?: string;
    task_id?: string;
    remove?: boolean;
  };
  const studentId = body.student_id?.trim() ?? '';
  const taskId = body.task_id?.trim() ?? '';
  if (!studentId || !taskId) {
    return NextResponse.json({ error: 'Invalid assign' }, { status: 400 });
  }

  const found = await getLiveTask(taskId);
  if (!found) {
    return NextResponse.json({ error: 'Unknown task' }, { status: 404 });
  }

  if (body.remove) {
    await unassignTaskFromStudent(studentId, taskId);
  } else {
    await assignTaskToStudent(studentId, taskId, found.topic.id);
  }

  const plan = await getStudentPlan(studentId);
  return NextResponse.json({ plan });
}
