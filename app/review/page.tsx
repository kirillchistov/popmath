import { AppShell } from '@/components/AppShell';
import { ReviewList } from '@/components/ReviewList';
import { requireSession } from '@/lib/session';
import { listAttempts } from '@/lib/store';

export const runtime = 'nodejs';

export default async function ReviewPage() {
  const session = await requireSession();
  const attempts = (await listAttempts(session.username)).filter((item) => !item.correct);

  return (
    <AppShell session={session} currentPath="/review">
      <section className="stack">
        <article className="panel empty-card">
          <div className="eyebrow">Разбор</div>
          <h2>Как надо / как не надо</h2>
          <p>
            Здесь только твои срывы. Не рейтинг. Если тег ещё не выбран в квизе,
            его можно вспомнить по тексту ловушки.
          </p>
        </article>
        <ReviewList
          attempts={attempts}
          emptyText="Пройди квиз или одну тему — и сюда попадут места, где ход срывался."
        />
      </section>
    </AppShell>
  );
}
