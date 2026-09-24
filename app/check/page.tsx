import { AppShell } from '@/components/AppShell';
import { CheckFlow } from '@/components/CheckFlow';
import { getCheckTasks } from '@/lib/content';
import { requireSession } from '@/lib/session';

export default async function CheckPage() {
  const session = await requireSession();
  const tasks = getCheckTasks();

  return (
    <AppShell session={session} currentPath="/check">
      <CheckFlow tasks={tasks} />
    </AppShell>
  );
}
