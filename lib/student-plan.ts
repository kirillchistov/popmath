import { listStudentUsernames } from './auth';
import { getAllTopics } from './content';
import { buildQueue, pickTodayItem, todayISO } from './plan';
import { getPlanOverride } from './plan-store';
import { buildTopicProgress, quizTotal, uniqueQuizCount } from './progress';
import { listAttempts } from './store';
import type { QueueItem, TopicProgress } from './types';

export interface StudentPlanView {
  student_id: string;
  quizCount: number;
  quizTotal: number;
  quizDone: boolean;
  progress: TopicProgress[];
  queue: QueueItem[];
  todayItem: QueueItem | null;
  order: string[];
  opened_new_topic_on: string | null;
  newTopicBlocked: boolean;
}

export async function getStudentPlan(
  studentId: string,
): Promise<StudentPlanView> {
  const attempts = await listAttempts(studentId);
  const topicIds = getAllTopics().map((topic) => topic.id);
  const progress = buildTopicProgress(attempts, topicIds);
  const override = await getPlanOverride(studentId);
  const queue = buildQueue(progress, override.order);
  const today = todayISO();
  const todayItem = pickTodayItem(
    queue,
    progress,
    override.opened_new_topic_on,
    today,
  );
  const quizCount = uniqueQuizCount(attempts);
  const total = quizTotal();
  const focus = queue.find((item) => item.role === 'focus');
  const focusState = progress.find((item) => item.topic_id === focus?.topic_id)
    ?.state;
  const newTopicBlocked =
    Boolean(focus) &&
    focusState === 'untouched' &&
    override.opened_new_topic_on === today &&
    todayItem?.topic_id !== focus?.topic_id;

  return {
    student_id: studentId,
    quizCount,
    quizTotal: total,
    quizDone: quizCount >= total,
    progress,
    queue,
    todayItem: quizCount >= total ? todayItem : null,
    order: override.order,
    opened_new_topic_on: override.opened_new_topic_on,
    newTopicBlocked,
  };
}

export async function listCohortPlans(): Promise<StudentPlanView[]> {
  const attempts = await listAttempts();
  const extras = attempts.map((item) => item.student_id);
  const students = listStudentUsernames(extras);
  return Promise.all(students.map((student) => getStudentPlan(student)));
}
