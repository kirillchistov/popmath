import { notFound } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { PracticeFlow } from '@/components/PracticeFlow';
import { getTopic } from '@/lib/content';
import { requireSession } from '@/lib/session';

interface TopicPageProps {
  params: Promise<{ id: string }>;
}

export default async function TopicPage({ params }: TopicPageProps) {
  const session = await requireSession();
  const { id } = await params;
  const topic = getTopic(id);
  if (!topic) notFound();

  return (
    <AppShell session={session} currentPath={`/topic/${topic.id}`}>
      <section className="stack">
        <article className="panel section-card">
          <div className="eyebrow">Тема</div>
          <h2>{topic.title}</h2>
          <p className="prompt">{topic.phrase}</p>
          <p>{topic.metaphor}</p>
          <div className="algorithm">
            <section>
              <div className="eyebrow">Карточка-алгоритм</div>
              <div className="steps">
                {topic.steps.map((step) => (
                  <div className="step" key={step}>
                    <div>{step}</div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <div className="eyebrow">Ловушки</div>
              <div className="stack" style={{ marginTop: '1rem' }}>
                {topic.traps.map((trap) => (
                  <div className="topic-card" key={trap}>
                    <strong>{trap}</strong>
                    <p>Поймай это место глазами до того, как начал считать.</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </article>
        <PracticeFlow topic={topic} />
      </section>
    </AppShell>
  );
}
