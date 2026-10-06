import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { Companion } from '@/components/Companion';
import { TheoryMarks } from '@/components/TheoryMarks';
import { TopicList } from '@/components/TopicList';
import { getLiveTopic, getLiveTopicsMeta } from '@/lib/live-content';
import { requireSession } from '@/lib/session';
import { getStudentPlan } from '@/lib/student-plan';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function TodayPage() {
  const session = await requireSession();
  const topics = await getLiveTopicsMeta();
  const plan = await getStudentPlan(session.username);
  const todayTopic = plan.todayItem
    ? await getLiveTopic(plan.todayItem.topic_id)
    : null;

  return (
    <AppShell session={session} currentPath="/">
      <section className="stack">
        <article className="panel empty-card">
          <Companion event={{ kind: 'idle' }} />
        </article>
        <article className={`panel empty-card${plan.assigned_tasks.length > 0 ? ' from-tutor' : ''}`}>
          <div className="eyebrow">Сегодня</div>
          {plan.assigned_tasks.length > 0 ? (
            <>
              <h2>
                {plan.assigned_tasks.length === 1
                  ? 'Задача от тьютора'
                  : `${plan.assigned_tasks.length} ${taskWord(plan.assigned_tasks.length)} от тьютора`}
              </h2>
              <p>
                Несколько карточек, не большая тема. Можно их пропустить, если пока не готова.
              </p>
              <ul className="week-list from-tutor-list">
                {plan.assigned_tasks.map((item) => (
                  <li key={item.task.id}>
                    <strong>{item.task.prompt}</strong>
                    <p>
                      {item.topic_title}
                      {item.task.review_title ? ` · ${item.task.review_title}` : ''}
                    </p>
                    <Link className="btn btn-primary" href={`/task/${item.task.id}`}>
                      Открыть карточку
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {!plan.quizDone ? (
            <>
              <h2>
                {plan.quizCount === 0
                  ? 'Сначала короткий квиз'
                  : `Доделай квиз: ${plan.quizCount} из ${plan.quizTotal}`}
              </h2>
              <p>
                Проходи ближайший квиз, проверь свои знания и пробелы.
              </p>
              <div className="hero-actions">
                <Link className="btn btn-primary" href="/quiz">
                  {plan.quizCount === 0 ? 'Начать квиз' : 'Продолжить квиз'}
                </Link>
              </div>
            </>
          ) : todayTopic && plan.todayItem ? (
            <>
              <p className="eyebrow">
                {plan.todayItem.minutes} минут ·{' '}
                {plan.todayItem.role === 'focus' ? 'основное' : 'повторение'}
              </p>
              <h2>{todayTopic.title}</h2>
              <p className="prompt">{todayTopic.phrase}</p>
              <p>{plan.todayItem.reason}</p>
              {plan.newTopicBlocked ? (
                <p>Новую тему на сегодня уже открывали. Это короткое повторение.</p>
              ) : null}
              <div className="hero-actions">
                <Link className="btn btn-primary" href={`/topic/${todayTopic.id}`}>
                  Начать этот шаг
                </Link>
                <Link className="btn" href={`/homework?topic=${todayTopic.id}`}>
                  Помощь с ДЗ
                </Link>
                <Link className="btn" href="/map">
                  Смотреть карту
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2>На сегодня хватит новой темы</h2>
              <p>
                Одна новая в день — чтобы не разъехаться. Можно повторить карту
                или просто остановиться.
              </p>
              <div className="hero-actions">
                <Link className="btn btn-primary" href="/map">
                  К карте
                </Link>
              </div>
            </>
          )}
        </article>

        {plan.quizDone ? (
          <article className="panel section-card">
            <div className="eyebrow">Неделя</div>
            <h2>Сейчас в работе: счёт, уравнения, треугольники</h2>
            <ul className="week-list">
              {plan.queue.map((item) => {
                const topic = topics.find((entry) => entry.id === item.topic_id);
                return (
                  <li key={`${item.role}-${item.topic_id}`}>
                    <strong>
                      {item.role === 'focus' ? 'Основное' : 'Повторение'}:{' '}
                      {topic?.title ?? item.topic_id}
                    </strong>
                    <p>{item.reason}</p>
                  </li>
                );
              })}
            </ul>
          </article>
        ) : (
          <TopicList topics={topics} />
        )}
        {plan.quizDone ? <TheoryMarks /> : null}
      </section>
    </AppShell>
  );
}

function taskWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'задачи';
  return 'задач';
}
