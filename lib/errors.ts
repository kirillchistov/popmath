import { looksLikeInattention } from './answers';
import { TUTOR_TAG_LABELS } from './voice';
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
  { code: 'knowledge', label: 'Тема ещё мутная' },
  { code: 'algorithm', label: 'Не знала, с чего начать' },
  { code: 'inattention', label: 'Глаза убежали' },
  { code: 'freeze', label: 'Лист смотрел первым' },
];

export const ERROR_TAG_OPTIONS: { code: ErrorCode; label: string }[] = [
  { code: 'knowledge', label: TUTOR_TAG_LABELS.knowledge },
  { code: 'algorithm', label: TUTOR_TAG_LABELS.algorithm },
  { code: 'inattention', label: TUTOR_TAG_LABELS.inattention },
  { code: 'freeze', label: TUTOR_TAG_LABELS.freeze },
  { code: 'calculation', label: TUTOR_TAG_LABELS.calculation },
  { code: 'strategy', label: TUTOR_TAG_LABELS.strategy },
];

export const SELF_CHECK_ID = 'ready';

export const SELF_CHECK_HINTS = [
  'Дочитать условие до конца',
  'Проверить знаки и направление',
  'Найти в задаче здравый смысл',
];
