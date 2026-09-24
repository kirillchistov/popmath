import type { Attempt } from '@/lib/types';

const tagLabels: Record<string, string> = {
  knowledge: 'не поняла тему',
  algorithm: 'не знала ход',
  inattention: 'знак / не дочитала',
  calculation: 'счёт',
  freeze: 'страх / ступор',
  strategy: 'стратегия',
};

const modeLabels: Record<string, string> = {
  off: 'без таймера',
  soft: 'мягкий таймер',
  exam: 'экзамен',
};

function formatElapsed(ms: number) {
  if (!ms) return 'время не записано';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} с`;
  return `${Math.floor(seconds / 60)} мин ${seconds % 60} с`;
}

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
      {attempts.map((item) => {
        const codes = item.error_codes ?? [];
        return (
          <article className="panel review-card" key={item.id}>
            <div className="eyebrow">
              {showStudent ? `${item.student_id} · ` : ''}
              {item.review_title}
              {item.correct ? ' · верно' : ' · ошибка'}
              {item.skipped ? ' · пропуск' : ''}
              {item.timed_out ? ' · время' : ''}
            </div>
            <p className="prompt">{item.prompt}</p>
            <p>
              <strong>Ответ:</strong> {item.raw_answer || 'нет ответа'} ·{' '}
              <strong>Нужно:</strong> {item.expected}
            </p>
            <p className="eyebrow">
              {formatElapsed(item.elapsed_ms)}
              {item.timer_mode ? ` · ${modeLabels[item.timer_mode] ?? item.timer_mode}` : ''}
              {item.self_checked ? ' · чеклист был' : ''}
              {codes.length > 0
                ? ` · ${codes.map((code) => tagLabels[code] ?? code).join(', ')}`
                : ''}
              {item.self_tag ? ` · тег: ${tagLabels[item.self_tag] ?? item.self_tag}` : ''}
            </p>
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
        );
      })}
    </div>
  );
}
