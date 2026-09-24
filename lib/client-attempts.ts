import type { Attempt, ErrorCode, TaskKind, TimerMode } from './types';

export async function postAttempt(input: {
  task_id: string;
  kind: TaskKind;
  raw_answer: string;
  elapsed_ms: number;
  timed_out?: boolean;
  skipped?: boolean;
  timer_mode?: TimerMode;
  self_checked?: boolean;
}): Promise<Attempt> {
  const response = await fetch('/api/attempts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error('Не удалось сохранить попытку');
  }
  const data = (await response.json()) as { attempt: Attempt };
  return data.attempt;
}

export async function tagAttempt(id: string, selfTag: ErrorCode): Promise<void> {
  const response = await fetch(`/api/attempts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ self_tag: selfTag }),
  });
  if (!response.ok) {
    throw new Error('Не удалось сохранить тег');
  }
}
