import Link from 'next/link';
import { STATE_LABEL } from '@/lib/progress';
import type { TopicMeta, TopicProgress } from '@/lib/types';

const symbols: Record<TopicMeta['accent'], string> = {
  eq: '=',
  ineq: '<',
  word: 'T',
  func: 'f',
};

export function TopicList({
  topics,
  progress = [],
}: {
  topics: TopicMeta[];
  progress?: TopicProgress[];
}) {
  return (
    <div className="topic-grid">
      {topics.map((topic) => {
        const state = progress.find((item) => item.topic_id === topic.id)?.state;
        return (
          <Link className="topic-card" key={topic.id} href={`/topic/${topic.id}`}>
            <div className="topic-head">
              <div>
                <h3>{topic.title}</h3>
                <p>Фраза: «{topic.phrase}»</p>
              </div>
              <div className={`topic-symbol theme-${topic.accent}`}>
                {symbols[topic.accent]}
              </div>
            </div>
            <div className="pill-row">
              {state ? <span className={`pill state-${state}`}>{STATE_LABEL[state]}</span> : null}
              <span className="eyebrow">{topic.taskCount} задач</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
