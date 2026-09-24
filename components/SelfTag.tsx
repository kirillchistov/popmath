'use client';

import { useState } from 'react';
import { tagAttempt } from '@/lib/client-attempts';
import { SELF_TAG_OPTIONS } from '@/lib/errors';
import type { ErrorCode } from '@/lib/types';

interface SelfTagProps {
  attemptId: string;
}

export function SelfTag({ attemptId }: SelfTagProps) {
  const [chosen, setChosen] = useState<ErrorCode | null>(null);
  const [saving, setSaving] = useState(false);

  const choose = async (code: ErrorCode) => {
    setSaving(true);
    try {
      await tagAttempt(attemptId, code);
      setChosen(code);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="self-tag">
      <p className="eyebrow">Что случилось?</p>
      <div className="tag-row">
        {SELF_TAG_OPTIONS.map((option) => (
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
