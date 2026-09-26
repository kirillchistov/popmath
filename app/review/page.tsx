import { AppShell } from '@/components/AppShell';
import { Companion } from '@/components/Companion';
import { ReviewList } from '@/components/ReviewList';
import { requireSession } from '@/lib/session';
import { listAttempts } from '@/lib/store';

export const runtime = 'nodejs';

export default async function ReviewPage() {
  const session = await requireSession();
  const attempts = (await listAttempts(session.username)).filter((item) => !item.correct);
  const freeze = attempts.filter((item) => item.error_codes?.includes('freeze')).length;
  const inattention = attempts.filter((item) =>
    item.error_codes?.includes('inattention'),
  ).length;

  return (
    <AppShell session={session} currentPath="/review">
      <section className="stack">
        <article className="panel empty-card">
          <div className="eyebrow">Разбор</div>
          <h2>Где обычно едет / как держится</h2>
          <Companion event={{ kind: 'idle' }} />
          <p>
            Здесь не рейтинг. Лист смотрел первым: {freeze}. Глаза убежали:{' '}
            {inattention}. Если пусто или очень долго — это тоже сигнал, не лень.
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
