'use client';

import { SELF_CHECK_HINTS, SELF_CHECK_ID } from '@/lib/errors';

export function SelfCheck({
  checked,
  onToggle,
  required = false,
}: {
  checked: string[];
  onToggle: (id: string) => void;
  required?: boolean;
}) {
  const on = checked.includes(SELF_CHECK_ID);
  return (
    <div className="self-check">
      <p className="eyebrow">
        Самопроверка{required ? ' · сначала отметь' : ''}
      </p>
      <label className="check-item">
        <input
          type="checkbox"
          checked={on}
          onChange={() => onToggle(SELF_CHECK_ID)}
        />
        <span>Проверила себя</span>
      </label>
      <ol className="check-hints">
        {SELF_CHECK_HINTS.map((hint) => (
          <li key={hint}>{hint}</li>
        ))}
      </ol>
    </div>
  );
}

export function allChecksOn(checked: string[]): boolean {
  return checked.includes(SELF_CHECK_ID);
}

export function toggleCheck(checked: string[], id: string): string[] {
  return checked.includes(id)
    ? checked.filter((item) => item !== id)
    : [...checked, id];
}
