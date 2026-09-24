import { AppShell } from '@/components/AppShell';
import { TopicList } from '@/components/TopicList';
import { getAllTopics } from '@/lib/content';
import { requireSession } from '@/lib/session';

export default async function TaskPage() {
  const session = await requireSession();
  const topics = getAllTopics();

  return (
    <AppShell session={session} currentPath="/task">
      <section className="stack">
        <article className="panel empty-card">
          <div className="eyebrow">Темы</div>
          <h2>Выбери один остров</h2>
          <p>
            Сначала фраза и шаги, потом несколько задач. Таймер можно не включать.
            Пропустить тоже можно.
          </p>
        </article>
        <TopicList topics={topics} />
      </section>
    </AppShell>
  );
}
