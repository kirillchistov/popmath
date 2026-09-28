'use client';

import { useEffect, useRef, useState } from 'react';
import { STUDENT_TAG_LABELS } from '@/lib/voice';
import type {
  ScanAlgoResult,
  ScanReadResult,
  ScanReviewResult,
  ScanTopicHint,
} from '@/lib/scan';
import type { ErrorCode } from '@/lib/types';
import { AliceHint } from './AliceHint';
import { Companion } from './Companion';
import { HomeworkCrop } from './HomeworkCrop';
import { MathKeyboard } from './MathKeyboard';
import { SupportBlock } from './TopicAids';
import { WorkSteps } from './WorkSteps';

type Stage = 'pick' | 'crop' | 'text';
type CropKind = 'problem' | 'work';

export function HomeworkFlow({
  topics,
  initialTopicId = '',
}: {
  topics: ScanTopicHint[];
  initialTopicId?: string;
}) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const workRef = useRef<HTMLTextAreaElement>(null);
  const [ready, setReady] = useState<boolean | null>(null);
  const [topicId, setTopicId] = useState(initialTopicId);
  const [stage, setStage] = useState<Stage>('pick');
  const [cropKind, setCropKind] = useState<CropKind>('problem');
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [problemBlob, setProblemBlob] = useState<Blob | null>(null);
  const [workBlob, setWorkBlob] = useState<Blob | null>(null);
  const [prompt, setPrompt] = useState('');
  const [workSteps, setWorkSteps] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [kbd, setKbd] = useState(0);
  const [note, setNote] = useState('');
  const [aliceKind, setAliceKind] = useState<'problem' | 'work' | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [algo, setAlgo] = useState<ScanAlgoResult | null>(null);
  const [review, setReview] = useState<ScanReviewResult | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetch('/api/scan')
      .then((response) => response.json())
      .then((data: { ready?: boolean }) => setReady(Boolean(data.ready)))
      .catch(() => setReady(false));
  }, []);

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  const pickFile = (files: FileList | null, kind: CropKind) => {
    const file = files?.[0];
    if (!file) return;
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    setSourceUrl(URL.createObjectURL(file));
    setCropKind(kind);
    setStage('crop');
    setError('');
    if (galleryRef.current) galleryRef.current.value = '';
    if (cameraRef.current) cameraRef.current.value = '';
  };

  const workText = [...workSteps, draft]
    .map((step) => step.trim())
    .filter(Boolean)
    .join('\n');
  const topicHint = topics.find((item) => item.id === topicId);

  const callScan = async <T,>(
    mode: 'read' | 'algo' | 'review',
    extra?: {
      image?: Blob | null;
      work?: Blob | null;
      text?: string;
      workText?: string;
    },
  ): Promise<T> => {
    const body = new FormData();
    body.append('mode', mode);
    body.append('prompt', extra?.text ?? prompt);
    body.append('work_text', extra?.workText ?? workText);
    if (topicId) body.append('topic_id', topicId);
    if (mode === 'read') {
      const image = extra?.image ?? problemBlob;
      if (image) body.append('image', image, 'problem.jpg');
    }
    const response = await fetch('/api/scan', { method: 'POST', body });
    const data = (await response.json()) as T & { error?: string };
    if (!response.ok) throw new Error(data.error ?? 'Не удалось разобрать');
    return data;
  };

  const onCropped = async (blob: Blob) => {
    if (cropKind === 'work') {
      setWorkBlob(blob);
      setStage('text');
      setAliceKind('work');
      setNote(
        'Фото хода оставила как запас. Набери шаги текстом — так надёжнее, чем ждать разбор картинки.',
      );
      return;
    }
    setProblemBlob(blob);
    setStage('text');
    setBusy(true);
    setError('');
    setAliceKind(null);
    try {
      const data = await callScan<ScanReadResult>('read', { image: blob });
      setPrompt(data.prompt);
      if (!data.readable || !data.prompt.trim()) {
        setAliceKind('problem');
        setNote(
          data.note ||
            'Не разобрала. Напиши условие сама — можно с клавиатуры или из Алисы.',
        );
        return;
      }
      setNote('Проверь текст. Потом алгоритм или свой ход по шагам.');
    } catch (err) {
      setAliceKind('problem');
      setError(err instanceof Error ? err.message : 'Ошибка');
      setNote('Можно вписать условие руками.');
    } finally {
      setBusy(false);
    }
  };

  const requestAlgo = async () => {
    if (!prompt.trim() || busy) return;
    setShowHint(true);
    setShowAnswer(false);
    setBusy(true);
    setError('');
    try {
      const data = await callScan<ScanAlgoResult>('algo');
      setAlgo(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Модель промолчала. Шаги темы выше — можно опереться на них.',
      );
    } finally {
      setBusy(false);
    }
  };

  const requestReview = async () => {
    if (!prompt.trim() || busy) return;
    if (!workText.trim()) {
      setAliceKind('work');
      setNote('Набери шаги текстом — фото хода модель сейчас не читает.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data = await callScan<ScanReviewResult>('review');
      setReview(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка';
      setError(message);
      setAliceKind('work');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    setSourceUrl(null);
    setProblemBlob(null);
    setWorkBlob(null);
    setPrompt('');
    setWorkSteps([]);
    setDraft('');
    setKbd(0);
    setNote('');
    setAliceKind(null);
    setShowHint(false);
    setAlgo(null);
    setReview(null);
    setShowAnswer(false);
    setError('');
    setCropKind('problem');
    setStage('pick');
  };

  const reviewCode = review?.review.error_code;
  const reviewLabel =
    reviewCode && reviewCode !== 'none'
      ? STUDENT_TAG_LABELS[reviewCode as ErrorCode]
      : null;

  return (
    <section className="stack">
      <article className="panel empty-card">
        <div className="eyebrow">Домашка</div>
        <h2>Помощь с ДЗ по теме</h2>
        <Companion event={{ kind: 'idle' }} />
        <p>
          Не зачёт и не банк. Набери условие и ход по шагам. Фото можно, но
          модель часто молчит — тогда Алиса или руки.
        </p>
        {ready === false ? (
          <p>Ключа модели пока нет. Тьютор добавит ключ Яндекс AI Studio — и можно фото.</p>
        ) : null}
        <label className="field">
          <span className="eyebrow">Тема, если понятно</span>
          <select
            className="input-answer"
            value={topicId}
            onChange={(event) => setTopicId(event.target.value)}
          >
            <option value="">Сама определит</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.title}
              </option>
            ))}
          </select>
        </label>
      </article>

      {stage === 'crop' && sourceUrl ? (
        <HomeworkCrop
          src={sourceUrl}
          title={
            cropKind === 'work'
              ? 'Обрежь свой ход'
              : 'Обрежь одну задачу'
          }
          onCancel={() => {
            if (sourceUrl) URL.revokeObjectURL(sourceUrl);
            setSourceUrl(null);
            setStage(cropKind === 'work' ? 'text' : 'pick');
          }}
          onConfirm={(blob) => void onCropped(blob)}
        />
      ) : null}

      {stage === 'pick' ? (
        <article className="panel practice-card">
          <div className="eyebrow">Страница</div>
          <h3>Сначала текст</h3>
          <p>
            Клавиатура и шаги надёжнее фото. Если есть снимок — можно
            распознать в Алисе и вставить сюда.
          </p>
          <div className="photo-actions">
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                setStage('text');
                setNote(
                  'Напиши условие. Ход — по шагам. Алгоритм можно просить в любой момент.',
                );
              }}
            >
              Напишу сама
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setCropKind('problem');
                galleryRef.current?.click();
              }}
            >
              Загрузить фото
            </button>
            <button
              className="btn photo-camera"
              type="button"
              onClick={() => {
                setCropKind('problem');
                cameraRef.current?.click();
              }}
            >
              Снять
            </button>
            <a
              className="btn"
              href="https://alice.yandex.ru/"
              target="_blank"
              rel="noreferrer"
            >
              Распознать в Алисе
            </a>
          </div>
        </article>
      ) : null}

      {stage === 'text' ? (
        <article className="panel practice-card">
          <div className="eyebrow">Условие</div>
          <h3>Сначала текст, потом ход</h3>
          {note ? <p>{note}</p> : null}
          {aliceKind ? <AliceHint kind={aliceKind} /> : null}
          {workBlob ? (
            <p className="timer-hint">
              Фото хода осталось на эту сессию. Проверяем текст шагов, не
              картинку.
            </p>
          ) : null}
          {busy ? <p>Смотрю… это не зачёт, можно подождать.</p> : null}
          <label className="field">
            <span className="eyebrow">Задача</span>
            <textarea
              ref={promptRef}
              className="input-area homework-prompt"
              rows={5}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onFocus={() => setKbd(0)}
              onClick={() => setKbd(0)}
              placeholder="Например: Реши 2x + 3 = 11"
              disabled={busy}
            />
          </label>
          <WorkSteps
            steps={workSteps}
            draft={draft}
            onChangeSteps={setWorkSteps}
            onChangeDraft={setDraft}
            draftRef={workRef}
            onFocusDraft={() => setKbd(1)}
            disabled={busy}
          />
          <MathKeyboard
            targets={[
              { ref: promptRef, value: prompt, onChange: setPrompt },
              { ref: workRef, value: draft, onChange: setDraft },
            ]}
            activeIndex={kbd}
            disabled={busy}
          />
          <p className="timer-hint">
            Клавиатура пишет в задачу или в текущий шаг.
          </p>
          {showHint && topicHint ? (
            <div className="alice-hint">
              <p className="eyebrow">Подсказка алгоритма</p>
              <div className="steps">
                {topicHint.steps.map((step) => (
                  <div className="step" key={step}>
                    <div>{step}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {showHint && !topicHint ? (
            <p>Выбери тему сверху — покажу шаги без модели.</p>
          ) : null}
          {error ? <p className="form-error">{error}</p> : null}
          <div className="hero-actions">
            <button
              className="btn"
              type="button"
              disabled={busy}
              onClick={() => setShowHint((value) => !value)}
            >
              {showHint ? 'Скрыть алгоритм' : 'Подсказка алгоритма'}
            </button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={busy || !prompt.trim()}
              onClick={() => void requestAlgo()}
            >
              Алгоритм под эту задачу
            </button>
            <button
              className="btn"
              type="button"
              disabled={busy || !prompt.trim() || !workText}
              onClick={() => void requestReview()}
            >
              Проверить ход
            </button>
            <button
              className="btn"
              type="button"
              disabled={busy || !prompt.trim()}
              onClick={() => {
                setCropKind('work');
                galleryRef.current?.click();
              }}
            >
              Фото моего хода
            </button>
            <button
              className="btn photo-camera"
              type="button"
              disabled={busy || !prompt.trim()}
              onClick={() => {
                setCropKind('work');
                cameraRef.current?.click();
              }}
            >
              Снять ход
            </button>
            <button className="btn btn-ghost" type="button" onClick={reset}>
              Другая задача
            </button>
          </div>
        </article>
      ) : null}

      {algo ? (
        <article className="panel section-card">
          <div className="eyebrow">Ход</div>
          <SupportBlock card={algo.support} />
          {algo.answer ? (
            <div>
              {showAnswer ? (
                <p>
                  <strong>Ответ условия:</strong> {algo.answer}
                </p>
              ) : (
                <button
                  className="btn"
                  type="button"
                  onClick={() => setShowAnswer(true)}
                >
                  Показать ответ
                </button>
              )}
            </div>
          ) : null}
        </article>
      ) : null}

      {algo?.similar.prompt ? (
        <article className="panel section-card">
          <div className="eyebrow">Близкий пример</div>
          <h3>{algo.similar.prompt}</h3>
          {algo.similar.hint ? <p>Якорь: {algo.similar.hint}</p> : null}
          <p>
            <strong>Ответ примера:</strong> {algo.similar.answer}
          </p>
        </article>
      ) : null}

      {review ? (
        <article className="panel section-card">
          <div className="eyebrow">По твоему ходу</div>
          <h3>{review.review.title}</h3>
          {reviewLabel ? <p>Похоже на: {reviewLabel}.</p> : null}
          {review.review.error_code === 'none' ? (
            <p>Ход на месте. Это не оценка, просто взгляд.</p>
          ) : null}
          <p>{review.review.body}</p>
          {review.review.next_step ? (
            <p className="prompt">{review.review.next_step}</p>
          ) : null}
          {review.support ? <SupportBlock card={review.support} /> : null}
        </article>
      ) : null}

      <input
        ref={galleryRef}
        className="visually-hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) =>
          pickFile(event.target.files, cropKind === 'work' ? 'work' : 'problem')
        }
      />
      <input
        ref={cameraRef}
        className="visually-hidden"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(event) => pickFile(event.target.files, cropKind)}
      />
    </section>
  );
}
