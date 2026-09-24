import { NextResponse } from 'next/server';
import { answersMatch } from '@/lib/answers';
import { getQuizQuestion, getTask } from '@/lib/content';
import { inferErrorCodes } from '@/lib/errors';
import { getSession } from '@/lib/session';
import { listAttempts, saveAttempt } from '@/lib/store';
import type { AttemptDraft, TaskKind } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const student = new URL(request.url).searchParams.get('student');
  if (session.role === 'tutor') {
    const attempts = await listAttempts(student || undefined);
    return NextResponse.json({ attempts });
  }

  const attempts = await listAttempts(session.username);
  return NextResponse.json({ attempts });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    task_id?: string;
    kind?: TaskKind;
    raw_answer?: string;
    elapsed_ms?: number;
    timed_out?: boolean;
    skipped?: boolean;
  };

  const taskId = body.task_id?.trim() ?? '';
  const kind = body.kind;
  const rawAnswer = body.skipped ? '' : (body.raw_answer ?? '').trim();
  const timedOut = Boolean(body.timed_out);
  const skipped = Boolean(body.skipped);

  if (!taskId || (kind !== 'quiz' && kind !== 'practice' && kind !== 'check')) {
    return NextResponse.json({ error: 'Invalid attempt' }, { status: 400 });
  }

  let prompt = '';
  let expected = '';
  let explainOk = '';
  let explainTrap = '';
  let reviewTitle = '';
  let topicId: string | null = null;

  if (kind === 'quiz') {
    const question = getQuizQuestion(taskId);
    if (!question) {
      return NextResponse.json({ error: 'Unknown question' }, { status: 404 });
    }
    prompt = question.prompt;
    expected = question.answer;
    explainOk = question.explain_ok;
    explainTrap = question.explain_trap;
    reviewTitle = question.review_title;
    topicId = question.topic_id;
  } else {
    const found = getTask(taskId);
    if (!found) {
      return NextResponse.json({ error: 'Unknown task' }, { status: 404 });
    }
    prompt = found.task.prompt;
    expected = found.task.answer;
    explainOk = found.task.explain_ok;
    explainTrap = found.task.explain_trap;
    reviewTitle = found.task.review_title;
    topicId = found.topic.id;
  }

  const correct = !skipped && !timedOut && answersMatch(rawAnswer, expected);
  const draft: AttemptDraft = {
    student_id: session.username,
    task_id: taskId,
    kind,
    prompt,
    raw_answer: rawAnswer,
    expected,
    correct,
    elapsed_ms: Number.isFinite(body.elapsed_ms) ? Number(body.elapsed_ms) : 0,
    timed_out: timedOut,
    skipped,
    error_codes: inferErrorCodes({
      correct,
      skipped,
      timed_out: timedOut,
      raw_answer: rawAnswer,
    }),
    explain_ok: explainOk,
    explain_trap: explainTrap,
    review_title: reviewTitle,
    topic_id: topicId,
  };

  const attempt = await saveAttempt(draft);
  return NextResponse.json({ attempt });
}
