'use client';

import { useRef, type RefObject } from 'react';

interface MathKey {
  label: string;
  insert?: string;
  cursor?: number;
  action?: 'backspace';
}

interface MathTarget {
  ref: RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
  value: string;
  onChange: (next: string) => void;
}

const ROWS: MathKey[][] = [
  [
    { label: '7', insert: '7' },
    { label: '8', insert: '8' },
    { label: '9', insert: '9' },
    { label: '+', insert: '+' },
    { label: '−', insert: '−' },
    { label: '×', insert: '×' },
  ],
  [
    { label: '4', insert: '4' },
    { label: '5', insert: '5' },
    { label: '6', insert: '6' },
    { label: '÷', insert: '÷' },
    { label: '=', insert: '=' },
    { label: '≠', insert: '≠' },
  ],
  [
    { label: '1', insert: '1' },
    { label: '2', insert: '2' },
    { label: '3', insert: '3' },
    { label: '(', insert: '(' },
    { label: ')', insert: ')' },
    { label: '/', insert: '/' },
  ],
  [
    { label: '0', insert: '0' },
    { label: ',', insert: ',' },
    { label: '.', insert: '.' },
    { label: 'x', insert: 'x' },
    { label: 'y', insert: 'y' },
    { label: '←', action: 'backspace' },
  ],
  [
    { label: 'x²', insert: '²' },
    { label: 'x³', insert: '³' },
    { label: 'xⁿ', insert: '^' },
    { label: '√', insert: '√()', cursor: -1 },
    { label: 'π', insert: 'π' },
    { label: '±', insert: '±' },
  ],
  [
    { label: '<', insert: '<' },
    { label: '>', insert: '>' },
    { label: '≤', insert: '≤' },
    { label: '≥', insert: '≥' },
    { label: '|x|', insert: '||', cursor: -1 },
    { label: '°', insert: '°' },
  ],
];

export function MathKeyboard({
  targets,
  activeIndex = 0,
  disabled = false,
}: {
  targets: MathTarget[];
  activeIndex?: number;
  disabled?: boolean;
}) {
  const last = useRef(activeIndex);
  last.current = activeIndex;
  const pending = useRef(targets.map((target) => target.value));
  targets.forEach((target, index) => {
    pending.current[index] = target.value;
  });

  const resolveIndex = () => {
    const active = document.activeElement;
    const index = targets.findIndex((target) => target.ref.current === active);
    if (index >= 0) {
      last.current = index;
      return index;
    }
    return last.current;
  };

  const press = (key: MathKey) => {
    const index = resolveIndex();
    const target = targets[index];
    if (!target) return;
    const field = target.ref.current;
    const current = pending.current[index] ?? target.value;
    const start = field?.selectionStart ?? current.length;
    const end = field?.selectionEnd ?? current.length;
    const write = (from: number, to: number, insert: string, cursor = 0) => {
      const next = current.slice(0, from) + insert + current.slice(to);
      pending.current[index] = next;
      target.onChange(next);
      const pos = from + insert.length + cursor;
      requestAnimationFrame(() => {
        const nextField = target.ref.current;
        if (!nextField) return;
        nextField.focus();
        nextField.setSelectionRange(pos, pos);
      });
    };
    if (key.action === 'backspace') {
      if (start !== end) {
        write(start, end, '');
        return;
      }
      write(Math.max(0, start - 1), end, '');
      return;
    }
    if (key.insert == null) return;
    write(start, end, key.insert, key.cursor ?? 0);
  };

  return (
    <div className="math-kbd" role="group" aria-label="Математическая клавиатура">
      {ROWS.flat().map((key) => (
        <button
          key={key.label}
          className="math-key"
          type="button"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => press(key)}
        >
          {key.label}
        </button>
      ))}
    </div>
  );
}
