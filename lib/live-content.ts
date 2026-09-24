import { getBaseTopics, topicToMeta } from './content';
import { readOverlay } from './content-overlay';
import type { Task, Topic, TopicMeta } from './types';

function cloneTopic(topic: Topic): Topic {
  return {
    ...topic,
    steps: [...topic.steps],
    traps: [...topic.traps],
    supports: topic.supports.map((item) => ({ ...item, steps: item.steps ? [...item.steps] : undefined })),
    tasks: topic.tasks.map((item) => ({
      ...item,
      tags: [...item.tags],
      trap_answers: item.trap_answers ? [...item.trap_answers] : undefined,
    })),
  };
}

export async function loadLiveTopics(): Promise<Topic[]> {
  const overlay = await readOverlay();
  const topics = getBaseTopics().map(cloneTopic);

  for (const task of overlay.tasks) {
    const topic = topics.find((item) => item.id === task.topic_id);
    if (!topic) continue;
    const index = topic.tasks.findIndex((item) => item.id === task.id);
    if (index === -1) topic.tasks.push(task);
    else topic.tasks[index] = task;
  }

  for (const support of overlay.supports) {
    const topic = topics.find((item) => item.id === support.topic_id);
    if (!topic) continue;
    const { topic_id, ...card } = support;
    void topic_id;
    const index = topic.supports.findIndex((item) => item.id && item.id === support.id);
    if (index === -1) topic.supports.push(card);
    else topic.supports[index] = card;
  }

  return topics;
}

export async function getLiveTopicsMeta(): Promise<TopicMeta[]> {
  return (await loadLiveTopics()).map(topicToMeta);
}

export async function getLiveTopic(id: string): Promise<Topic | undefined> {
  return (await loadLiveTopics()).find((topic) => topic.id === id);
}

export async function getLiveTask(
  taskId: string,
): Promise<{ topic: Topic; task: Task } | undefined> {
  for (const topic of await loadLiveTopics()) {
    const task = topic.tasks.find((item) => item.id === taskId);
    if (task) return { topic, task };
  }
  return undefined;
}
