'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { postAttempt } from '@/lib/client-attempts';
import { needsNotebook, pickSitting } from '@/lib/focus';
import { readTimerMode, timerSeconds, writeTimerMode } from '@/lib/timer';
import { BlankStart } from './BlankStart';
import { GeoStart } from './GeoStart';
import { PauseScreen } from './PauseScreen';
import { SelfCheck, allChecksOn, toggleCheck } from './SelfCheck';
import { SelfTag } from './SelfTag';
import { TimerModeSwitch } from './TimerModeSwitch';
import type { Attempt, TimerMode, Topic, TopicState } from '@/lib/types';

export function PracticeFlow({
  topic,
  onlyTaskId,
  topicState,
  solvedIds = [],
  limitSitting = false,
}: {
  topic: Topic;
  onlyTaskId?: string;
  topicState?: TopicState;
  solvedIds?: string[];
  limitSitting?: boolean;
}) {
  const tasks = onlyTaskId
    ? topic.tasks.filter((item) => item.id === onlyTaskId)
    : limitSitting
      ? pickSitting(topic, solvedIds)
      : topic.tasks;
  const work = { ...topic, tasks: tasks.length > 0 ? tasks : topic.tasks };
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [mode, setMode] = useState<TimerMode>('off');
  const [seconds, setSeconds] = useState(work.tasks[0]?.time_sec ?? 45);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [current, setCurrent] = useState<Attempt | null>(null);
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);
  const [paused, setPaused] = useState(false);
  const [streak, setStreak] = useState(0);
  const [checks, setChecks] = useState<string[]>([]);
  const [blankOpen, setBlankOpen] = useState(
    work.id !== 'word' && work.id !== 'geometry',
  );
  const [notebookDone, setNotebookDone] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const timerArmed = useRef(false);

  const task = work.tasks[index];
  const notebook = needsNotebook(task);
  const limit = timerSeconds(task?.time_sec ?? 45, mode);

  useEffect(() => {
    setMode(readTimerMode());
  }, []);

  const changeMode = (next: TimerMode) => {
    setMode(next);
    writeTimerMode(next);
  };

  useEffect(() => {
    timerArmed.current = false;
    if (mode === 'off' || finished || current || paused || !task || !blankOpen) {
      return undefined;
    }
    setSeconds(limit);
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) timerArmed.current = true;
        return Math.max(0, value - 1);
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mode, index, current, finished, paused, task, blankOpen, limit]);

  useEffect(() => {
    if (
      timerArmed.current &&
      mode !== 'off' &&
      !current &&
      !finished &&
      !paused &&
      seconds === 0
    ) {
      timerArmed.current = false;
      void submit('', true, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, mode, current, finished, paused]);

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
        timer_mode: mode,
        self_checked: allChecksOn(checks),
        notebook_done: notebookDone,
        photo,
      });
      setCurrent(attempt);
      const nextStreak = attempt.correct ? 0 : streak + 1;
      setStreak(nextStreak);
    } finally {
      setBusy(false);
    }
  };

  const advance = () => {
    if (current && !current.correct && streak >= 3) {
      setPaused(true);
      setCurrent(null);
      setAnswer('');
      setChecks([]);
      setNotebookDone(false);
      setPhoto(null);
      return;
    }
    if (index + 1 >= work.tasks.length) {
      setFinished(true);
      return;
    }
    setCurrent(null);
    setAnswer('');
    setChecks([]);
    setNotebookDone(false);
    setPhoto(null);
    setStartedAt(Date.now());
    setIndex((value) => value + 1);
  };

  if (!blankOpen) {
    if (work.id === 'geometry') {
      return <GeoStart onOpen={() => setBlankOpen(true)} />;
    }
    return <BlankStart onOpen={() => setBlankOpen(true)} />;
  }

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

  if (finished) {
    return (
      <article className="panel practice-card">
        <div className="eyebrow">Практика</div>
        <h2>Тема пройдена без спешки</h2>
        <p>В разборе видно не только верно/неверно, но и ступор или невнимание.</p>
        <div className="hero-actions">
          <Link className="btn btn-primary" href="/review">
            К разбору
          </Link>
          <Link className="btn" href="/check">
            Самопроверка
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className={`panel practice-card ${mode === 'exam' ? 'exam-mode' : ''}`}>
      <div className="question-head">
        <div>
          <div className="eyebrow">Практика</div>
          <h3>
            Задание {index + 1} из {work.tasks.length}
          </h3>
        </div>
        <div className="badge">
          <span>{work.badge}</span>
          {mode !== 'off' ? <span className="timer">{formatTime(seconds)}</span> : null}
        </div>
      </div>
      <TimerModeSwitch mode={mode} onChange={changeMode} />
      {topicState === 'holds' && mode === 'off' ? (
        <div className="timer-suggest">
          <p>Тема уже держится. Можно включить мягкий таймер — без экзамена.</p>
          <button className="btn" type="button" onClick={() => changeMode('soft')}>
            Включить мягкий
          </button>
        </div>
      ) : null}
      {task.image ? (
        <figure className="task-figure">
          <img src={task.image} alt="" />
        </figure>
      ) : null}
      <p className="prompt">{task.prompt}</p>
      <SelfCheck
        checked={checks}
        onToggle={(id) => setChecks((value) => toggleCheck(value, id))}
      />
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
      {notebook && !current ? (
        <div className="notebook-gate">
          <label className="check-item">
            <input
              type="checkbox"
              checked={notebookDone}
              onChange={(event) => setNotebookDone(event.target.checked)}
            />
            <span>Посчитала в тетради, рукой, без калькулятора</span>
          </label>
          <label className="form-field">
            <span className="eyebrow">Фото тетради</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
            />
            <span className="timer-hint">
              {photo
                ? photo.name
                : 'Сними столбик или чертёж. Без фото «проверить» не откроется.'}
            </span>
          </label>
        </div>
      ) : null}
      {!current ? (
        <div className="hero-actions">
          <button
            className="btn btn-primary"
            type="button"
            disabled={
              busy ||
              !answer.trim() ||
              (notebook && (!notebookDone || !photo))
            }
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
            <strong>{feedbackTitle(current)}</strong> {current.explain_ok}
            {current.error_codes.length > 0 ? (
              <span>
                {' '}
                Система видит:{' '}
                {current.error_codes
                  .map((code) =>
                    code === 'freeze' ? 'ступор' : code === 'inattention' ? 'невнимание' : code,
                  )
                  .join(', ')}
                .
              </span>
            ) : null}
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
            <button className="btn btn-primary" type="button" onClick={advance}>
              Следующее
            </button>
          </div>
        </>
      )}
    </article>
  );
}

function feedbackTitle(attempt: Attempt) {
  if (attempt.timed_out) {
    return attempt.timer_mode === 'exam'
      ? 'Окно экзамена закрылось. Это тренировка, не приговор.'
      : 'Время вышло.';
  }
  if (attempt.skipped) return 'Пропущено. Можно вернуться позже.';
  return attempt.correct ? 'Верно.' : 'Есть ошибка.';
}

function formatTime(total: number) {
  const mm = String(Math.max(0, Math.floor(total / 60))).padStart(2, '0');
  const ss = String(Math.max(0, total % 60)).padStart(2, '0');
  return `${mm}:${ss}`;
}
