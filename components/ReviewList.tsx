import type { Attempt } from '@/lib/types';

const tagLabels: Record<string, string> = {
  knowledge: 'не поняла тему',
  algorithm: 'не знала ход',
  inattention: 'знак / не дочитала',
  calculation: 'счёт',
  freeze: 'страх / ступор',
  strategy: 'стратегия',
};

export function ReviewList({
  attempts,
  emptyText,
  showStudent = false,
}: {
  attempts: Attempt[];
  emptyText: string;
  showStudent?: boolean;
}) {
  if (attempts.length === 0) {
    return (
      <article className="panel empty-card">
        <div className="eyebrow">Разбор</div>
        <h2>Пока тихо</h2>
        <p>{emptyText}</p>
      </article>
    );
  }

  return (
    <div className="stack">
      {attempts.map((item) => (
        <article className="panel review-card" key={item.id}>
          <div className="eyebrow">
            {showStudent ? `${item.student_id} · ` : ''}
            {item.review_title}
            {item.correct ? ' · верно' : ' · ошибка'}
          </div>
          <p className="prompt">{item.prompt}</p>
          <p>
            <strong>Ответ:</strong> {item.raw_answer || 'нет ответа'} ·{' '}
            <strong>Нужно:</strong> {item.expected}
          </p>
          {item.self_tag ? (
            <p className="eyebrow">Тег: {tagLabels[item.self_tag] ?? item.self_tag}</p>
          ) : null}
          {!item.correct ? (
            <div className="memory-illustration">
              <div className="memory-box bad">
                <div className="eyebrow">Как не надо</div>
                <p>{item.explain_trap}</p>
              </div>
              <div className="memory-box good">
                <div className="eyebrow">Как надо</div>
                <p>{item.explain_ok}</p>
              </div>
            </div>
          ) : (
            <p>{item.explain_ok}</p>
          )}
        </article>
      ))}
    </div>
  );
}
