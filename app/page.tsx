import Link from 'next/link';
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
          <h2>Сначала короткий квиз, потом одна тема</h2>
          <p>
            Не весь ОГЭ сразу. 15 коротких вопросов покажут, где ход уже есть.
            Потом берём одну тему и разбираем ловушку, а не характер.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/quiz">
              Начать квиз
            </Link>
            <Link className="btn" href="/task">
              Сразу к темам
            </Link>
          </div>
        </article>
        <TopicList topics={topics} />
      </section>
    </AppShell>
  );
}
