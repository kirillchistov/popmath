import type { Task, Topic } from './types';

export const WEEK_TOPIC_IDS = ['word', 'equations', 'geometry'] as const;

export const WEEK_FOCUS_TAGS: Record<string, string[]> = {
  word: ['огэ-6'],
  equations: ['огэ-9'],
  geometry: ['огэ-15'],
};

export const NOTEBOOK_TAGS = ['огэ-6', 'огэ-9', 'огэ-15'];

export const SITTING_SIZE = 4;

export function isWeekTopic(topicId: string): boolean {
  return (WEEK_TOPIC_IDS as readonly string[]).includes(topicId);
}

export function needsNotebook(task: Task | undefined): boolean {
  return Boolean(task?.tags.some((tag) => NOTEBOOK_TAGS.includes(tag)));
}

export function focusPool(topic: Topic): Task[] {
  const tags = WEEK_FOCUS_TAGS[topic.id];
  if (!tags) return topic.tasks;
  const pool = topic.tasks.filter((task) =>
    task.tags.some((tag) => tags.includes(tag)),
  );
  return pool.length > 0 ? pool : topic.tasks;
}

export function pickSitting(topic: Topic, solvedIds: string[]): Task[] {
  const solved = new Set(solvedIds);
  const pool = focusPool(topic);
  const unsolved = pool.filter((task) => !solved.has(task.id));
  const done = pool.filter((task) => solved.has(task.id));
  const picked = [...unsolved, ...done].slice(0, SITTING_SIZE);
  return picked.length > 0 ? picked : pool.slice(0, SITTING_SIZE);
}
