'use client';

import { useEffect, useState } from 'react';
import { Companion } from './Companion';

const PLOTS = [
  {
    id: 'angles',
    title: 'Углы',
    image: '/images/geo-adjacent.svg',
    clue: 'Два угла на одной прямой. Сначала тип, потом градусы.',
  },
  {
    id: 'triangle',
    title: 'Треугольник',
    image: '/images/geo-triangle.svg',
    clue: 'Три стороны. Сумма углов 180°, если равнобедренный — основания равны.',
  },
  {
    id: 'area',
    title: 'Площадь',
    image: '/images/geo-rect-grid.svg',
    clue: 'Спрашивают «сколько места», не длину обхода.',
  },
  {
    id: 'grid',
    title: 'Клетка',
    image: '/images/geo-trap-grid.svg',
    clue: 'Числа бери с рисунка. Клетка 1×1, не дорисовывай лишнего.',
  },
  {
    id: 'circle',
    title: 'Окружность',
    image: '/images/geo-circle.svg',
    clue: 'Радиус до края. Вписанный угол — половина центрального на ту же дугу.',
  },
] as const;

export function GeoStart({ onOpen }: { onOpen: () => void }) {
  const [seconds, setSeconds] = useState(120);
  const [seen, setSeen] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const current = PLOTS.find((item) => item.id === seen);

  return (
    <article className="panel practice-card">
      <div className="question-head">
        <div>
          <div className="eyebrow">Сначала рисунок</div>
          <h2>Сначала 2 минуты на узнавание, не на счёт</h2>
        </div>
        <div className="badge">
          <span>{formatTime(seconds)}</span>
        </div>
      </div>
      <Companion event={{ kind: 'idle' }} />
      <p>
        Геометрия пугает, пока это «19 номеров». Здесь несколько сюжетов: углы,
        треугольник, площадь, клетка, окружность. Посмотри рисунок и назови тип.
      </p>
      <div className="recognize-grid">
        {PLOTS.map((plot) => (
          <button
            key={plot.id}
            type="button"
            className={`recognize-card ${seen === plot.id ? 'active' : ''}`}
            onClick={() => setSeen(plot.id)}
          >
            <img src={plot.image} alt="" />
            <strong>{plot.title}</strong>
          </button>
        ))}
      </div>
      {current ? <p className="prompt">{current.clue}</p> : null}
      <div className="hero-actions">
        <button className="btn btn-primary" type="button" onClick={onOpen}>
          {seconds === 0 || seen
            ? 'Теперь можно считать'
            : 'Поняла сюжет, к задачам'}
        </button>
      </div>
    </article>
  );
}

function formatTime(total: number) {
  const mm = String(Math.max(0, Math.floor(total / 60))).padStart(2, '0');
  const ss = String(Math.max(0, total % 60)).padStart(2, '0');
  return `${mm}:${ss}`;
}
