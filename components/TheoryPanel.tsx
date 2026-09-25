import { getTheoryItems } from '@/lib/theory';
import { listTheoryMarks } from '@/lib/theory-store';

const LABELS = {
  remember: 'помнит',
  forgot: 'не помнит',
  question: 'вопрос',
} as const;

export async function TheoryPanel() {
  const [items, marks] = await Promise.all([
    Promise.resolve(getTheoryItems()),
    listTheoryMarks(),
  ]);
  if (marks.length === 0) {
    return (
      <article className="panel section-card">
        <div className="eyebrow">Теория 7 класса</div>
        <h2>Пометок пока нет</h2>
        <p>Когда ученица отметит «не помню» или «вопрос», строки появятся здесь.</p>
      </article>
    );
  }

  const byStudent = new Map<string, typeof marks>();
  for (const mark of marks) {
    const list = byStudent.get(mark.student_id) ?? [];
    list.push(mark);
    byStudent.set(mark.student_id, list);
  }

  return (
    <article className="panel section-card">
      <div className="eyebrow">Теория 7 класса</div>
      <h2>Что пометили сами</h2>
      <ul className="week-list">
        {[...byStudent.entries()].map(([student, list]) => (
          <li key={student}>
            <strong>{student}</strong>
            {list.map((mark) => {
              const title = items.find((item) => item.id === mark.item_id)?.title;
              return (
                <p key={`${mark.item_id}-${mark.updated_at}`}>
                  {title ?? mark.item_id}: {LABELS[mark.mark]}
                  {mark.note ? ` — ${mark.note}` : ''}
                </p>
              );
            })}
          </li>
        ))}
      </ul>
    </article>
  );
}
