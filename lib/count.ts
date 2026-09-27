import count from '@/content/count.json';
import type { Support } from './types';

export type CountKind = 'decompose' | 'round' | 'complement' | 'times';

export interface CountItem {
  id: string;
  kind: CountKind;
  prompt: string;
  answer: string;
  hint: string;
}

const CARDS = count.cards as Support[];

export function getCountCards(): Support[] {
  return CARDS;
}

function rand(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

function makeDecompose(): Omit<CountItem, 'id'> {
  const a = rand(21, 78);
  const b = rand(12, 39);
  return {
    kind: 'decompose',
    prompt: `${a} + ${b}`,
    answer: String(a + b),
    hint: 'Разложи второе: десятки, потом единицы.',
  };
}

function makeRound(): Omit<CountItem, 'id'> {
  const variant = pick(['add', 'mul', 'sub'] as const);
  if (variant === 'add') {
    const base = pick([98, 99, 198, 199, 297, 298, 399]);
    const add = rand(12, 46);
    return {
      kind: 'round',
      prompt: `${base} + ${add}`,
      answer: String(base + add),
      hint: 'Округли до круглого, потом компенсируй.',
    };
  }
  if (variant === 'mul') {
    const base = pick([19, 29, 39, 49, 98, 99]);
    const n = pick([3, 4, 5, 6]);
    return {
      kind: 'round',
      prompt: `${base} × ${n}`,
      answer: String(base * n),
      hint: 'Округли, умножь, вычти лишнее.',
    };
  }
  const base = pick([102, 201, 302, 403]);
  const sub = rand(8, 27);
  return {
    kind: 'round',
    prompt: `${base} − ${sub}`,
    answer: String(base - sub),
    hint: 'Округли и компенсируй.',
  };
}

function makeComplement(): Omit<CountItem, 'id'> {
  const variant = pick(['to100', 'to10', 'minus'] as const);
  if (variant === 'to100') {
    const a = rand(11, 89);
    return {
      kind: 'complement',
      prompt: `100 − ${a}`,
      answer: String(100 - a),
      hint: 'Сколько не хватает до 100.',
    };
  }
  if (variant === 'to10') {
    const a = rand(1, 9);
    return {
      kind: 'complement',
      prompt: `10 − ${a}`,
      answer: String(10 - a),
      hint: 'Дополни до 10.',
    };
  }
  const a = rand(41, 92);
  const b = pick([8, 9, 18, 19]);
  return {
    kind: 'complement',
    prompt: `${a} − ${b}`,
    answer: String(a - b),
    hint: 'Вычти через круглое: −10 + 1, −20 + 2.',
  };
}

function makeTimes(): Omit<CountItem, 'id'> {
  const variant = pick(['x11', 'x5', 'double'] as const);
  if (variant === 'x11') {
    const a = rand(12, 39);
    return {
      kind: 'times',
      prompt: `${a} × 11`,
      answer: String(a * 11),
      hint: '×11: цифры раздвинь, в середину сумма.',
    };
  }
  if (variant === 'x5') {
    const a = rand(12, 48) * 2;
    return {
      kind: 'times',
      prompt: `${a} × 5`,
      answer: String(a * 5),
      hint: '×5: половина и ноль. Или ×10 и разделить на 2.',
    };
  }
  const a = rand(15, 48);
  return {
    kind: 'times',
    prompt: `${a} × 4`,
    answer: String(a * 4),
    hint: '×4: удвой дважды.',
  };
}

const MAKERS: Record<CountKind, () => Omit<CountItem, 'id'>> = {
  decompose: makeDecompose,
  round: makeRound,
  complement: makeComplement,
  times: makeTimes,
};

const SITTING: CountKind[] = [
  'decompose',
  'round',
  'complement',
  'times',
  'decompose',
  'round',
  'complement',
  'times',
  'decompose',
  'round',
];

export const COUNT_SITTING = SITTING.length;

export function makeCountSitting(): CountItem[] {
  return SITTING.map((kind, index) => {
    const item = MAKERS[kind]();
    return { ...item, id: `count-${index + 1}-${item.kind}` };
  });
}
