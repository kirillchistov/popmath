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
import { Companion } from './Companion';
import { HomeworkCrop } from './HomeworkCrop';
import { SupportBlock } from './TopicAids';

type Stage = 'pick' | 'crop' | 'text' | 'work-crop';
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
  const [ready, setReady] = useState<boolean | null>(null);
  const [topicId, setTopicId] = useState(initialTopicId);
  const [stage, setStage] = useState<Stage>('pick');
  const [cropKind, setCropKind] = useState<CropKind>('problem');
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [problemBlob, setProblemBlob] = useState<Blob | null>(null);
  const [workBlob, setWorkBlob] = useState<Blob | null>(null);
  const [prompt, setPrompt] = useState('');
  const [note, setNote] = useState('');
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

  const callScan = async <T,>(
    mode: 'read' | 'algo' | 'review',
    extra?: { image?: Blob | null; work?: Blob | null; text?: string },
  ): Promise<T> => {
    const body = new FormData();
    body.append('mode', mode);
    body.append('prompt', extra?.text ?? prompt);
    if (topicId) body.append('topic_id', topicId);
    const image = extra?.image ?? problemBlob;
    const work = extra?.work ?? workBlob;
    if (image) body.append('image', image, 'problem.jpg');
    if (work) body.append('work', work, 'work.jpg');
    const response = await fetch('/api/scan', { method: 'POST', body });
    const data = (await response.json()) as T & { error?: string };
    if (!response.ok) throw new Error(data.error ?? 'Не удалось разобрать');
    return data;
  };

  const onCropped = async (blob: Blob) => {
    if (cropKind === 'work') {
      setWorkBlob(blob);
      setStage('text');
      setBusy(true);
      setError('');
      try {
        const data = await callScan<ScanReviewResult>('review', { work: blob });
        setReview(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка');
      } finally {
        setBusy(false);
      }
      return;
    }
    setProblemBlob(blob);
    setStage('text');
    setBusy(true);
    setError('');
    try {
      const data = await callScan<ScanReadResult>('read', { image: blob });
      setPrompt(data.prompt);
      setNote(
        data.readable
          ? 'Проверь текст. Потом алгоритм или фото хода.'
          : data.note || 'Не разобрала. Напиши условие сама.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
      setNote('Можно вписать условие руками.');
    } finally {
      setBusy(false);
    }
  };

  const requestAlgo = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setError('');
    setShowAnswer(false);
    try {
      const data = await callScan<ScanAlgoResult>('algo');
      setAlgo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
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
    setNote('');
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
          Не зачёт и не банк. Обрежь один номер, поправь текст, возьми ход.
          Фото уходит к модели и не пишется в попытки.
        </p>
        {ready === false ? (
          <p>Ключа модели пока нет. Тьютор добавит OPENAI_API_KEY — и можно фото.</p>
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
          <h3>Фото из учебника или тетради</h3>
          <div className="photo-actions">
            <button
              className="btn btn-primary"
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
            <button
              className="btn"
              type="button"
              onClick={() => {
                setStage('text');
                setNote('Напиши условие. Потом алгоритм или фото хода.');
              }}
            >
              Напишу сама
            </button>
          </div>
        </article>
      ) : null}

      {stage === 'text' ? (
        <article className="panel practice-card">
          <div className="eyebrow">Условие</div>
          <h3>Сначала текст, потом ход</h3>
          {note ? <p>{note}</p> : null}
          {busy ? <p>Смотрю… это не зачёт, можно подождать.</p> : null}
          <label className="field">
            <span className="eyebrow">Задача</span>
            <textarea
              className="input-area homework-prompt"
              rows={6}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Например: Реши 2x + 3 = 11"
              disabled={busy}
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="hero-actions">
            <button
              className="btn btn-primary"
              type="button"
              disabled={busy || !prompt.trim()}
              onClick={() => void requestAlgo()}
            >
              Алгоритм
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
