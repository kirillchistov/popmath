import { AppShell } from '@/components/AppShell';
import { TopicList } from '@/components/TopicList';
import { getAllTopics } from '@/lib/content';
import { requireSession } from '@/lib/session';

export default async function TodayPage() {
  const session = await requireSession();
  const topics = getAllTopics();

  return (
    <AppShell session={session} currentPath="/">
      <section className="stack">
        <article className="panel empty-card">
          <div className="eyebrow">Сегодня</div>
          <h2>Пока без задачи дня</h2>
          <p>
            Здесь появится один ближайший шаг на 10–15 минут. Сейчас каркас готов:
            четыре темы уже читаются из JSON.
          </p>
        </article>
        <TopicList topics={topics} />
      </section>
    </AppShell>
  );
}
