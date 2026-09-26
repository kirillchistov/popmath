'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { postAttempt } from '@/lib/client-attempts';
import type { CompanionEvent } from '@/lib/companion';
import { readTimerMode, timerSeconds, writeTimerMode } from '@/lib/timer';
import { MEMORY_LABELS } from '@/lib/voice';
import { Companion, useCompanionPop } from './Companion';
import { PauseScreen } from './PauseScreen';
import { SelfTag } from './SelfTag';
import { TimerModeSwitch } from './TimerModeSwitch';
import type { Attempt, QuizQuestion, TimerMode } from '@/lib/types';

interface QuizFlowProps {
  questions: QuizQuestion[];
}

export function QuizFlow({ questions }: QuizFlowProps) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [mode, setMode] = useState<TimerMode>('off');
  const [seconds, setSeconds] = useState(questions[0]?.time_sec ?? 25);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [current, setCurrent] = useState<Attempt | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [busy, setBusy] = useState(false);
  const [paused, setPaused] = useState(false);
  const [streak, setStreak] = useState(0);
  const [wins, setWins] = useState(0);
  const [afterMiss, setAfterMiss] = useState(false);
  const [companionEvent, setCompanionEvent] = useState<CompanionEvent>({
    kind: 'idle',
  });
  const timerArmed = useRef(false);
  const pop = useCompanionPop(current?.id ?? null);

  const question = questions[index];
  const done = index >= questions.length;
  const limit = timerSeconds(question?.time_sec ?? 25, mode);

  useEffect(() => {
    setMode(readTimerMode());
  }, []);

  const changeMode = (next: TimerMode) => {
    setMode(next);
    writeTimerMode(next);
  };

  useEffect(() => {
    timerArmed.current = false;
    if (mode === 'off' || done || current || paused || !question) return undefined;
    setSeconds(limit);
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) timerArmed.current = true;
        return Math.max(0, value - 1);
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mode, index, current, done, paused, question, limit]);

  useEffect(() => {
    if (
      timerArmed.current &&
      mode !== 'off' &&
      !current &&
      !done &&
      !paused &&
      seconds === 0
    ) {
      timerArmed.current = false;
      void submit('', true, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, mode, current, done, paused]);

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
        timer_mode: mode,
      });
      setCurrent(attempt);
      setAttempts((list) => [...list, attempt]);
      const nextWins = attempt.correct ? wins + 1 : 0;
      setCompanionEvent({
        kind: 'result',
        attempt,
        correctStreak: nextWins,
        afterMiss: attempt.correct && afterMiss,
      });
      setWins(nextWins);
      setAfterMiss(!attempt.correct);
      setStreak(attempt.correct ? 0 : streak + 1);
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    if (current && !current.correct && streak >= 3) {
      setPaused(true);
      setCurrent(null);
      setSelected('');
      return;
    }
    setCurrent(null);
    setSelected('');
    setCompanionEvent({ kind: 'idle' });
    setStartedAt(Date.now());
    setIndex((value) => value + 1);
  };

  const score = useMemo(
    () => attempts.filter((item) => item.correct).length,
    [attempts],
  );

  if (paused) {
    return (
      <PauseScreen
        onContinue={() => {
          changeMode('off');
          setPaused(false);
          setStreak(0);
          setStartedAt(Date.now());
        }}
        onCheck={() => router.push('/check')}
        onHome={() => router.push('/')}
      />
    );
  }

  if (done) {
    const freeze = attempts.filter((item) => item.error_codes.includes('freeze')).length;
    const inattention = attempts.filter((item) =>
      item.error_codes.includes('inattention'),
    ).length;
    return (
      <article className="panel question-card">
        <div className="eyebrow">Квиз</div>
        <h2>Готово. {score} из {questions.length}</h2>
        <Companion event={{ kind: 'idle' }} />
        <p>
          Это не оценка личности. Лист смотрел первым: {freeze}. Глаза убежали:{' '}
          {inattention}.
        </p>
        <div className="hero-actions">
          <Link className="btn btn-primary" href="/">
            Что сегодня
          </Link>
          <Link className="btn" href="/review">
            К разбору
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className={`panel question-card ${mode === 'exam' ? 'exam-mode' : ''}`}>
      <div className="question-head">
        <div>
          <div className="eyebrow">Стартовый квиз</div>
          <h2>Один вопрос. Сначала тип, потом счёт.</h2>
        </div>
        <div className="badge">
          <span>
            {index + 1} / {questions.length}
          </span>
          {mode !== 'off' ? <span className="timer">{formatTime(seconds)}</span> : null}
        </div>
      </div>
      <div className="progress" aria-hidden="true">
        <span style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>
      <Companion event={companionEvent} pop={pop} />
      <TimerModeSwitch mode={mode} onChange={changeMode} />
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
                  ? 'Пропуск. Пустой лист — тоже ход.'
                  : current.correct
                    ? 'Сошлось.'
                    : 'Не сошлось.'}
            </strong>{' '}
            {current.correct ? (
              <>
                Ответ: {current.expected}. {current.explain_ok}
              </>
            ) : current.skipped ? null : (
              <>Ответ: {current.expected}.</>
            )}
          </div>
          {!current.correct && !current.skipped ? (
            <>
              <div className="memory-illustration">
                <div className="memory-box bad">
                  <div className="eyebrow">{MEMORY_LABELS.trap}</div>
                  <p>{current.explain_trap}</p>
                </div>
                <div className="memory-box good">
                  <div className="eyebrow">{MEMORY_LABELS.hold}</div>
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
