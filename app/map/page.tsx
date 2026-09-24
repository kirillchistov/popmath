import { AppShell } from '@/components/AppShell';
import { TopicList } from '@/components/TopicList';
import { getAllTopics } from '@/lib/content';
import { requireSession } from '@/lib/session';

export default async function MapPage() {
  const session = await requireSession();
  const topics = getAllTopics();

  return (
    <AppShell session={session} currentPath="/map">
      <section className="stack">
        <article className="panel empty-card">
          <div className="eyebrow">Карта</div>
          <h2>Четыре острова, не весь кодификатор</h2>
          <p>
            Состояния «держится / шатко / не трогали» появятся на следующем этапе.
            Сейчас остров — это тема с алгоритмом и практикой.
          </p>
        </article>
        <TopicList topics={topics} />
      </section>
    </AppShell>
  );
}
