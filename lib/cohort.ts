import { listStudentUsernames } from './auth';
import { getLiveTopic } from './live-content';
import { weekStartISO } from './plan';
import { listCohortPlans, type StudentPlanView } from './student-plan';
import { listAttempts } from './store';
import type { ErrorCode } from './types';

export const ERROR_LABEL: Record<ErrorCode, string> = {
  knowledge: 'не поняла тему',
  algorithm: 'не знала ход',
  inattention: 'знак / не дочитала',
  calculation: 'счёт',
  freeze: 'страх / ступор',
  strategy: 'стратегия',
};

export interface CohortRow {
  student_id: string;
  last_at: string | null;
  week_attempts: number;
  dominant_error: ErrorCode | null;
  dominant_error_label: string;
  week_topic_id: string | null;
  week_topic_title: string;
  quiz_done: boolean;
  assigned_count: number;
}

function dominantError(codes: ErrorCode[]): ErrorCode | null {
  if (codes.length === 0) return null;
  const counts = new Map<ErrorCode, number>();
  for (const code of codes) {
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0][0];
}

export async function listCohortRows(): Promise<CohortRow[]> {
  const [plans, attempts] = await Promise.all([
    listCohortPlans(),
    listAttempts(),
  ]);
  const extras = attempts.map((item) => item.student_id);
  const students = listStudentUsernames(extras);
  const weekStart = weekStartISO();
  const byStudent = new Map(plans.map((plan) => [plan.student_id, plan]));

  return Promise.all(
    students.map(async (studentId) => {
      const plan: StudentPlanView | undefined = byStudent.get(studentId);
      const own = attempts.filter((item) => item.student_id === studentId);
      const weekItems = own.filter((item) => item.created_at.slice(0, 10) >= weekStart);
      const errorCodes = own
        .filter((item) => !item.correct)
        .flatMap((item) => {
          if (item.self_tag) return [item.self_tag];
          return item.error_codes ?? [];
        });
      const focusId = plan?.queue.find((item) => item.role === 'focus')?.topic_id ?? null;
      const topic = focusId ? await getLiveTopic(focusId) : undefined;
      const dominant = dominantError(errorCodes);

      return {
        student_id: studentId,
        last_at: own[0]?.created_at ?? null,
        week_attempts: weekItems.length,
        dominant_error: dominant,
        dominant_error_label: dominant ? ERROR_LABEL[dominant] : 'пока тихо',
        week_topic_id: focusId,
        week_topic_title: topic?.title ?? 'ещё нет фокуса',
        quiz_done: Boolean(plan?.quizDone),
        assigned_count: plan?.assigned_tasks.length ?? 0,
      };
    }),
  );
}
