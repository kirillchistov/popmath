'use client';

import { useState } from 'react';
import type { DigestRecord } from '@/lib/types';

export function DigestPanel({
  students,
  initial,
}: {
  students: string[];
  initial: DigestRecord[];
}) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const latest = (studentId: string) =>
    items
      .filter((item) => item.student_id === studentId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  const issue = async (studentId: string) => {
    setBusy(studentId);
    setMessage('');
    try {
      const response = await fetch('/api/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      });
      const data = (await response.json()) as { digest?: DigestRecord; error?: string };
      if (!response.ok || !data.digest) throw new Error(data.error ?? 'Не собралось');
      setItems((current) => [
        data.digest!,
        ...current.filter((item) => item.student_id !== data.digest!.student_id),
      ]);
      setMessage(`Ссылка для ${studentId} готова. Можно копировать или открыть.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ошибка');
    } finally {
      setBusy(null);
    }
  };

  const copy = async (digest: DigestRecord) => {
    const url = `${window.location.origin}/digest/${digest.token}`;
    await navigator.clipboard.writeText(url);
    setMessage('Ссылка в буфере. Родителю достаточно открыть её без входа.');
  };

  const mail = async (digest: DigestRecord) => {
    const url = `${window.location.origin}/digest/${digest.token}`;
    const subject = encodeURIComponent(`Неделя по математике: ${digest.payload.week_label}`);
    const body = encodeURIComponent(`${digest.payload.letter}\n\nКартина недели: ${url}`);
    await fetch('/api/digest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: digest.token, mark_sent: true }),
    });
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <article className="panel section-card">
      <div className="eyebrow">Родителю</div>
      <h2>Недельная ссылка, без отдельного приложения</h2>
      <p>
        Соберите картину недели и отправьте ссылку. Срок жизни — две недели. Ученик
        эти формулировки в своём экране не видит.
      </p>
      <div className="stack" style={{ marginTop: '1rem' }}>
        {students.map((studentId) => {
          const digest = latest(studentId);
          return (
            <div className="queue-row" key={studentId}>
              <div>
                <strong>{studentId}</strong>
                <p className="eyebrow">
                  {digest
                    ? `${digest.payload.week_label}${digest.sent_at ? ' · письмо открывали' : ''}`
                    : 'ссылки этой недели ещё нет'}
                </p>
              </div>
              <div className="queue-actions">
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={busy === studentId}
                  onClick={() => issue(studentId)}
                >
                  {busy === studentId ? 'Собираю...' : 'Собрать неделю'}
                </button>
                {digest ? (
                  <>
                    <button className="btn" type="button" onClick={() => copy(digest)}>
                      Ссылка
                    </button>
                    <a className="btn" href={`/digest/${digest.token}`}>
                      Открыть
                    </a>
                    <button className="btn" type="button" onClick={() => mail(digest)}>
                      Письмо
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {message ? <p style={{ marginTop: '1rem' }}>{message}</p> : null}
    </article>
  );
}
