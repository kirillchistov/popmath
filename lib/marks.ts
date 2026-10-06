import type { Attempt } from './types';

export function markWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'марка';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'марки';
  return 'марок';
}

function isMiss(attempt: Attempt): boolean {
  return !attempt.skipped && !attempt.correct;
}

export function marksForAttempt(attempt: Attempt, afterMiss: boolean): number {
  if (attempt.skipped) return 0;
  let count = 1;
  if (attempt.self_checked) count += 1;
  if (attempt.correct && afterMiss) count += 1;
  return count;
}

export function marksInWeek(attempts: Attempt[], weekStart: string): number {
  const ordered = [...attempts].sort((left, right) =>
    left.created_at.localeCompare(right.created_at),
  );
  const missed = new Set<string>();
  let total = 0;
  for (const attempt of ordered) {
    const afterMiss = attempt.correct && missed.has(attempt.task_id);
    if (attempt.created_at.slice(0, 10) >= weekStart) {
      total += marksForAttempt(attempt, afterMiss);
    }
    if (isMiss(attempt)) missed.add(attempt.task_id);
  }
  return total;
}
