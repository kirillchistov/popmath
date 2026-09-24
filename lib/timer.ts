import type { TimerMode } from './types';

const STORAGE_KEY = 'oge-timer-mode';

export function timerSeconds(base: number, mode: TimerMode): number {
  if (mode === 'off') return 0;
  if (mode === 'exam') return Math.max(12, Math.round(base * 0.6));
  return base;
}

export function readTimerMode(): TimerMode {
  if (typeof window === 'undefined') return 'off';
  const value = window.sessionStorage.getItem(STORAGE_KEY);
  return value === 'soft' || value === 'exam' ? value : 'off';
}

export function writeTimerMode(mode: TimerMode) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(STORAGE_KEY, mode);
}

export const TIMER_MODE_OPTIONS: { id: TimerMode; label: string; hint: string }[] =
  [
    { id: 'off', label: 'Без таймера', hint: 'Сначала ход, потом скорость' },
    { id: 'soft', label: 'Мягкий', hint: 'Подсказка по времени, без экзамена' },
    { id: 'exam', label: 'Экзамен', hint: 'Короче окно. Это тренировка, не приговор' },
  ];
