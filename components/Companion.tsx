'use client';

import { useEffect, useRef, useState } from 'react';
import {
  BREAK_AFTER_MS,
  COMPANION_SRCS,
  pickCompanion,
  type CompanionEvent,
  type CompanionView,
} from '@/lib/companion';

export function Companion({
  event,
  pop = false,
  busy = false,
}: {
  event: CompanionEvent;
  pop?: boolean;
  busy?: boolean;
}) {
  const previous = useRef('');
  const breakFrom = useRef(0);
  const shown: CompanionEvent = busy ? { kind: 'checking' } : event;
  const key = JSON.stringify(shown);
  const [view, setView] = useState<CompanionView>(() =>
    pickCompanion(shown, ''),
  );

  useEffect(() => {
    breakFrom.current = Date.now();
    for (const src of COMPANION_SRCS) {
      const img = new Image();
      img.src = src;
    }
  }, []);

  useEffect(() => {
    const now = Date.now();
    const breakDue =
      breakFrom.current > 0 && now - breakFrom.current >= BREAK_AFTER_MS;
    const next = pickCompanion(shown, previous.current, {
      hour: new Date(now).getHours(),
      breakDue,
    });
    if (next.mood === 'snack') breakFrom.current = now;
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
