export const DISCRIMINANT_FACE = {
  id: 'discriminant',
  name: 'Невыходень',
  line: 'Если D меньше нуля, он не выходит. Действительных корней нет — и это ответ.',
};

const SUPPORT_ID = 'support-quadratic';

export function supportHasDiscriminant(support: { id?: string }): boolean {
  return support.id === SUPPORT_ID;
}

export function taskHasDiscriminant(task: {
  prompt?: string;
  review_title?: string;
  tags?: string[];
}): boolean {
  if (task.tags?.includes('face-discriminant')) return true;
  const text = `${task.prompt ?? ''} ${task.review_title ?? ''}`.toLowerCase();
  return text.includes('дискриминант');
}
