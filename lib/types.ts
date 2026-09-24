export type UserRole = 'student' | 'tutor';

export type TaskKind = 'quiz' | 'practice' | 'check';

export type TimerMode = 'off' | 'soft' | 'exam';

export interface Support {
  id?: string;
  title: string;
  body: string;
  metaphor?: string;
  anchor?: string;
  steps?: string[];
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
  trap_answers?: string[];
  image?: string;
}

export interface Topic {
  id: string;
  title: string;
  badge: string;
  exam_slots: number[];
  phrase: string;
  metaphor: string;
  accent: 'eq' | 'ineq' | 'word' | 'func' | 'geo';
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

export type ErrorCode =
  | 'knowledge'
  | 'algorithm'
  | 'inattention'
  | 'calculation'
  | 'freeze'
  | 'strategy';

export interface QuizQuestion {
  id: string;
  topic_label: string;
  hint: string;
  prompt: string;
  options: string[];
  answer: string;
  explain_ok: string;
  explain_trap: string;
  review_title: string;
  time_sec: number;
  topic_id: string | null;
}

export interface Attempt {
  id: string;
  student_id: string;
  task_id: string;
  kind: TaskKind;
  prompt: string;
  raw_answer: string;
  expected: string;
  correct: boolean;
  elapsed_ms: number;
  timed_out: boolean;
  skipped: boolean;
  error_codes: ErrorCode[];
  self_tag: ErrorCode | null;
  explain_ok: string;
  explain_trap: string;
  review_title: string;
  topic_id: string | null;
  timer_mode?: TimerMode;
  self_checked?: boolean;
  created_at: string;
}

export type AttemptDraft = Omit<Attempt, 'id' | 'created_at' | 'self_tag'> & {
  self_tag?: ErrorCode | null;
};

export type TopicState = 'holds' | 'shaky' | 'hole' | 'untouched';

export interface TopicProgress {
  topic_id: string;
  state: TopicState;
  correct: number;
  wrong: number;
  last_at: string | null;
}

export interface QueueItem {
  topic_id: string;
  role: 'focus' | 'review';
  reason: string;
  minutes: number;
}

export interface PlanOverride {
  student_id: string;
  order: string[];
  opened_new_topic_on: string | null;
  assigned_task_ids: string[];
}

export interface DigestTopicLine {
  title: string;
  note: string;
}

export interface DigestPayload {
  week_start: string;
  week_label: string;
  visits: number;
  holds: DigestTopicLine[];
  working: DigestTopicLine[];
  error_title: string;
  error_body: string;
  do_home: string[];
  dont_home: string[];
  letter: string;
}

export interface DigestRecord {
  token: string;
  student_id: string;
  week_start: string;
  created_at: string;
  expires_at: string;
  sent_at: string | null;
  payload: DigestPayload;
}
