import { NextResponse } from 'next/server';
import { notifyAdmin } from '@/lib/mail';
import { listReports, saveReport } from '@/lib/reports-store';
import { getSession } from '@/lib/session';
import { getAttempt } from '@/lib/store';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ reports: await listReports() });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as { attempt_id?: string };
  const attemptId = body.attempt_id?.trim() ?? '';
  const attempt = await getAttempt(attemptId);
  if (!attempt) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (session.role !== 'tutor' && attempt.student_id !== session.username) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const text = [
    `Ученик: ${attempt.student_id}`,
    `Задача: ${attempt.task_id}`,
    `Условие: ${attempt.prompt}`,
    `Ответ ученика: ${attempt.raw_answer || 'нет'}`,
    `Канон тренажёра: ${attempt.expected}`,
    `Попытка: ${attempt.id}`,
  ].join('\n');

  const emailed = await notifyAdmin('Матешка: ошибка в тренажёре', text);
  const report = await saveReport({
    student_id: attempt.student_id,
    attempt_id: attempt.id,
    task_id: attempt.task_id,
    prompt: attempt.prompt,
    raw_answer: attempt.raw_answer,
    expected: attempt.expected,
    emailed,
  });

  return NextResponse.json({ report });
}
