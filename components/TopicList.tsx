import type { TopicMeta } from '@/lib/types';

const symbols: Record<TopicMeta['accent'], string> = {
  eq: '=',
  ineq: '<',
  word: 'T',
  func: 'f',
};

export function TopicList({ topics }: { topics: TopicMeta[] }) {
  return (
    <div className="topic-grid">
      {topics.map((topic) => (
        <article className="topic-card" key={topic.id}>
          <div className="topic-head">
            <div>
              <h3>{topic.title}</h3>
              <p>Фраза: «{topic.phrase}»</p>
            </div>
            <div className={`topic-symbol theme-${topic.accent}`}>{symbols[topic.accent]}</div>
          </div>
          <p className="eyebrow">{topic.taskCount} задач в теме</p>
        </article>
      ))}
    </div>
  );
}
