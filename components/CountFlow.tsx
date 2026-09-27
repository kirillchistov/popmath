'use client';

import Link from 'next/link';
import { useState } from 'react';
import { answersMatch } from '@/lib/answers';
import {
  COUNT_SITTING,
  makeCountSitting,
  type CountItem,
} from '@/lib/count';
import type { Support } from '@/lib/types';
import { Companion } from './Companion';
import { AidCard, SupportBlock } from './TopicAids';

export function CountFlow({ cards }: { cards: Support[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [items, setItems] = useState<CountItem[]>(() => makeCountSitting());
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const [wins, setWins] = useState(0);
  const [done, setDone] = useState(false);

  const item = items[index];

  const restart = () => {
    setItems(makeCountSitting());
    setIndex(0);
    setAnswer('');
    setVerdict(null);
    setWins(0);
    setDone(false);
  };

  const check = () => {
    if (!item || verdict !== null) return;
    const ok = answersMatch(answer, item.answer);
    setVerdict(ok);
    if (ok) setWins((value) => value + 1);
  };

  const next = () => {
    if (index + 1 >= items.length) {
      setDone(true);
      return;
    }
    setIndex((value) => value + 1);
    setAnswer('');
    setVerdict(null);
  };

  if (done) {
    return (
      <section className="stack">
        <CountCards cards={cards} openId={openId} onToggle={setOpenId} />
        <article className="panel practice-card">
          <div className="eyebrow">Счёт</div>
          <h2>
            {wins} из {COUNT_SITTING}. Короткий заход, не марафон.
          </h2>
          <Companion event={{ kind: 'idle' }} />
          <p>
            Это мышца, не новая тема. Можно ещё раз или вернуться к сегодняшнему
            шагу.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" type="button" onClick={restart}>
              Ещё десять
            </button>
            <Link className="btn" href="/">
              Сегодня
            </Link>
          </div>
        </article>
      </section>
    );
  }

  if (!item) return null;

  return (
    <section className="stack">
      <article className="panel empty-card">
        <div className="eyebrow">Счёт</div>
        <h2>Приёмы в уме, потом десять коротких</h2>
        <Companion event={{ kind: 'idle' }} />
        <p>
          Не остров ОГЭ. Две минуты на ход, без калькулятора и без новой темы.
        </p>
      </article>
      <CountCards cards={cards} openId={openId} onToggle={setOpenId} />
      <article className="panel practice-card">
        <div className="question-head">
          <div>
            <div className="eyebrow">
              Тренажёр · {index + 1} / {items.length}
            </div>
            <h3>Сначала приём, потом ответ</h3>
          </div>
          <div className="badge">
            <span>{wins} верно</span>
          </div>
        </div>
        <p className="prompt count-prompt">{item.prompt}</p>
        <div className="form-field" style={{ maxWidth: 420 }}>
          <label className="eyebrow" htmlFor="count-answer">
            Ответ
          </label>
          <input
            id="count-answer"
            className="input-answer"
            value={answer}
            disabled={verdict !== null}
            onChange={(event) => setAnswer(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                if (verdict === null) check();
                else next();
              }
            }}
            placeholder="Число"
          />
        </div>
        {verdict === null ? (
          <div className="hero-actions">
            <button
              className="btn btn-primary"
              type="button"
              disabled={!answer.trim()}
              onClick={check}
            >
              Проверить
            </button>
          </div>
        ) : (
          <>
            <div className={`feedback show ${verdict ? 'ok' : 'bad'}`}>
              <strong>{verdict ? 'Сошлось.' : 'Не сошлось.'}</strong>{' '}
              {verdict ? null : `Нужно ${item.answer}. ${item.hint}`}
              {verdict ? item.hint : null}
            </div>
            <div className="hero-actions">
              <button className="btn btn-primary" type="button" onClick={next}>
                {index + 1 >= items.length ? 'Готово' : 'Следующее'}
              </button>
            </div>
          </>
        )}
      </article>
    </section>
  );
}

function CountCards({
  cards,
  openId,
  onToggle,
}: {
  cards: Support[];
  openId: string | null;
  onToggle: (id: string | null) => void;
}) {
  return (
    <div className="aid-row aid-row-count" data-accent="word">
      {cards.map((card) => {
        const id = card.id ?? card.title;
        return (
          <AidCard
            key={id}
            id={id}
            title={card.title}
            hint={card.anchor ?? 'приём'}
            open={openId === id}
            onToggle={() => onToggle(openId === id ? null : id)}
          >
            <SupportBlock card={card} />
          </AidCard>
        );
      })}
    </div>
  );
}
