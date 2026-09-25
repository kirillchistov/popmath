import { getDigestByToken } from '@/lib/digest-store';
import type { DigestPayload } from '@/lib/types';

export const runtime = 'nodejs';

interface DigestPageProps {
  params: Promise<{ token: string }>;
}

function DigestBlocks({ payload }: { payload: DigestPayload }) {
  return (
    <section className="stack digest-grid">
      <article className="panel section-card">
        <div className="eyebrow">Уже держится</div>
        <h2>Что не разваливается</h2>
        {payload.holds.length === 0 ? (
          <p>Пока рано говорить, что что-то уже держится. Это старт, не пустая неделя.</p>
        ) : (
          <ul className="week-list">
            {payload.holds.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.note}</p>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="panel section-card">
        <div className="eyebrow">В работе</div>
        <h2>Что даст прибавку на этой неделе</h2>
        {payload.working.length === 0 ? (
          <p>Отдельной темы в фокусе нет. Можно повторить то, что уже держится.</p>
        ) : (
          <ul className="week-list">
            {payload.working.map((item) => (
              <li key={`${item.title}-${item.note}`}>
                <strong>{item.title}</strong>
                <p>{item.note}</p>
              </li>
            ))}
          </ul>
        )}
      </article>

      {payload.theory_gaps && payload.theory_gaps.length > 0 ? (
        <article className="panel section-card">
          <div className="eyebrow">Теория 7 класса</div>
          <h2>Что пометила сама</h2>
          <ul className="week-list">
            {payload.theory_gaps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      ) : null}

      <article className="panel section-card">
        <div className="eyebrow">Тип ошибки</div>
        <h2>{payload.error_title}</h2>
        <p>{payload.error_body}</p>
        {payload.visits > 0 ? (
          <p>Заходов на этой неделе: {payload.visits}. Важнее регулярность, чем длина сидения.</p>
        ) : null}
      </article>

      <article className="panel section-card">
        <div className="eyebrow">Дома</div>
        <h2>Что помогает</h2>
        <ul className="week-list">
          {payload.do_home.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>

      <article className="panel section-card">
        <div className="eyebrow">Не делать</div>
        <h2>Что сейчас вредит</h2>
        <ul className="week-list">
          {payload.dont_home.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}

export default async function DigestPage({ params }: DigestPageProps) {
  const { token } = await params;
  const digest = await getDigestByToken(token);

  return (
    <div className="app digest-page">
      <header className="digest-head">
        <div className="eyebrow">Родителю · без входа</div>
        <h1>Недельная картина</h1>
        <p>
          Это не оценка и не готовность к ОГЭ. Коротко: что уже держится, где ход
          шатается, что делать дома и чего не делать.
        </p>
      </header>
      {digest ? (
        <>
          <p className="eyebrow">
            {digest.payload.week_label} · ссылка живёт до{' '}
            {new Date(digest.expires_at).toLocaleDateString('ru-RU')}
          </p>
          <DigestBlocks payload={digest.payload} />
        </>
      ) : (
        <article className="panel empty-card">
          <div className="eyebrow">Ссылка</div>
          <h2>Эта неделя уже недоступна</h2>
          <p>
            Срок жизни — одна–две недели. Попросите у тьютора новую ссылку. Старую
            искать в переписке не нужно.
          </p>
        </article>
      )}
    </div>
  );
}
