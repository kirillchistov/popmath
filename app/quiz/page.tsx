import { AppShell } from '@/components/AppShell';
import { QuizFlow } from '@/components/QuizFlow';
import { getQuizQuestions } from '@/lib/content';
import { requireSession } from '@/lib/session';

export default async function QuizPage() {
  const session = await requireSession();
  const questions = getQuizQuestions();

  return (
    <AppShell session={session} currentPath="/quiz">
      <QuizFlow questions={questions} />
    </AppShell>
  );
}
