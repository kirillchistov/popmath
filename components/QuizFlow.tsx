'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { postAttempt } from '@/lib/client-attempts';
import { SelfTag } from './SelfTag';
import type { Attempt, QuizQuestion } from '@/lib/types';

interface QuizFlowProps {
  questions: QuizQuestion[];
}

export function QuizFlow({ questions }: QuizFlowProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [timerOn, setTimerOn] = useState(false);
  const [seconds, setSeconds] = useState(questions[0]?.time_sec ?? 25);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [current, setCurrent] = useState<Attempt | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [busy, setBusy] = useState(false);
  const timerArmed = useRef(false);

  const question = questions[index];
  const done = index >= questions.length;

  useEffect(() => {
    timerArmed.current = false;
    if (!timerOn || done || current || !question) return undefined;
    setSeconds(question.time_sec);
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) timerArmed.current = true;
        return Math.max(0, value - 1);
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timerOn, index, current, done, question]);

  useEffect(() => {
    if (timerArmed.current && timerOn && !current && !done && seconds === 0) {
      timerArmed.current = false;
      void submit('', true, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, timerOn, current, done]);

  const submit = async (answer: string, timedOut: boolean, skipped: boolean) => {
    if (!question || busy || current) return;
    setBusy(true);
    try {
      const attempt = await postAttempt({
        task_id: question.id,
        kind: 'quiz',
        raw_answer: answer,
        elapsed_ms: Date.now() - startedAt,
        timed_out: timedOut,
        skipped,
      });
      setCurrent(attempt);
      setAttempts((list) => [...list, attempt]);
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    setCurrent(null);
    setSelected('');
    setStartedAt(Date.now());
    setIndex((value) => value + 1);
  };

  const score = useMemo(
    () => attempts.filter((item) => item.correct).length,
    [attempts],
  );

  if (done) {
    const weak = attempts.filter((item) => !item.correct && item.topic_id);
    return (
      <article className="panel question-card">
        <div className="eyebrow">Квиз</div>
        <h2>Готово. {score} из {questions.length}</h2>
        <p>
          Это не оценка личности. Это карта: где ход уже есть, а где пока дыра.
        </p>
        {weak.length > 0 ? (
          <p>Имеет смысл зайти в тему, где срывалось, а не открывать всё сразу.</p>
        ) : (
          <p>Типовые ходы держатся. Можно всё равно пройти одну тему медленно.</p>
        )}
        <div className="hero-actions">
          <Link className="btn btn-primary" href="/review">
            К разбору
          </Link>
          <Link className="btn" href="/task">
            К темам
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className="panel question-card">
      <div className="question-head">
        <div>
          <div className="eyebrow">Стартовый квиз</div>
          <h2>Один вопрос. Сначала тип, потом счёт.</h2>
        </div>
        <div className="badge">
          <span>
            {index + 1} / {questions.length}
          </span>
          {timerOn ? <span className="timer">{formatTime(seconds)}</span> : null}
        </div>
      </div>
      <div className="progress" aria-hidden="true">
        <span style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>
      <label className="timer-toggle">
        <input
          type="checkbox"
          checked={timerOn}
          onChange={(event) => setTimerOn(event.target.checked)}
        />
        Мягкий таймер. По умолчанию выключен.
      </label>
      <div className="pill-row">
        <span className="pill">{question.topic_label}</span>
        <span className="pill">{question.hint}</span>
      </div>
      <p className="prompt">{question.prompt}</p>
      <form className="options">
        {question.options.map((option, optionIndex) => (
          <label
            key={option}
            className={`option ${selected === option ? 'selected' : ''}`}
          >
            <input
              type="radio"
              name="quiz"
              value={option}
              checked={selected === option}
              disabled={Boolean(current)}
              onChange={() => setSelected(option)}
            />
            <span>
              <strong>{String.fromCharCode(1040 + optionIndex)}.</strong> {option}
            </span>
          </label>
        ))}
      </form>
      {!current ? (
        <div className="hero-actions">
          <button
            className="btn btn-primary"
            type="button"
            disabled={busy || !selected}
            onClick={() => submit(selected, false, false)}
          >
            Ответить
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
                  ? 'Пропущено. Это ход, не провал.'
                  : current.correct
                    ? 'Верно.'
                    : 'Почти.'}
            </strong>{' '}
            Правильный ответ: {current.expected}. {current.explain_ok}
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
              Дальше
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
