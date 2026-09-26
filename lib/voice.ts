import type { ErrorCode } from './types';

export const STUDENT_TAG_LABELS: Record<ErrorCode, string> = {
  knowledge: 'тема ещё мутная',
  algorithm: 'не знала, с чего начать',
  inattention: 'глаза убежали',
  calculation: 'счёт поехал',
  freeze: 'лист смотрел первым',
  strategy: 'сбился план',
};

export const TUTOR_TAG_LABELS: Record<ErrorCode, string> = {
  knowledge: 'не поняла тему',
  algorithm: 'не знала ход',
  inattention: 'знак / не дочитала',
  calculation: 'счёт',
  freeze: 'страх / ступор',
  strategy: 'стратегия',
};

export const MEMORY_LABELS = {
  trap: 'Где обычно едет',
  hold: 'Как держится',
} as const;
