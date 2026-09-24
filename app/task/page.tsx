import { AppShell } from '@/components/AppShell';
import { TopicList } from '@/components/TopicList';
import { getLiveTopicsMeta } from '@/lib/live-content';
import { requireSession } from '@/lib/session';

export const runtime = 'nodejs';

export default async function TaskPage() {
  const session = await requireSession();
  const topics = await getLiveTopicsMeta();

  return (
    <AppShell session={session} currentPath="/task">
      <section className="stack">
        <article className="panel empty-card">
          <div className="eyebrow">Темы</div>
          <h2>Выбери один остров</h2>
          <p>
            Если квиз уже есть, следующий шаг ждёт на экране «Сегодня». Здесь
            можно открыть остров вручную. Таймер включать не обязательно.
          </p>
        </article>
        <TopicList topics={topics} />
      </section>
    </AppShell>
  );
}
