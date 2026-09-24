'use client';

import { SELF_CHECK_ITEMS } from '@/lib/errors';

export function SelfCheck({
  checked,
  onToggle,
  required = false,
}: {
  checked: string[];
  onToggle: (id: string) => void;
  required?: boolean;
}) {
  return (
    <div className="self-check">
      <p className="eyebrow">
        Самопроверка{required ? ' · сначала отметь' : ' · перед сдачей'}
      </p>
      <div className="check-list">
        {SELF_CHECK_ITEMS.map((item) => (
          <label key={item.id} className="check-item">
            <input
              type="checkbox"
              checked={checked.includes(item.id)}
              onChange={() => onToggle(item.id)}
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function allChecksOn(checked: string[]): boolean {
  return SELF_CHECK_ITEMS.every((item) => checked.includes(item.id));
}

export function toggleCheck(checked: string[], id: string): string[] {
  return checked.includes(id)
    ? checked.filter((item) => item !== id)
    : [...checked, id];
}
