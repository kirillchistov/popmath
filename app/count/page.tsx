import { AppShell } from '@/components/AppShell';
import { CountFlow } from '@/components/CountFlow';
import { getCountCards } from '@/lib/count';
import { requireSession } from '@/lib/session';

export const runtime = 'nodejs';

export default async function CountPage() {
  const session = await requireSession();

  return (
    <AppShell session={session} currentPath="/count">
      <CountFlow cards={getCountCards()} />
    </AppShell>
  );
}
