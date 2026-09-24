import type { ErrorCode } from './types';

export function inferErrorCodes(input: {
  correct: boolean;
  skipped: boolean;
  timed_out: boolean;
  raw_answer: string;
}): ErrorCode[] {
  if (input.correct) return [];
  if (input.skipped || input.timed_out || !input.raw_answer.trim()) {
    return ['freeze'];
  }
  return [];
}

export const SELF_TAG_OPTIONS: { code: ErrorCode; label: string }[] = [
  { code: 'knowledge', label: 'Не поняла тему' },
  { code: 'algorithm', label: 'Не знала ход' },
  { code: 'inattention', label: 'Знак / не дочитала' },
  { code: 'freeze', label: 'Страх / ступор' },
];
