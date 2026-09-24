'use client';

import { TIMER_MODE_OPTIONS } from '@/lib/timer';
import type { TimerMode } from '@/lib/types';

export function TimerModeSwitch({
  mode,
  onChange,
}: {
  mode: TimerMode;
  onChange: (mode: TimerMode) => void;
}) {
  return (
    <div className="timer-modes">
      <p className="eyebrow">Режим времени</p>
      <div className="tag-row">
        {TIMER_MODE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`tag-btn ${mode === option.id ? 'active' : ''}`}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="timer-hint">
        {TIMER_MODE_OPTIONS.find((option) => option.id === mode)?.hint}
      </p>
    </div>
  );
}
