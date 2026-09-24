import { AppShell } from '@/components/AppShell';
import { QueueEditor } from '@/components/QueueEditor';
import { ReviewList } from '@/components/ReviewList';
import { requireRole } from '@/lib/session';
import { listAttempts } from '@/lib/store';
import { listCohortPlans } from '@/lib/student-plan';

export const runtime = 'nodejs';

export default async function TutorPage() {
  const session = await requireRole('tutor');
  const attempts = await listAttempts();
  const plans = await listCohortPlans();

  return (
    <AppShell session={session} currentPath="/tutor">
      <section className="stack">
        <article className="panel empty-card">
          <div className="eyebrow">Тьютор</div>
          <h2>Очередь недели и попытки</h2>
          <p>
            Можно сказать: на этой неделе не функции, а знаки в уравнениях.
            Ученик после квиза получает следующий шаг с экрана «Сегодня».
          </p>
        </article>
        <QueueEditor plans={plans} />
        <ReviewList
          attempts={attempts}
          showStudent
          emptyText="Пока никто не отвечал. Попросите ученика пройти квиз."
        />
      </section>
    </AppShell>
  );
}
