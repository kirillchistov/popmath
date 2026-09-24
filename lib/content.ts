import type { Topic, TopicMeta } from './types';
import equations from '@/content/topics/equations.json';
import inequalities from '@/content/topics/inequalities.json';
import word from '@/content/topics/word.json';
import functions from '@/content/topics/functions.json';

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
