'use client';

export function PauseScreen({
  onContinue,
  onCheck,
  onHome,
}: {
  onContinue: () => void;
  onCheck: () => void;
  onHome: () => void;
}) {
  return (
    <article className="panel practice-card">
      <div className="eyebrow">Пауза</div>
      <h2>Три срыва подряд — не характер, а перегруз</h2>
      <p>
        Сейчас лучше не биться головой о ту же задачу. Можно переключиться на
        самопроверку или просто остановиться.
      </p>
      <div className="hero-actions">
        <button className="btn btn-primary" type="button" onClick={onCheck}>
          Тренировать самопроверку
        </button>
        <button className="btn" type="button" onClick={onContinue}>
          Продолжить без таймера
        </button>
        <button className="btn" type="button" onClick={onHome}>
          На сегодня хватит
        </button>
      </div>
    </article>
  );
}
