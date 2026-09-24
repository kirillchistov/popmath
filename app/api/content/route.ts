import { NextResponse } from 'next/server';
import { getBaseTopics } from '@/lib/content';
import { addOverlaySupport, addOverlayTask } from '@/lib/content-overlay';
import { getLiveTask, getLiveTopicsMeta, loadLiveTopics } from '@/lib/live-content';
import { getSession } from '@/lib/session';
import type { Task } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'tutor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json({
    topics: await getLiveTopicsMeta(),
    items: await loadLiveTopics(),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'tutor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as {
    kind?: 'task' | 'support';
    topic_id?: string;
    prompt?: string;
    answer?: string;
    explain_ok?: string;
    explain_trap?: string;
    review_title?: string;
    time_sec?: number;
    tags?: string;
    trap_answers?: string;
    image?: string;
    title?: string;
    metaphor?: string;
    anchor?: string;
    body?: string;
    steps?: string[] | string;
  };

  const topicId = body.topic_id?.trim() ?? '';
  if (!getBaseTopics().some((topic) => topic.id === topicId)) {
    return NextResponse.json({ error: 'Unknown topic' }, { status: 400 });
  }

  if (body.kind === 'support') {
    const title = body.title?.trim() ?? '';
    const steps = Array.isArray(body.steps)
      ? body.steps.map((item) => item.trim()).filter(Boolean)
      : String(body.steps ?? '')
          .split(/\n+/)
          .map((item) => item.trim())
          .filter(Boolean);
    if (!title || steps.length < 3 || steps.length > 5) {
      return NextResponse.json(
        { error: 'Опоре нужны заголовок и 3–5 шагов' },
        { status: 400 },
      );
    }
    const support = await addOverlaySupport({
      id: `support-${topicId}-${Date.now().toString(36)}`,
      topic_id: topicId,
      title,
      metaphor: body.metaphor?.trim() ?? '',
      anchor: body.anchor?.trim() ?? '',
      steps,
      body: body.body?.trim() || steps.join(' '),
    });
    return NextResponse.json({ support, topics: await loadLiveTopics() });
  }

  const prompt = body.prompt?.trim() ?? '';
  const answer = body.answer?.trim() ?? '';
  const explainOk = body.explain_ok?.trim() ?? '';
  const explainTrap = body.explain_trap?.trim() ?? '';
  const timeSec = Number(body.time_sec ?? 45);
  if (!prompt || !answer || !explainOk || !explainTrap) {
    return NextResponse.json(
      { error: 'Нужны условие, ответ, «как надо» и ловушка' },
      { status: 400 },
    );
  }
  if (!Number.isFinite(timeSec) || timeSec < 15 || timeSec > 300) {
    return NextResponse.json({ error: 'Время 15–300 секунд' }, { status: 400 });
  }

  const id = `admin-${topicId}-${Date.now().toString(36)}`;
  if (await getLiveTask(id)) {
    return NextResponse.json({ error: 'Такая задача уже есть' }, { status: 409 });
  }

  const task: Task = {
    id,
    topic_id: topicId,
    prompt,
    answer,
    kind: 'practice',
    explain_ok: explainOk,
    explain_trap: explainTrap,
    review_title: body.review_title?.trim() || prompt.slice(0, 48),
    time_sec: Math.round(timeSec),
    tags: String(body.tags ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    trap_answers: String(body.trap_answers ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    image: body.image?.trim() || undefined,
  };

  await addOverlayTask(task);
  return NextResponse.json({ task, topics: await loadLiveTopics() });
}
