import type { QuizQuestion, Task, Topic, TopicMeta } from './types';
import equations from '@/content/topics/equations.json';
import inequalities from '@/content/topics/inequalities.json';
import word from '@/content/topics/word.json';
import functions from '@/content/topics/functions.json';
import quiz from '@/content/quiz.json';

const topics: Topic[] = [
  equations as Topic,
  inequalities as Topic,
  word as Topic,
  functions as Topic,
];

function toMeta(topic: Topic): TopicMeta {
  return {
    id: topic.id,
    title: topic.title,
    badge: topic.badge,
    phrase: topic.phrase,
    accent: topic.accent,
    taskCount: topic.tasks.length,
  };
}

export function getAllTopics(): TopicMeta[] {
  return topics.map(toMeta);
}

export function getTopic(id: string): Topic | undefined {
  return topics.find((topic) => topic.id === id);
}

export function getQuizQuestions(): QuizQuestion[] {
  return quiz as QuizQuestion[];
}

export function getQuizQuestion(id: string): QuizQuestion | undefined {
  return getQuizQuestions().find((item) => item.id === id);
}

export function getTask(taskId: string): { topic: Topic; task: Task } | undefined {
  for (const topic of topics) {
    const task = topic.tasks.find((item) => item.id === taskId);
    if (task) return { topic, task };
  }
  return undefined;
}

const CHECK_TASK_IDS = ['equations-1', 'word-1', 'inequalities-1', 'functions-2'];

export function getCheckTasks(): Task[] {
  return CHECK_TASK_IDS.map((id) => getTask(id)?.task).filter(
    (task): task is Task => Boolean(task),
  );
}
