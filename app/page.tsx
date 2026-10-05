import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { Companion } from '@/components/Companion';
import { TheoryMarks } from '@/components/TheoryMarks';
import { TopicList } from '@/components/TopicList';
import { getLiveTopic, getLiveTopicsMeta } from '@/lib/live-content';
import { requireSession } from '@/lib/session';
import { getStudentPlan } from '@/lib/student-plan';

export const runtime = 'nodejs';

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
        {plan.assigned_tasks.length > 0 ? (
          <article className="panel empty-card from-tutor">
            <div className="eyebrow">От тьютора · привет</div>
            <h2>
              {plan.assigned_tasks.length === 1
                ? 'Задача с урока'
                : `${plan.assigned_tasks.length} задачи с урока`}
            </h2>
            <p>
              Это не весь раздел. Тьютор положила конкретную тему сюда, на
              «Сегодня». Можно пропустить. Пустой ответ — тоже ответ.
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
                    Открыть эту
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        ) : null}

        {!plan.quizDone ? (
          <article className="panel empty-card">
            <div className="eyebrow">Сегодня</div>
            <h2>
              {plan.quizCount === 0
                ? 'Сначала короткий квиз'
                : `Доделай квиз: ${plan.quizCount} из ${plan.quizTotal}`}
            </h2>
            <p>
              Не выбирай тему из меню. 10–15 минут: узнать, где знаний свет,
              а где пока темно.
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
              <Link className="btn" href={`/homework?topic=${todayTopic.id}`}>
                Помощь с ДЗ
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
