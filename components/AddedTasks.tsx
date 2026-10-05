'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { TutorTaskCard } from '@/lib/tutor-tasks';

export function AddedTasks({ cards }: { cards: TutorTaskCard[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const assign = async (studentId: string, taskId: string, remove: boolean) => {
    setBusy(`${studentId}:${taskId}`);
    setMessage('');
    try {
      const response = await fetch('/api/plan/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, task_id: taskId, remove }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'Не удалось обновить');
      setMessage(remove ? 'Убрала с «Сегодня».' : 'Карточка на «Сегодня» у ученика.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ошибка');
    } finally {
      setBusy(null);
    }
  };

  return (
    <article className="panel section-card">
      <div className="eyebrow">Карточки</div>
      <h2>Задачи, которые ты добавила</h2>
      <p>
        Здесь сами карточки: условие, ответ, как надо. Очередь ниже — только
        порядок тем, не эти задачи.
      </p>
      {cards.length === 0 ? (
        <p>Пока пусто. Новая задача из формы выше появится карточкой здесь.</p>
      ) : (
        <div className="stack">
          {cards.map((card) => (
            <article className="panel review-card" key={card.task.id}>
              <div className="eyebrow">
                {card.topic_title}
                {card.task.review_title ? ` · ${card.task.review_title}` : ''}
              </div>
              <p className="prompt">{card.task.prompt}</p>
              <p>
                <strong>Ответ:</strong> {card.task.answer}
              </p>
              <div className="memory-illustration">
                <div className="memory-box good">
                  <div className="eyebrow">Как надо</div>
                  <p>{card.task.explain_ok}</p>
                </div>
                <div className="memory-box bad">
                  <div className="eyebrow">Как не надо</div>
                  <p>{card.task.explain_trap}</p>
                </div>
              </div>
              <ul className="queue-list">
                {card.placements.map((place) => {
                  const key = `${place.student_id}:${card.task.id}`;
                  const onToday = place.on_today && !place.solved;
                  return (
                    <li className="queue-row" key={place.student_id}>
                      <div>
                        <strong>{place.student_id}</strong>
                        <p>
                          {place.solved
                            ? 'Уже есть верный ответ, на «Сегодня» не висит.'
                            : onToday
                              ? 'Стоит на «Сегодня».'
                              : 'Ученику на «Сегодня» ещё не выдана.'}
                        </p>
                      </div>
                      {place.solved ? null : (
                        <button
                          className="btn"
                          type="button"
                          disabled={busy === key}
                          onClick={() =>
                            assign(place.student_id, card.task.id, onToday)
                          }
                        >
                          {onToday ? 'Убрать' : 'Дать на «Сегодня»'}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className="hero-actions">
                <Link className="btn btn-primary" href={`/task/${card.task.id}`}>
                  Открыть как у ученика
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
      {message ? <p>{message}</p> : null}
    </article>
  );
}
