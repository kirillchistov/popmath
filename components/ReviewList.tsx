import { TutorTag } from './TutorTag';
import { MEMORY_LABELS, STUDENT_TAG_LABELS, TUTOR_TAG_LABELS } from '@/lib/voice';
import type { Attempt, ErrorCode } from '@/lib/types';

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
  canEditTag = false,
  audience = 'student',
}: {
  attempts: Attempt[];
  emptyText: string;
  showStudent?: boolean;
  canEditTag?: boolean;
  audience?: 'student' | 'tutor';
}) {
  const tags = audience === 'tutor' ? TUTOR_TAG_LABELS : STUDENT_TAG_LABELS;
  const trapLabel = audience === 'tutor' ? 'Как не надо' : MEMORY_LABELS.trap;
  const holdLabel = audience === 'tutor' ? 'Как надо' : MEMORY_LABELS.hold;
  const okMark = audience === 'tutor' ? 'верно' : 'сошлось';
  const missMark = audience === 'tutor' ? 'ошибка' : 'не сошлось';

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
              {item.correct ? ` · ${okMark}` : ` · ${missMark}`}
              {item.skipped ? ' · пропуск' : ''}
              {item.timed_out ? ' · время' : ''}
            </div>
            <p className="prompt">{item.prompt}</p>
            {item.photo_path ? (
              <figure className="review-photo">
                <img src={item.photo_path} alt="Тетрадь" />
              </figure>
            ) : null}
            <p>
              <strong>Ответ:</strong> {item.raw_answer || 'нет ответа'} ·{' '}
              <strong>Нужно:</strong> {item.expected}
            </p>
            <p className="eyebrow">
              {formatElapsed(item.elapsed_ms)}
              {item.timer_mode ? ` · ${modeLabels[item.timer_mode] ?? item.timer_mode}` : ''}
              {item.self_checked ? ' · чеклист был' : ''}
              {codes.length > 0
                ? ` · ${codes.map((code) => tags[code as ErrorCode] ?? code).join(', ')}`
                : ''}
              {item.self_tag ? ` · тег: ${tags[item.self_tag] ?? item.self_tag}` : ''}
            </p>
            {!item.correct ? (
              <div className="memory-illustration">
                <div className="memory-box bad">
                  <div className="eyebrow">{trapLabel}</div>
                  <p>{item.explain_trap}</p>
                </div>
                <div className="memory-box good">
                  <div className="eyebrow">{holdLabel}</div>
                  <p>{item.explain_ok}</p>
                </div>
              </div>
            ) : (
              <p>{item.explain_ok}</p>
            )}
            {canEditTag ? (
              <TutorTag attemptId={item.id} current={item.self_tag} />
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
