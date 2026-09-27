'use client';

import { useState } from 'react';
import { PracticeFlow } from './PracticeFlow';
import { TopicAids } from './TopicAids';
import type { Topic, TopicState } from '@/lib/types';

export function TopicWorkspace({
  topic,
  topicState,
  solvedIds,
  limitSitting,
  onlyTaskId,
}: {
  topic: Topic;
  topicState?: TopicState;
  solvedIds?: string[];
  limitSitting?: boolean;
  onlyTaskId?: string;
}) {
  const [pulse, setPulse] = useState(0);
  const [stuck, setStuck] = useState(false);
  const [engageNonce, setEngageNonce] = useState(0);

  return (
    <>
      <TopicAids
        topic={topic}
        pulse={pulse}
        onOpen={() => {
          setStuck(false);
          setEngageNonce((value) => value + 1);
        }}
      />
      <PracticeFlow
        topic={topic}
        topicState={topicState}
        solvedIds={solvedIds}
        limitSitting={limitSitting}
        onlyTaskId={onlyTaskId}
        stuck={stuck}
        engageNonce={engageNonce}
        onStuck={() => {
          setStuck(true);
          setPulse((value) => value + 1);
        }}
        onEngaged={() => setStuck(false)}
      />
    </>
  );
}
