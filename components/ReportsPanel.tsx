import { listReports } from '@/lib/reports-store';

export async function ReportsPanel() {
  const reports = await listReports();
  return (
    <article className="panel section-card">
      <div className="eyebrow">Журнал ошибок тренажёра</div>
      <h2>Что ученица пометила как сбой проверки</h2>
      {reports.length === 0 ? (
        <p>Пока пусто. Кнопка «В тренажёре ошибка» пишет сюда и на почту админа, если задан ADMIN_EMAIL.</p>
      ) : (
        <ul className="week-list">
          {reports.map((item) => (
            <li key={item.id}>
              <strong>
                {item.student_id} · {item.task_id}
                {item.emailed ? ' · письмо ушло' : ''}
              </strong>
              <p>{item.prompt}</p>
              <p>
                Ответ: {item.raw_answer || 'нет'} · канон: {item.expected}
              </p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
