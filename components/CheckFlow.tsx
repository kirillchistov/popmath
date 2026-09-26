'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { postAttempt } from '@/lib/client-attempts';
import type { CompanionEvent } from '@/lib/companion';
import { Companion, useCompanionPop } from './Companion';
import { SelfCheck, allChecksOn, toggleCheck } from './SelfCheck';
import { SelfTag } from './SelfTag';
import type { Attempt, Task } from '@/lib/types';

export function CheckFlow({ tasks }: { tasks: Task[] }) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [checks, setChecks] = useState<string[]>([]);
  const [current, setCurrent] = useState<Attempt | null>(null);
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);
  const [wins, setWins] = useState(0);
  const [afterMiss, setAfterMiss] = useState(false);
  const [companionEvent, setCompanionEvent] = useState<CompanionEvent>({
    kind: 'idle',
    checksOn: false,
  });
  const pop = useCompanionPop(current?.id ?? null);

  const task = tasks[index];
  const ready = allChecksOn(checks);

  useEffect(() => {
    if (current) return;
    setCompanionEvent({ kind: 'idle', checksOn: ready });
  }, [ready, current, index]);

  const submit = async (value: string, skipped: boolean) => {
    if (!task || busy || current) return;
    setBusy(true);
    try {
      const attempt = await postAttempt({
        task_id: task.id,
        kind: 'check',
        raw_answer: value,
        elapsed_ms: 0,
        skipped,
        timer_mode: 'off',
        self_checked: ready,
      });
      setCurrent(attempt);
      const nextWins = attempt.correct ? wins + 1 : 0;
      setCompanionEvent({
        kind: 'result',
        attempt,
        correctStreak: nextWins,
        afterMiss: attempt.correct && afterMiss,
      });
      setWins(nextWins);
      setAfterMiss(!attempt.correct);
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    if (index + 1 >= tasks.length) {
      setFinished(true);
      return;
    }
    setCurrent(null);
    setAnswer('');
    setChecks([]);
    setIndex((value) => value + 1);
  };

  if (!task || finished) {
    return (
      <article className="panel practice-card">
        <div className="eyebrow">Самопроверка</div>
        <h2>Мышца собрана</h2>
        <Companion event={{ kind: 'idle', checksOn: true }} />
        <p>Это отдельный навык, не «просто соберись». Можно вернуться к сегодняшнему шагу.</p>
        <div className="hero-actions">
          <Link className="btn btn-primary" href="/">
            Сегодня
          </Link>
          <Link className="btn" href="/review">
            Разбор
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className="panel practice-card">
      <div className="eyebrow">
        Самопроверка · {index + 1} / {tasks.length}
      </div>
      <h2>Сначала чеклист, потом ответ</h2>
      <Companion event={companionEvent} pop={pop} />
      <p>Таймера нет. Задача знакомая специально: тренируем не тему, а привычку проверить.</p>
      <p className="prompt">{task.prompt}</p>
      <SelfCheck
        required
        checked={checks}
        onToggle={(id) => setChecks((value) => toggleCheck(value, id))}
      />
      <div className="form-field" style={{ maxWidth: 420 }}>
        <label className="eyebrow" htmlFor="check-answer">
          Твой ответ
        </label>
        <input
          id="check-answer"
          className="input-answer"
          value={answer}
          disabled={Boolean(current)}
          onChange={(event) => setAnswer(event.target.value)}
        />
      </div>
      {!current ? (
        <div className="hero-actions">
          <button
            className="btn btn-primary"
            type="button"
            disabled={busy || !answer.trim() || !ready}
            onClick={() => submit(answer, false)}
          >
            Сдать после проверки
          </button>
        </div>
      ) : (
        <>
          <div className={`feedback show ${current.correct ? 'ok' : 'bad'}`}>
            <strong>{current.correct ? 'Сошлось.' : 'Не сошлось.'}</strong>{' '}
            {current.correct ? current.explain_ok : null}
          </div>
          {!current.correct ? <SelfTag attemptId={current.id} /> : null}
          <div className="hero-actions">
            <button className="btn btn-primary" type="button" onClick={next}>
              Следующее
            </button>
          </div>
        </>
      )}
    </article>
  );
}
