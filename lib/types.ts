export type UserRole = 'student' | 'tutor';

export type TaskKind = 'quiz' | 'practice' | 'check';

export interface Support {
  title: string;
  body: string;
}

export interface Task {
  id: string;
  topic_id: string;
  prompt: string;
  answer: string;
  kind: TaskKind;
  explain_ok: string;
  explain_trap: string;
  review_title: string;
  time_sec: number;
  tags: string[];
}

export interface Topic {
  id: string;
  title: string;
  badge: string;
  exam_slots: number[];
  phrase: string;
  metaphor: string;
  accent: 'eq' | 'ineq' | 'word' | 'func';
  steps: string[];
  traps: string[];
  supports: Support[];
  tasks: Task[];
}

export interface TopicMeta {
  id: string;
  title: string;
  badge: string;
  phrase: string;
  accent: Topic['accent'];
  taskCount: number;
}

export interface SessionPayload {
  username: string;
  role: UserRole;
  exp: number;
}

export interface AuthUser {
  username: string;
  password: string;
  role: UserRole;
}
