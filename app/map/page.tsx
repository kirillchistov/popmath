import { AppShell } from '@/components/AppShell';
import { TopicList } from '@/components/TopicList';
import { getLiveTopicsMeta } from '@/lib/live-content';
import { requireSession } from '@/lib/session';
import { getStudentPlan } from '@/lib/student-plan';

export const runtime = 'nodejs';

export default async function MapPage() {
  const session = await requireSession();
  const topics = await getLiveTopicsMeta();
  const plan = await getStudentPlan(session.username);

  return (
    <AppShell session={session} currentPath="/map">
      <section className="stack">
        <article className="panel empty-card">
          <div className="eyebrow">Карта</div>
          <h2>Четыре острова, не весь кодификатор</h2>
          <p>
            {plan.quizDone
              ? 'Состояния уже из твоих попыток. Следующий шаг всё равно на экране «Сегодня».'
              : 'После квиза острова окрасятся: держится, шатко, дыра, не трогали.'}
          </p>
        </article>
        <TopicList topics={topics} progress={plan.progress} />
      </section>
    </AppShell>
  );
}
