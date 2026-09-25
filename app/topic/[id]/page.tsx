import { notFound } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { PracticeFlow } from '@/components/PracticeFlow';
import { SupportCards } from '@/components/SupportCards';
import { TheoryMarks } from '@/components/TheoryMarks';
import { getLiveTopic } from '@/lib/live-content';
import { todayISO } from '@/lib/plan';
import { markOpenedNewTopic } from '@/lib/plan-store';
import { requireSession } from '@/lib/session';
import { getStudentPlan } from '@/lib/student-plan';
import { listAttempts } from '@/lib/store';

export const runtime = 'nodejs';

interface TopicPageProps {
  params: Promise<{ id: string }>;
}

export default async function TopicPage({ params }: TopicPageProps) {
  const session = await requireSession();
  const { id } = await params;
  const topic = await getLiveTopic(id);
  if (!topic) notFound();

  const isStudent = session.role === 'student';
  const plan = isStudent ? await getStudentPlan(session.username) : null;
  const state = plan?.progress.find((item) => item.topic_id === topic.id)?.state;
  if (isStudent && state === 'untouched') {
    await markOpenedNewTopic(session.username, todayISO());
  }
  const solvedIds = isStudent
    ? (await listAttempts(session.username))
        .filter((item) => item.correct)
        .map((item) => item.task_id)
    : [];

  return (
    <AppShell session={session} currentPath={`/topic/${topic.id}`}>
      <section className="stack">
        <article className="panel section-card">
          <div className="eyebrow">Тема</div>
          <h2>{topic.title}</h2>
          <p className="prompt">{topic.phrase}</p>
          <p>{topic.metaphor}</p>
          {isStudent && (topic.id === 'word' || topic.id === 'equations' || topic.id === 'geometry') ? (
            <p>За заход 3–4 прототипа. Сначала тетрадь, без таймера.</p>
          ) : null}
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
        {topic.id === 'geometry' ? <TheoryMarks /> : null}
        <SupportCards supports={topic.supports} />
        <PracticeFlow
          topic={topic}
          topicState={state}
          solvedIds={solvedIds}
          limitSitting={isStudent}
        />
      </section>
    </AppShell>
  );
}
