'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { postAttempt } from '@/lib/client-attempts';
import { SelfTag } from './SelfTag';
import type { Attempt, Topic } from '@/lib/types';

export function PracticeFlow({ topic }: { topic: Topic }) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [timerOn, setTimerOn] = useState(false);
  const [seconds, setSeconds] = useState(topic.tasks[0]?.time_sec ?? 45);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [current, setCurrent] = useState<Attempt | null>(null);
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);
  const timerArmed = useRef(false);

  const task = topic.tasks[index];

  useEffect(() => {
    timerArmed.current = false;
    if (!timerOn || finished || current || !task) return undefined;
    setSeconds(task.time_sec);
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) timerArmed.current = true;
        return Math.max(0, value - 1);
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timerOn, index, current, finished, task]);

  useEffect(() => {
    if (timerArmed.current && timerOn && !current && !finished && seconds === 0) {
      timerArmed.current = false;
      void submit('', true, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, timerOn, current, finished]);

  const submit = async (value: string, timedOut: boolean, skipped: boolean) => {
    if (!task || busy || current) return;
    setBusy(true);
    try {
      const attempt = await postAttempt({
        task_id: task.id,
        kind: 'practice',
        raw_answer: value,
        elapsed_ms: Date.now() - startedAt,
        timed_out: timedOut,
        skipped,
      });
      setCurrent(attempt);
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    if (index + 1 >= topic.tasks.length) {
      setFinished(true);
      return;
    }
    setCurrent(null);
    setAnswer('');
    setStartedAt(Date.now());
    setIndex((value) => value + 1);
  };

  if (finished) {
    return (
      <article className="panel practice-card">
        <div className="eyebrow">Практика</div>
        <h2>Тема пройдена без спешки</h2>
        <p>Разбор сохранил ошибки. Можно вернуться к карте или посмотреть, где срывался ход.</p>
        <div className="hero-actions">
          <Link className="btn btn-primary" href="/review">
            К разбору
          </Link>
          <Link className="btn" href="/map">
            К карте
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className="panel practice-card">
      <div className="question-head">
        <div>
          <div className="eyebrow">Практика</div>
          <h3>
            Задание {index + 1} из {topic.tasks.length}
          </h3>
        </div>
        <div className="badge">
          <span>{topic.badge}</span>
          {timerOn ? <span className="timer">{formatTime(seconds)}</span> : null}
        </div>
      </div>
      <label className="timer-toggle">
        <input
          type="checkbox"
          checked={timerOn}
          onChange={(event) => setTimerOn(event.target.checked)}
        />
        Мягкий таймер. Сначала можно без него.
      </label>
      <p className="prompt">{task.prompt}</p>
      <div className="form-field" style={{ maxWidth: 420 }}>
        <label className="eyebrow" htmlFor="practice-answer">
          Твой ответ
        </label>
        <input
          id="practice-answer"
          className="input-answer"
          value={answer}
          disabled={Boolean(current)}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Например: 4 или x = 4"
        />
      </div>
      {!current ? (
        <div className="hero-actions">
          <button
            className="btn btn-primary"
            type="button"
            disabled={busy || !answer.trim()}
            onClick={() => submit(answer, false, false)}
          >
            Проверить
          </button>
          <button
            className="btn"
            type="button"
            disabled={busy}
            onClick={() => submit('', false, true)}
          >
            Пропустить
          </button>
        </div>
      ) : (
        <>
          <div className={`feedback show ${current.correct ? 'ok' : 'bad'}`}>
            <strong>
              {current.timed_out
                ? 'Время вышло.'
                : current.skipped
                  ? 'Пропущено. Можно вернуться позже.'
                  : current.correct
                    ? 'Верно.'
                    : 'Есть ошибка.'}
            </strong>{' '}
            {current.explain_ok}
          </div>
          {!current.correct ? (
            <>
              <div className="memory-illustration">
                <div className="memory-box bad">
                  <div className="eyebrow">Как не надо</div>
                  <p>{current.explain_trap}</p>
                </div>
                <div className="memory-box good">
                  <div className="eyebrow">Как надо</div>
                  <p>{current.explain_ok}</p>
                </div>
              </div>
              <SelfTag attemptId={current.id} />
            </>
          ) : null}
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

function formatTime(total: number) {
  const mm = String(Math.max(0, Math.floor(total / 60))).padStart(2, '0');
  const ss = String(Math.max(0, total % 60)).padStart(2, '0');
  return `${mm}:${ss}`;
}
