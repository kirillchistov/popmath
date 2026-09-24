import { ERROR_LABEL, type CohortRow } from '@/lib/cohort';

function formatWhen(value: string | null) {
  if (!value) return 'ещё не заходила';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CohortTable({ rows }: { rows: CohortRow[] }) {
  if (rows.length === 0) {
    return <p>В когорте пока никого нет.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="cohort-table">
        <thead>
          <tr>
            <th>Ученик</th>
            <th>Активность</th>
            <th>За неделю</th>
            <th>Тип ошибки</th>
            <th>Тема недели</th>
            <th>Задачи</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.student_id}>
              <td>
                <strong>{row.student_id}</strong>
                <p className="eyebrow">
                  {row.quiz_done ? 'квиз есть' : 'квиз не закрыт'}
                </p>
              </td>
              <td>{formatWhen(row.last_at)}</td>
              <td>{row.week_attempts}</td>
              <td>
                {row.dominant_error
                  ? ERROR_LABEL[row.dominant_error]
                  : row.dominant_error_label}
              </td>
              <td>{row.week_topic_title}</td>
              <td>{row.assigned_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
