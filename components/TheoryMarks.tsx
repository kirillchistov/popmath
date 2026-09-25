'use client';

import { useEffect, useState } from 'react';
import type { TheoryItem, TheoryMark, TheoryMarkKind } from '@/lib/types';

const OPTIONS: { id: TheoryMarkKind; label: string }[] = [
  { id: 'remember', label: 'Помню' },
  { id: 'forgot', label: 'Не помню' },
  { id: 'question', label: 'Вопрос' },
];

export function TheoryMarks() {
  const [items, setItems] = useState<TheoryItem[]>([]);
  const [marks, setMarks] = useState<Record<string, TheoryMark>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    void fetch('/api/theory')
      .then((response) => response.json())
      .then((data: { items?: TheoryItem[]; marks?: TheoryMark[] }) => {
        setItems(data.items ?? []);
        const next: Record<string, TheoryMark> = {};
        for (const mark of data.marks ?? []) next[mark.item_id] = mark;
        setMarks(next);
      })
      .catch(() => undefined);
  }, []);

  const save = async (itemId: string, mark: TheoryMarkKind) => {
    setBusy(itemId);
    try {
      const response = await fetch('/api/theory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, mark }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as { mark: TheoryMark };
      setMarks((current) => ({ ...current, [itemId]: data.mark }));
    } finally {
      setBusy(null);
    }
  };

  if (items.length === 0) return null;

  return (
    <article className="panel section-card">
      <div className="eyebrow">Теория 7 класса</div>
      <h2>Отметь, что не помнится или непонятно</h2>
      <p>
        Сначала фокус: треугольник. Смежные и вертикальные — ниже. Разберём на
        занятии то, что пометишь.
      </p>
      <ul className="week-list theory-list">
        {items.map((item) => {
          const current = marks[item.id];
          return (
            <li key={item.id}>
              <strong>
                {item.focus ? 'Фокус · ' : 'Повтор · '}
                {item.title}
              </strong>
              <p>{item.hint}</p>
              <div className="tag-row">
                {OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`tag-btn ${current?.mark === option.id ? 'active' : ''}`}
                    disabled={busy === item.id}
                    onClick={() => save(item.id, option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
