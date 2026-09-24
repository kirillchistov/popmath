import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { TopicList } from '@/components/TopicList';
import { getAllTopics, getTopic } from '@/lib/content';
import { requireSession } from '@/lib/session';
import { getStudentPlan } from '@/lib/student-plan';

export const runtime = 'nodejs';

export default async function TodayPage() {
  const session = await requireSession();
  const topics = getAllTopics();
  const plan = await getStudentPlan(session.username);
  const todayTopic = plan.todayItem ? getTopic(plan.todayItem.topic_id) : null;

  return (
    <AppShell session={session} currentPath="/">
      <section className="stack">
        {!plan.quizDone ? (
          <article className="panel empty-card">
            <div className="eyebrow">Сегодня</div>
            <h2>
              {plan.quizCount === 0
                ? 'Сначала короткий квиз'
                : `Доделай квиз: ${plan.quizCount} из ${plan.quizTotal}`}
            </h2>
            <p>
              Не выбирай тему из меню. 10–15 минут: узнать, где ход уже есть,
              а где пока дыра.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/quiz">
                {plan.quizCount === 0 ? 'Начать квиз' : 'Продолжить квиз'}
              </Link>
            </div>
          </article>
        ) : todayTopic && plan.todayItem ? (
          <article className="panel empty-card">
            <div className="eyebrow">
              Сегодня · {plan.todayItem.minutes} минут ·{' '}
              {plan.todayItem.role === 'focus' ? 'основное' : 'повторение'}
            </div>
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
              <Link className="btn" href="/map">
                Смотреть карту
              </Link>
            </div>
          </article>
        ) : (
          <article className="panel empty-card">
            <div className="eyebrow">Сегодня</div>
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
          </article>
        )}

        {plan.quizDone ? (
          <article className="panel section-card">
            <div className="eyebrow">Неделя</div>
            <h2>Одна основная тема, одно короткое повторение</h2>
            <ul className="week-list">
              {plan.queue.map((item) => {
                const topic = getTopic(item.topic_id);
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
      </section>
    </AppShell>
  );
}
