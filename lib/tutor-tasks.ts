import { readOverlay } from './content-overlay';
import { getLiveTask } from './live-content';
import type { StudentPlanView } from './student-plan';
import type { Attempt, Task } from './types';

export interface TutorTaskPlacement {
  student_id: string;
  on_today: boolean;
  solved: boolean;
}

export interface TutorTaskCard {
  task: Task;
  topic_title: string;
  placements: TutorTaskPlacement[];
}

export async function listTutorTaskCards(
  plans: StudentPlanView[],
  attempts: Attempt[],
): Promise<TutorTaskCard[]> {
  const solved = new Map<string, Set<string>>();
  for (const attempt of attempts) {
    if (!attempt.correct) continue;
    const set = solved.get(attempt.student_id) ?? new Set<string>();
    set.add(attempt.task_id);
    solved.set(attempt.student_id, set);
  }

  const cards: TutorTaskCard[] = [];
  const seen = new Set<string>();

  const push = (task: Task, topicTitle: string) => {
    if (seen.has(task.id)) return;
    seen.add(task.id);
    cards.push({
      task,
      topic_title: topicTitle,
      placements: plans.map((plan) => ({
        student_id: plan.student_id,
        on_today: plan.assigned_task_ids.includes(task.id),
        solved: solved.get(plan.student_id)?.has(task.id) ?? false,
      })),
    });
  };

  const overlay = await readOverlay();
  for (const task of overlay.tasks) {
    const found = await getLiveTask(task.id);
    push(task, found?.topic.title ?? task.topic_id);
  }

  for (const plan of plans) {
    for (const taskId of plan.assigned_task_ids) {
      if (seen.has(taskId)) continue;
      const found = await getLiveTask(taskId);
      if (!found) continue;
      push(found.task, found.topic.title);
    }
  }

  return cards;
}
