'use client';

import { useState } from 'react';

export function ReportBug({ attemptId }: { attemptId: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');

  const send = async () => {
    if (state === 'busy' || state === 'ok') return;
    setState('busy');
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attemptId }),
      });
      setState(response.ok ? 'ok' : 'err');
    } catch {
      setState('err');
    }
  };

  return (
    <div className="report-bug">
      <button
        className="btn"
        type="button"
        disabled={state === 'busy' || state === 'ok'}
        onClick={() => void send()}
      >
        {state === 'ok'
          ? 'Отметили, разберём'
          : state === 'busy'
            ? 'Отправляю…'
            : 'В тренажёре ошибка'}
      </button>
      {state === 'err' ? (
        <p className="timer-hint">Не отправилось. Можно ещё раз или сказать тьютору.</p>
      ) : null}
    </div>
  );
}
