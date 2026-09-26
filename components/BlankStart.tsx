'use client';

import { Companion } from './Companion';

export function BlankStart({ onOpen }: { onOpen: () => void }) {
  return (
    <article className="panel practice-card">
      <div className="eyebrow">Пустой лист</div>
      <h2>Сначала 20 секунд на выписать, не на ответ</h2>
      <Companion event={{ kind: 'idle' }} />
      <p>
        Текстовая задача пугает, пока она «стена из слов». Выпиши три строки —
        и она станет схемой.
      </p>
      <div className="steps">
        <div className="step">
          <div>Что известно: числа и единицы.</div>
        </div>
        <div className="step">
          <div>Что найти: одна короткая фраза.</div>
        </div>
        <div className="step">
          <div>Схема: цена × число, путь = скорость × время, доля от целого.</div>
        </div>
        <div className="step">
          <div>План или таблица — сначала ярлыки и единицы, потом один вопрос.</div>
        </div>
      </div>
      <div className="hero-actions">
        <button className="btn btn-primary" type="button" onClick={onOpen}>
          Открыть задачу
        </button>
      </div>
    </article>
  );
}
