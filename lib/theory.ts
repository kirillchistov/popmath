import theory from '@/content/theory-7.json';
import type { TheoryItem } from './types';

export function getTheoryItems(): TheoryItem[] {
  return [...(theory as TheoryItem[])].sort((left, right) => {
    if (left.focus === right.focus) return 0;
    return left.focus ? -1 : 1;
  });
}

export function getTheoryItem(id: string): TheoryItem | undefined {
  return getTheoryItems().find((item) => item.id === id);
}
