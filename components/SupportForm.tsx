'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { TopicMeta } from '@/lib/types';

export function SupportForm({ topics }: { topics: TopicMeta[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'support',
          topic_id: String(data.get('topic_id') ?? ''),
          title: String(data.get('title') ?? ''),
          metaphor: String(data.get('metaphor') ?? ''),
          anchor: String(data.get('anchor') ?? ''),
          steps: String(data.get('steps') ?? ''),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'Не удалось сохранить');
      form.reset();
      setMessage('Опора на теме. Ученик увидит её перед практикой.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="panel section-card">
      <div className="eyebrow">Опора</div>
      <h2>3–5 шагов, метафора, якорь</h2>
      <p>Короткая карточка, не конспект. Один якорь, который можно поймать глазами.</p>
      <form className="tutor-form" onSubmit={submit}>
        <label className="field">
          <span className="eyebrow">Тема</span>
          <select className="input-answer" name="topic_id" required>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="eyebrow">Заголовок</span>
          <input className="input-answer" name="title" required />
        </label>
        <label className="field">
          <span className="eyebrow">Метафора</span>
          <input className="input-answer" name="metaphor" placeholder="Образ: весы / зеркало / переводчик" />
        </label>
        <label className="field">
          <span className="eyebrow">Якорь</span>
          <input className="input-answer" name="anchor" placeholder="Сначала тип, потом счёт" />
        </label>
        <label className="field field-wide">
          <span className="eyebrow">Шаги — каждый с новой строки, 3–5</span>
          <textarea className="input-area" name="steps" required rows={5} />
        </label>
        <div className="hero-actions field-wide">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Сохраняю...' : 'Добавить опору'}
          </button>
        </div>
        {message ? <p className="field-wide">{message}</p> : null}
      </form>
    </article>
  );
}
