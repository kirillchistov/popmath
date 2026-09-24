import { getQuizQuestions } from './content';
import type { Attempt, TopicProgress, TopicState } from './types';

export function uniqueQuizCount(attempts: Attempt[]): number {
  return new Set(
    attempts.filter((item) => item.kind === 'quiz').map((item) => item.task_id),
  ).size;
}

export function quizTotal(): number {
  return getQuizQuestions().length;
}

export function buildTopicProgress(
  attempts: Attempt[],
  topicIds: string[],
): TopicProgress[] {
  return topicIds.map((topicId) => {
    const items = attempts.filter((item) => item.topic_id === topicId);
    if (items.length === 0) {
      return {
        topic_id: topicId,
        state: 'untouched',
        correct: 0,
        wrong: 0,
        last_at: null,
      };
    }

    const correct = items.filter((item) => item.correct).length;
    const wrong = items.length - correct;
    const lastAt = items[0]?.created_at ?? null;

    let state: TopicState = 'shaky';
    if (wrong >= 2 && wrong > correct) state = 'hole';
    else if (correct >= 2 && wrong === 0) state = 'holds';
    else if (correct >= 3 && correct >= wrong * 2) state = 'holds';
    else if (wrong >= 1 || correct === 1) state = 'shaky';

    return { topic_id: topicId, state, correct, wrong, last_at: lastAt };
  });
}

export const STATE_LABEL: Record<TopicState, string> = {
  holds: 'Держится',
  shaky: 'Шатко',
  hole: 'Дыра',
  untouched: 'Не трогали',
};
