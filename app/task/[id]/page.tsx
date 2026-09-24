import { notFound } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { PracticeFlow } from '@/components/PracticeFlow';
import { SupportCards } from '@/components/SupportCards';
import { getLiveTask } from '@/lib/live-content';
import { requireSession } from '@/lib/session';

export const runtime = 'nodejs';

interface TaskPageProps {
  params: Promise<{ id: string }>;
}

export default async function AssignedTaskPage({ params }: TaskPageProps) {
  const session = await requireSession();
  const { id } = await params;
  const found = await getLiveTask(decodeURIComponent(id));
  if (!found) notFound();

  return (
    <AppShell session={session} currentPath={`/task/${found.task.id}`}>
      <section className="stack">
        <article className="panel section-card">
          <div className="eyebrow">Задача от тьютора · {found.topic.title}</div>
          <h2>{found.topic.phrase}</h2>
          <p>Одна штука, не весь остров. Можно пропустить.</p>
        </article>
        <SupportCards supports={found.topic.supports} />
        <PracticeFlow topic={found.topic} onlyTaskId={found.task.id} />
      </section>
    </AppShell>
  );
}
