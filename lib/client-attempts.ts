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
  notebook_done?: boolean;
  photo?: File | null;
}): Promise<Attempt> {
  const body = new FormData();
  body.append(
    'payload',
    JSON.stringify({
      task_id: input.task_id,
      kind: input.kind,
      raw_answer: input.raw_answer,
      elapsed_ms: input.elapsed_ms,
      timed_out: input.timed_out,
      skipped: input.skipped,
      timer_mode: input.timer_mode,
      self_checked: input.self_checked,
      notebook_done: input.notebook_done,
    }),
  );
  if (input.photo) {
    body.append('photo', input.photo);
  }
  const response = await fetch('/api/attempts', {
    method: 'POST',
    body,
  });
  if (!response.ok) {
    throw new Error('Не удалось сохранить попытку');
  }
  const data = (await response.json()) as { attempt: Attempt };
  return data.attempt;
}

export async function tagAttempt(
  id: string,
  selfTag: ErrorCode,
  asTutor = false,
): Promise<void> {
  const response = await fetch(`/api/attempts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(asTutor ? { error_code: selfTag } : { self_tag: selfTag }),
  });
  if (!response.ok) {
    throw new Error('Не удалось сохранить тег');
  }
}
