'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { getCountCards } from '@/lib/count';
import type { Support, Topic } from '@/lib/types';

export function TopicAids({
  topic,
  pulse = 0,
  onOpen,
}: {
  topic: Topic;
  pulse?: number;
  onOpen?: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [glow, setGlow] = useState(false);

  useEffect(() => {
    const start = window.setTimeout(() => setGlow(true), 600);
    const stop = window.setTimeout(() => setGlow(false), 2400);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(stop);
    };
  }, []);

  useEffect(() => {
    if (pulse < 1) return undefined;
    setGlow(true);
    const stop = window.setTimeout(() => setGlow(false), 1800);
    return () => window.clearTimeout(stop);
  }, [pulse]);

  const toggle = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
    onOpen?.();
  };

  return (
    <div className={`aid-row ${glow ? 'aid-glow' : ''}`} data-accent={topic.accent}>
      <AidCard
        id="algo"
        title="Алгоритм"
        hint="Шаги решения"
        open={openId === 'algo'}
        onToggle={() => toggle('algo')}
      >
        <div className="steps">
          {topic.steps.map((step) => (
            <div className="step" key={step}>
              <div>{step}</div>
            </div>
          ))}
        </div>
      </AidCard>
      <AidCard
        id="traps"
        title="Ловушки"
        hint="Где обычно шишки-ошибки"
        open={openId === 'traps'}
        onToggle={() => toggle('traps')}
      >
        <ul className="aid-list">
          {topic.traps.map((trap) => (
            <li key={trap}>{trap}</li>
          ))}
        </ul>
      </AidCard>
      {topic.supports.length > 0 ? (
        <AidCard
          id="supports"
          title="Опоры"
          hint="Якоря и краткий разбор"
          open={openId === 'supports'}
          onToggle={() => toggle('supports')}
        >
          <div className="stack">
            {topic.supports.map((card) => (
              <SupportBlock key={card.id ?? card.title} card={card} />
            ))}
          </div>
        </AidCard>
      ) : null}
      <AidCard
        id="count"
        title="Счёт"
        hint="Приёмы в уме"
        open={openId === 'count'}
        onToggle={() => toggle('count')}
      >
        <div className="stack">
          {getCountCards().map((card) => (
            <SupportBlock key={card.id ?? card.title} card={card} />
          ))}
          <Link className="btn" href="/count">
            Потренировать 2 минуты
          </Link>
        </div>
      </AidCard>
    </div>
  );
}

export function AidCard({
  id,
  title,
  hint,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  hint: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <article className={`aid-card ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="aid-toggle"
        aria-expanded={open}
        aria-controls={`aid-${id}`}
        onClick={onToggle}
      >
        <span className="eyebrow">{title}</span>
        <span className="aid-hint">{open ? 'свернуть' : hint}</span>
      </button>
      {open ? (
        <div className="aid-body" id={`aid-${id}`}>
          {children}
        </div>
      ) : null}
    </article>
  );
}

export function SupportBlock({ card }: { card: Support }) {
  return (
    <div>
      <strong>{card.title}</strong>
      {card.metaphor ? <p className="prompt">{card.metaphor}</p> : null}
      {card.anchor ? <p>Якорь: {card.anchor}</p> : null}
      {card.steps && card.steps.length > 0 ? (
        <div className="steps">
          {card.steps.map((step) => (
            <div className="step" key={step}>
              <div>{step}</div>
            </div>
          ))}
        </div>
      ) : (
        <p>{card.body}</p>
      )}
    </div>
  );
}
