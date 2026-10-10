import lines from '@/content/companion.json';
import type { Attempt } from './types';

export type CompanionMood =
  | 'wait'
  | 'calm'
  | 'bureaucrat'
  | 'wizard'
  | 'gamer'
  | 'confused'
  | 'scheming'
  | 'wink'
  | 'overload'
  | 'nap'
  | 'panic'
  | 'victory'
  | 'nerd'
  | 'snack'
  | 'pencil'
  | 'loading'
  | 'coffee';

export type CompanionEvent =
  | { kind: 'idle'; checksOn?: boolean; timed?: boolean }
  | { kind: 'nudge' }
  | { kind: 'hint' }
  | { kind: 'checking' }
  | {
      kind: 'result';
      attempt: Attempt;
      correctStreak: number;
      afterMiss: boolean;
    };

// Facts about the session that are not part of the event itself.
export interface CompanionContext {
  hour?: number;
  breakDue?: boolean;
}

export interface CompanionView {
  name: string;
  mood: CompanionMood;
  line: string;
  src: string;
}

export const BREAK_AFTER_MS = 25 * 60 * 1000;

const MOOD_SRC: Record<CompanionMood, string> = {
  wait: '/images/companion/wait.svg',
  calm: '/images/companion/calm.svg',
  bureaucrat: '/images/companion/chibi-bureaucrat.svg',
  wizard: '/images/companion/chibi-wizard.svg',
  gamer: '/images/companion/chibi-gamer.svg',
  confused: '/images/companion/chibi-confused.svg',
  scheming: '/images/companion/chibi-scheming.svg',
  wink: '/images/companion/chibi-wink.svg',
  overload: '/images/companion/chibi-overload.svg',
  nap: '/images/companion/chibi-nap.svg',
  panic: '/images/companion/chibi-panic.svg',
  victory: '/images/companion/chibi-victory.svg',
  nerd: '/images/companion/chibi-nerd.svg',
  snack: '/images/companion/chibi-snack.svg',
  pencil: '/images/companion/chibi-pencil.svg',
  loading: '/images/companion/chibi-loading.svg',
  coffee: '/images/companion/chibi-coffee.svg',
};

export const COMPANION_SRCS = Object.values(MOOD_SRC);

function isLate(hour: number | undefined): boolean {
  return hour !== undefined && (hour >= 22 || hour < 5);
}

function pickLine(pool: string[], previous: string): string {
  if (!previous) return pool[0] ?? '';
  const choices = pool.filter((item) => item !== previous);
  const list = choices.length > 0 ? choices : pool;
  return list[Math.floor(Math.random() * list.length)] ?? pool[0] ?? '';
}

function choose(
  event: CompanionEvent,
  context: CompanionContext,
): [CompanionMood, string[]] {
  switch (event.kind) {
    case 'checking':
      return ['loading', lines.checking];
    case 'hint':
      return ['wizard', lines.hint];
    case 'nudge':
      return ['pencil', lines.nudge];
    case 'idle':
      if (event.checksOn) return ['calm', lines.check];
      if (context.breakDue) return ['snack', lines.break];
      if (isLate(context.hour)) return ['coffee', lines.late];
      if (event.timed) return ['gamer', lines.speed];
      return ['wait', lines.wait];
    case 'result': {
      const { attempt } = event;
      const codes = attempt.error_codes ?? [];
      if (attempt.skipped) return ['nap', lines.skip];
      if (attempt.correct) {
        if (event.correctStreak >= 3) return ['victory', lines.praiseStreak];
        if (event.afterMiss) return ['wink', lines.praiseAfterMiss];
        return ['scheming', lines.praise];
      }
      if (attempt.timed_out) return ['panic', lines.timeout];
      if (codes.includes('calculation')) return ['overload', lines.calculation];
      if (codes.includes('inattention')) return ['bureaucrat', lines.inattention];
      if (codes.includes('freeze')) return ['loading', lines.freeze];
      if (codes.includes('knowledge') || codes.includes('algorithm')) {
        return ['nerd', lines.theory];
      }
      return ['confused', lines.miss];
    }
  }
}

export function pickCompanion(
  event: CompanionEvent,
  previous = '',
  context: CompanionContext = {},
): CompanionView {
  const [mood, pool] = choose(event, context);
  return {
    name: lines.name,
    mood,
    line: pickLine(pool, previous),
    src: MOOD_SRC[mood],
  };
}
