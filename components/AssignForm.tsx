'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { StudentPlanView } from '@/lib/student-plan';
import type { Topic } from '@/lib/types';

export function AssignForm({
  topics,
  plans,
}: {
  topics: Topic[];
  plans: StudentPlanView[];
}) {
  const router = useRouter();
  const [topicId, setTopicId] = useState(topics[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const tasks = useMemo(
    () => topics.find((topic) => topic.id === topicId)?.tasks ?? [],
    [topicId, topics],
  );

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/plan/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: String(data.get('student_id') ?? ''),
          task_id: String(data.get('task_id') ?? ''),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'Не удалось посадить');
      setMessage('Задача на экране «Сегодня» у ученика.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (studentId: string, taskId: string) => {
    setBusy(true);
    try {
      await fetch('/api/plan/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, task_id: taskId, remove: true }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="panel section-card">
      <div className="eyebrow">Очередь ученику</div>
      <h2>Посадить конкретную задачу</h2>
      <p>Не тему целиком, а одну штуку. Она всплывёт на «Сегодня», пока не решится верно.</p>
      <form className="tutor-form" onSubmit={submit}>
        <label className="field">
          <span className="eyebrow">Ученик</span>
          <select className="input-answer" name="student_id" required>
            {plans.map((plan) => (
              <option key={plan.student_id} value={plan.student_id}>
                {plan.student_id}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="eyebrow">Тема</span>
          <select
            className="input-answer"
            value={topicId}
            onChange={(event) => setTopicId(event.target.value)}
          >
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field field-wide">
          <span className="eyebrow">Задача</span>
          <select className="input-answer" name="task_id" required>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.prompt}
              </option>
            ))}
          </select>
        </label>
        <div className="hero-actions field-wide">
          <button className="btn btn-primary" type="submit" disabled={busy || tasks.length === 0}>
            {busy ? 'Сажаю...' : 'Дать ученику'}
          </button>
        </div>
        {message ? <p className="field-wide">{message}</p> : null}
      </form>
      {plans.some((plan) => plan.assigned_tasks.length > 0) ? (
        <ul className="queue-list" style={{ marginTop: '1rem' }}>
          {plans.flatMap((plan) =>
            plan.assigned_tasks.map((item) => (
              <li className="queue-row" key={`${plan.student_id}-${item.task.id}`}>
                <div>
                  <strong>{plan.student_id}</strong>
                  <p>{item.task.prompt}</p>
                </div>
                <button
                  className="btn"
                  type="button"
                  disabled={busy}
                  onClick={() => remove(plan.student_id, item.task.id)}
                >
                  Убрать
                </button>
              </li>
            )),
          )}
        </ul>
      ) : null}
    </article>
  );
}
