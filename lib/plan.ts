import { isWeekTopic } from './focus';
import type { QueueItem, TopicProgress, TopicState } from './types';

const STATE_RANK: Record<TopicState, number> = {
  hole: 0,
  shaky: 1,
  untouched: 2,
  holds: 3,
};

export function weekStartISO(now = new Date()): string {
  const date = new Date(now);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toISODate(date);
}

export function todayISO(now = new Date()): string {
  return toISODate(now);
}

function toISODate(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function reasonFor(state: TopicState, role: QueueItem['role']): string {
  if (role === 'review') {
    return 'Короткое повторение, чтобы недавнее не стёрлось.';
  }
  if (state === 'hole') {
    return 'Здесь чаще срывается ход — максимум прибавки на этой неделе.';
  }
  if (state === 'shaky') {
    return 'Тема как будто знакома, но устойчивого алгоритма ещё нет.';
  }
  if (state === 'untouched') {
    return 'Новая тема. Сегодня только одна новая, без перегруза.';
  }
  return 'Закрепить то, что уже держится.';
}

export function orderedTopicIds(
  progress: TopicProgress[],
  tutorOrder: string[] = [],
): string[] {
  const known = new Set(progress.map((item) => item.topic_id));
  const fromTutor = tutorOrder.filter((id) => known.has(id));
  const rest = [...progress]
    .sort((left, right) => STATE_RANK[left.state] - STATE_RANK[right.state])
    .map((item) => item.topic_id)
    .filter((id) => !fromTutor.includes(id));
  return [...fromTutor, ...rest];
}

export function buildQueue(
  progress: TopicProgress[],
  tutorOrder: string[] = [],
): QueueItem[] {
  const week = progress.filter((item) => isWeekTopic(item.topic_id));
  if (week.length === 0) return [];
  const byId = new Map(week.map((item) => [item.topic_id, item]));
  const ids = orderedTopicIds(week, tutorOrder.filter((id) => isWeekTopic(id)));
  const items: QueueItem[] = [];

  const focusId = ids.find((id) => byId.get(id)?.state !== 'holds') ?? ids[0];
  if (focusId) {
    const state = byId.get(focusId)?.state ?? 'untouched';
    items.push({
      topic_id: focusId,
      role: 'focus',
      minutes: 15,
      reason: reasonFor(state, 'focus'),
    });
  }

  const reviewId =
    ids.find((id) => id !== focusId && byId.get(id)?.state === 'holds') ??
    ids.find((id) => id !== focusId && byId.get(id)?.state === 'shaky');
  if (reviewId) {
    const state = byId.get(reviewId)?.state ?? 'shaky';
    items.push({
      topic_id: reviewId,
      role: 'review',
      minutes: 10,
      reason: reasonFor(state, 'review'),
    });
  }

  return items;
}

export function pickTodayItem(
  queue: QueueItem[],
  progress: TopicProgress[],
  openedNewOn: string | null,
  today: string,
): QueueItem | null {
  if (queue.length === 0) return null;
  const byId = new Map(progress.map((item) => [item.topic_id, item]));
  const focus = queue.find((item) => item.role === 'focus') ?? null;
  const review = queue.find((item) => item.role === 'review') ?? null;

  if (
    focus &&
    byId.get(focus.topic_id)?.state === 'untouched' &&
    openedNewOn === today
  ) {
    return review;
  }

  return focus ?? review;
}
