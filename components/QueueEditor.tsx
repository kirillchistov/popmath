'use client';

import { useState } from 'react';
import { getAllTopics } from '@/lib/content';
import { STATE_LABEL } from '@/lib/progress';
import type { StudentPlanView } from '@/lib/student-plan';

export function QueueEditor({ plans }: { plans: StudentPlanView[] }) {
  const topics = getAllTopics();
  const title = (id: string) => topics.find((topic) => topic.id === id)?.title ?? id;
  const [items, setItems] = useState(plans);
  const [saving, setSaving] = useState<string | null>(null);

  const move = (studentId: string, index: number, direction: -1 | 1) => {
    setItems((current) =>
      current.map((plan) => {
        if (plan.student_id !== studentId) return plan;
        const order = [...(plan.order.length ? plan.order : plan.progress.map((item) => item.topic_id))];
        const next = index + direction;
        if (next < 0 || next >= order.length) return plan;
        [order[index], order[next]] = [order[next], order[index]];
        return { ...plan, order };
      }),
    );
  };

  const save = async (studentId: string) => {
    const plan = items.find((item) => item.student_id === studentId);
    if (!plan) return;
    setSaving(studentId);
    try {
      const response = await fetch('/api/plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, order: plan.order }),
      });
      if (!response.ok) throw new Error('save failed');
      const data = (await response.json()) as { plan: StudentPlanView };
      setItems((current) =>
        current.map((item) => (item.student_id === studentId ? data.plan : item)),
      );
    } finally {
      setSaving(null);
    }
  };

  if (items.length === 0) {
    return <p>Пока нет учеников в когорте.</p>;
  }

  return (
    <div className="stack">
      {items.map((plan) => {
        const order =
          plan.order.length > 0
            ? plan.order
            : plan.progress.map((item) => item.topic_id);
        return (
          <article className="panel section-card" key={plan.student_id}>
            <div className="eyebrow">Очередь недели</div>
            <h2>{plan.student_id}</h2>
            <p>
              {plan.quizDone
                ? 'Квиз есть. Можно двигать приоритет тем.'
                : `Квиз ещё не закрыт: ${plan.quizCount} из ${plan.quizTotal}.`}
            </p>
            <ol className="queue-list">
              {order.map((topicId, index) => {
                const state =
                  plan.progress.find((item) => item.topic_id === topicId)?.state ??
                  'untouched';
                return (
                  <li className="queue-row" key={topicId}>
                    <div>
                      <strong>{title(topicId)}</strong>
                      <p className="eyebrow">{STATE_LABEL[state]}</p>
                    </div>
                    <div className="queue-actions">
                      <button
                        className="btn"
                        type="button"
                        disabled={index === 0}
                        onClick={() => move(plan.student_id, index, -1)}
                      >
                        Выше
                      </button>
                      <button
                        className="btn"
                        type="button"
                        disabled={index === order.length - 1}
                        onClick={() => move(plan.student_id, index, 1)}
                      >
                        Ниже
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
            <button
              className="btn btn-primary"
              type="button"
              disabled={saving === plan.student_id}
              onClick={() => save(plan.student_id)}
            >
              {saving === plan.student_id ? 'Сохраняю...' : 'Сохранить очередь'}
            </button>
          </article>
        );
      })}
    </div>
  );
}
