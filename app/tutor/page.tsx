import { AppShell } from '@/components/AppShell';
import { AssignForm } from '@/components/AssignForm';
import { CohortTable } from '@/components/CohortTable';
import { QueueEditor } from '@/components/QueueEditor';
import { ReviewList } from '@/components/ReviewList';
import { SupportForm } from '@/components/SupportForm';
import { TaskForm } from '@/components/TaskForm';
import { listCohortRows } from '@/lib/cohort';
import { topicToMeta } from '@/lib/content';
import { loadLiveTopics } from '@/lib/live-content';
import { requireRole } from '@/lib/session';
import { listCohortPlans } from '@/lib/student-plan';
import { listAttempts } from '@/lib/store';

export const runtime = 'nodejs';

export default async function TutorPage() {
  const session = await requireRole('tutor');
  const [attempts, plans, topics, cohort] = await Promise.all([
    listAttempts(),
    listCohortPlans(),
    loadLiveTopics(),
    listCohortRows(),
  ]);
  const metas = topics.map(topicToMeta);

  return (
    <AppShell session={session} currentPath="/tutor">
      <section className="stack">
        <article className="panel empty-card">
          <div className="eyebrow">Тьютор</div>
          <h2>Когорта, задача за несколько минут, очередь</h2>
          <p>
            Новую задачу можно добавить здесь и сразу дать ученику. Git-темы и
            admin-задачи живут в одной схеме.
          </p>
        </article>
        <article className="panel section-card">
          <div className="eyebrow">Когорта</div>
          <h2>Кто был, где дыра, какая тема недели</h2>
          <CohortTable rows={cohort} />
        </article>
        <TaskForm topics={metas} />
        <SupportForm topics={metas} />
        <AssignForm topics={topics} plans={plans} />
        <QueueEditor plans={plans} topics={metas} />
        <ReviewList
          attempts={attempts}
          showStudent
          canEditTag
          emptyText="Пока никто не отвечал. Попросите ученика пройти квиз."
        />
      </section>
    </AppShell>
  );
}
