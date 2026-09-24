'use client';

import { useState } from 'react';
import { tagAttempt } from '@/lib/client-attempts';
import { ERROR_TAG_OPTIONS } from '@/lib/errors';
import type { ErrorCode } from '@/lib/types';

export function TutorTag({
  attemptId,
  current,
}: {
  attemptId: string;
  current: ErrorCode | null;
}) {
  const [chosen, setChosen] = useState<ErrorCode | null>(current);
  const [saving, setSaving] = useState(false);

  const choose = async (code: ErrorCode) => {
    setSaving(true);
    try {
      await tagAttempt(attemptId, code, true);
      setChosen(code);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="self-tag">
      <p className="eyebrow">Тег ошибки</p>
      <div className="tag-row">
        {ERROR_TAG_OPTIONS.map((option) => (
          <button
            key={option.code}
            type="button"
            className={`tag-btn ${chosen === option.code ? 'active' : ''}`}
            disabled={saving}
            onClick={() => choose(option.code)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
