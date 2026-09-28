'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { TopicMeta } from '@/lib/types';
import { MathKeyboard } from './MathKeyboard';

export function TaskForm({ topics }: { topics: TopicMeta[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [kbd, setKbd] = useState(0);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLInputElement>(null);

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
          kind: 'task',
          topic_id: String(data.get('topic_id') ?? ''),
          prompt: String(data.get('prompt') ?? ''),
          answer: String(data.get('answer') ?? ''),
          explain_ok: String(data.get('explain_ok') ?? ''),
          explain_trap: String(data.get('explain_trap') ?? ''),
          review_title: String(data.get('review_title') ?? ''),
          time_sec: Number(data.get('time_sec') ?? 45),
          trap_answers: String(data.get('trap_answers') ?? ''),
          image: String(data.get('image') ?? ''),
        }),
      });
      const payload = (await response.json()) as { error?: string; task?: { id: string } };
      if (!response.ok) throw new Error(payload.error ?? 'Не удалось сохранить');
      form.reset();
      setPrompt('');
      setAnswer('');
      setMessage(
        `Задача ${payload.task?.id ?? ''} сохранена. Ученик увидит её в практике темы. Чтобы карточка всплыла на «Сегодня» — посади в очередь ниже.`,
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="panel section-card">
      <div className="eyebrow">Новая задача</div>
      <h2>Условие, ответ, как надо, ловушка</h2>
      <p>
        После сохранения задача живёт в теме: ученик встретит её в практике и в
        самопроверке. Чтобы она отдельно всплыла на «Сегодня» — посади в очередь
        ниже («Дать ученику»). Список выданных виден здесь же, в блоке очереди.
      </p>
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
        <label className="field field-wide">
          <span className="eyebrow">Условие</span>
          <textarea
            ref={promptRef}
            className="input-area"
            name="prompt"
            required
            rows={3}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onFocus={() => setKbd(0)}
            onClick={() => setKbd(0)}
          />
        </label>
        <label className="field">
          <span className="eyebrow">Ответ</span>
          <input
            ref={answerRef}
            className="input-answer"
            name="answer"
            required
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            onFocus={() => setKbd(1)}
            onClick={() => setKbd(1)}
          />
        </label>
        <label className="field">
          <span className="eyebrow">Время, сек</span>
          <input className="input-answer" name="time_sec" type="number" min={15} max={300} defaultValue={45} />
        </label>
        <label className="field">
          <span className="eyebrow">Как надо</span>
          <textarea className="input-area" name="explain_ok" required rows={2} />
        </label>
        <label className="field">
          <span className="eyebrow">Ловушка / как не надо</span>
          <textarea className="input-area" name="explain_trap" required rows={2} />
        </label>
        <label className="field">
          <span className="eyebrow">Заголовок разбора</span>
          <input className="input-answer" name="review_title" />
        </label>
        <label className="field">
          <span className="eyebrow">Частые неверные ответы</span>
          <input className="input-answer" name="trap_answers" placeholder="18, -4" />
        </label>
        <label className="field field-wide">
          <span className="eyebrow">Картинка, если нужна</span>
          <input className="input-answer" name="image" placeholder="/images/geo-rect-grid.svg" />
        </label>
        <div className="field field-wide">
          <span className="eyebrow">Клавиатура — в условие или ответ</span>
          <MathKeyboard
            targets={[
              { ref: promptRef, value: prompt, onChange: setPrompt },
              { ref: answerRef, value: answer, onChange: setAnswer },
            ]}
            activeIndex={kbd}
            disabled={busy}
          />
        </div>
        <div className="hero-actions field-wide">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Сохраняю...' : 'Добавить задачу'}
          </button>
        </div>
        {message ? <p className="field-wide">{message}</p> : null}
      </form>
    </article>
  );
}
