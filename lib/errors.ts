import { looksLikeInattention } from './answers';
import type { ErrorCode } from './types';

export function inferErrorCodes(input: {
  correct: boolean;
  skipped: boolean;
  timed_out: boolean;
  raw_answer: string;
  expected?: string;
  trap_answers?: string[];
}): ErrorCode[] {
  if (input.correct) return [];

  const codes: ErrorCode[] = [];
  if (input.skipped || input.timed_out || !input.raw_answer.trim()) {
    codes.push('freeze');
  }
  if (
    input.expected &&
    looksLikeInattention(
      input.raw_answer,
      input.expected,
      input.trap_answers ?? [],
    )
  ) {
    codes.push('inattention');
  }
  return codes;
}

export const SELF_TAG_OPTIONS: { code: ErrorCode; label: string }[] = [
  { code: 'knowledge', label: 'Не поняла тему' },
  { code: 'algorithm', label: 'Не знала ход' },
  { code: 'inattention', label: 'Знак / не дочитала' },
  { code: 'freeze', label: 'Страх / ступор' },
];

export const ERROR_TAG_OPTIONS: { code: ErrorCode; label: string }[] = [
  ...SELF_TAG_OPTIONS,
  { code: 'calculation', label: 'Счёт' },
  { code: 'strategy', label: 'Стратегия' },
];

export const SELF_CHECK_ITEMS = [
  { id: 'read', label: 'Дочитала условие до конца' },
  { id: 'sign', label: 'Знак и направление на месте' },
  { id: 'sense', label: 'Ответ имеет смысл в задаче' },
];
