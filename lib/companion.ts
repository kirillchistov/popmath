import lines from '@/content/companion.json';
import type { Attempt, ErrorCode } from './types';

export type CompanionMood =
  | 'wait'
  | 'glad'
  | 'kind'
  | 'wink'
  | 'lookaway'
  | 'calm';

export type CompanionEvent =
  | { kind: 'idle'; checksOn?: boolean }
  | {
      kind: 'result';
      attempt: Attempt;
      correctStreak: number;
      afterMiss: boolean;
    };

export interface CompanionView {
  name: string;
  mood: CompanionMood;
  line: string;
  src: string;
}

const MOOD_SRC: Record<CompanionMood, string> = {
  wait: '/images/companion/wait.svg',
  glad: '/images/companion/glad.svg',
  kind: '/images/companion/kind.svg',
  wink: '/images/companion/wink.svg',
  lookaway: '/images/companion/lookaway.svg',
  calm: '/images/companion/calm.svg',
};

function pickLine(pool: string[], previous: string): string {
  if (!previous) return pool[0] ?? '';
  const choices = pool.filter((item) => item !== previous);
  const list = choices.length > 0 ? choices : pool;
  return list[Math.floor(Math.random() * list.length)] ?? pool[0] ?? '';
}

export function pickCompanion(
  event: CompanionEvent,
  previous = '',
): CompanionView {
  let mood: CompanionMood = 'wait';
  let pool = lines.wait;

  if (event.kind === 'idle') {
    if (event.checksOn) {
      mood = 'calm';
      pool = lines.check;
    }
  } else {
    const codes = event.attempt.error_codes ?? [];
    if (event.attempt.skipped) {
      mood = 'lookaway';
      pool = lines.skip;
    } else if (event.attempt.correct) {
      mood = 'glad';
      pool =
        event.correctStreak >= 3
          ? lines.praiseStreak
          : event.afterMiss
            ? lines.praiseAfterMiss
            : lines.praise;
    } else if (codes.includes('inattention' as ErrorCode)) {
      mood = 'wink';
      pool = lines.inattention;
    } else if (codes.includes('freeze' as ErrorCode) || event.attempt.timed_out) {
      mood = 'lookaway';
      pool = lines.freeze;
    } else {
      mood = 'kind';
      pool = lines.miss;
    }
  }

  return {
    name: lines.name,
    mood,
    line: pickLine(pool, previous),
    src: MOOD_SRC[mood],
  };
}
