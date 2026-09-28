'use client';

import type { RefObject } from 'react';

export function WorkSteps({
  steps,
  draft,
  onChangeSteps,
  onChangeDraft,
  draftRef,
  onFocusDraft,
  disabled,
}: {
  steps: string[];
  draft: string;
  onChangeSteps: (next: string[]) => void;
  onChangeDraft: (next: string) => void;
  draftRef?: RefObject<HTMLTextAreaElement | null>;
  onFocusDraft?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="field">
      <span className="eyebrow">Мой ход по шагам</span>
      {steps.length > 0 ? (
        <ol className="work-steps">
          {steps.map((step, index) => (
            <li key={`${index}-${step.slice(0, 24)}`}>
              <span>{step}</span>
              <button
                className="btn btn-ghost"
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChangeSteps(steps.filter((_, item) => item !== index))
                }
              >
                Убрать
              </button>
            </li>
          ))}
        </ol>
      ) : null}
      <textarea
        ref={draftRef}
        className="input-area homework-prompt"
        rows={3}
        value={draft}
        onChange={(event) => onChangeDraft(event.target.value)}
        onFocus={onFocusDraft}
        onClick={onFocusDraft}
        placeholder="Один шаг, например: 2x = 8"
        disabled={disabled}
      />
      <button
        className="btn"
        type="button"
        disabled={disabled || !draft.trim()}
        onClick={() => {
          onChangeSteps([...steps, draft.trim()]);
          onChangeDraft('');
        }}
      >
        Ещё шаг
      </button>
    </div>
  );
}
