import { AppShell } from '@/components/AppShell';
import { TopicList } from '@/components/TopicList';
import { getAllTopics } from '@/lib/content';
import { requireRole } from '@/lib/session';

export default async function TutorPage() {
  const session = await requireRole('tutor');
  const topics = getAllTopics();

  return (
    <AppShell session={session} currentPath="/tutor">
      <section className="stack">
        <article className="panel empty-card">
          <div className="eyebrow">Тьютор</div>
          <h2>Когорта появится здесь</h2>
          <p>
            Пока видны только темы из git. Список учеников, попытки и очередь —
            следующие этапы. Новые задачи пока правятся в{' '}
            <code>content/topics/</code>.
          </p>
        </article>
        <TopicList topics={topics} />
      </section>
    </AppShell>
  );
}
