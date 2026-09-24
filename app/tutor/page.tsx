import { AppShell } from '@/components/AppShell';
import { ReviewList } from '@/components/ReviewList';
import { requireRole } from '@/lib/session';
import { listAttempts } from '@/lib/store';

export const runtime = 'nodejs';

export default async function TutorPage() {
  const session = await requireRole('tutor');
  const attempts = await listAttempts();

  return (
    <AppShell session={session} currentPath="/tutor">
      <section className="stack">
        <article className="panel empty-card">
          <div className="eyebrow">Тьютор</div>
          <h2>Попытки когорты</h2>
          <p>
            Список свежий сверху. Верные тоже видны, чтобы отличать дыру в теме
            от разовой невнимательности.
          </p>
        </article>
        <ReviewList
          attempts={attempts}
          showStudent
          emptyText="Пока никто не отвечал. Попросите ученика пройти квиз."
        />
      </section>
    </AppShell>
  );
}
