import { NextResponse } from 'next/server';
import { getTopic } from '@/lib/content';
import { todayISO } from '@/lib/plan';
import { markOpenedNewTopic } from '@/lib/plan-store';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as { topic_id?: string };
  const topicId = body.topic_id?.trim() ?? '';
  if (!getTopic(topicId)) {
    return NextResponse.json({ error: 'Unknown topic' }, { status: 404 });
  }

  const override = await markOpenedNewTopic(session.username, todayISO());
  return NextResponse.json({ override });
}
