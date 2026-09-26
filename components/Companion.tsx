'use client';

import { useEffect, useRef, useState } from 'react';
import { pickCompanion, type CompanionEvent, type CompanionView } from '@/lib/companion';

export function Companion({
  event,
  pop = false,
}: {
  event: CompanionEvent;
  pop?: boolean;
}) {
  const previous = useRef('');
  const key = JSON.stringify(event);
  const [view, setView] = useState<CompanionView>(() =>
    pickCompanion(event, ''),
  );

  useEffect(() => {
    const next = pickCompanion(event, previous.current);
    previous.current = next.line;
    setView(next);
    // event is represented by key to avoid identity churn
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <aside className={`companion ${pop ? 'pop' : ''}`} aria-live="polite">
      <img className="companion-face" src={view.src} alt="" />
      <p className="companion-line">
        <span className="eyebrow">{view.name}</span>
        {view.line}
      </p>
    </aside>
  );
}

export function useCompanionPop(trigger: string | null) {
  const [pop, setPop] = useState(false);
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!trigger || trigger === last.current) return;
    last.current = trigger;
    setPop(true);
    const timer = window.setTimeout(() => setPop(false), 1200);
    return () => window.clearTimeout(timer);
  }, [trigger]);

  return pop;
}
