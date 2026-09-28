import { AppShell } from '@/components/AppShell';
import { HomeworkFlow } from '@/components/HomeworkFlow';
import { loadLiveTopics } from '@/lib/live-content';
import { requireSession } from '@/lib/session';
import type { ScanTopicHint } from '@/lib/scan';

export const runtime = 'nodejs';

interface HomeworkPageProps {
  searchParams: Promise<{ topic?: string }>;
}

export default async function HomeworkPage({ searchParams }: HomeworkPageProps) {
  const session = await requireSession();
  const { topic } = await searchParams;
  const topics: ScanTopicHint[] = (await loadLiveTopics()).map((item) => ({
    id: item.id,
    title: item.title,
    phrase: item.phrase,
    steps: item.steps,
    traps: item.traps,
  }));
  const initialTopicId =
    topic && topics.some((item) => item.id === topic) ? topic : '';

  return (
    <AppShell session={session} currentPath="/homework">
      <HomeworkFlow topics={topics} initialTopicId={initialTopicId} />
    </AppShell>
  );
}
