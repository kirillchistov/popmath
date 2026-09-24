import { AppShell } from '@/components/AppShell';
import { requireSession } from '@/lib/session';

export default async function TaskPage() {
  const session = await requireSession();

  return (
    <AppShell session={session} currentPath="/task">
      <article className="panel empty-card">
        <div className="eyebrow">Задача</div>
        <h2>Один экран — одна задача</h2>
        <p>
          На этапе 1 здесь будет условие, поле ответа и право пропустить.
          Таймер по умолчанию выключен.
        </p>
      </article>
    </AppShell>
  );
}
