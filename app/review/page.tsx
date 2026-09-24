import { AppShell } from '@/components/AppShell';
import { requireSession } from '@/lib/session';

export default async function ReviewPage() {
  const session = await requireSession();

  return (
    <AppShell session={session} currentPath="/review">
      <article className="panel empty-card">
        <div className="eyebrow">Разбор</div>
        <h2>Как надо / как не надо</h2>
        <p>
          После первых попыток сюда попадут ошибки и короткий самотег:
          не поняла тему, знак, не дочитала, страх.
        </p>
      </article>
    </AppShell>
  );
}
