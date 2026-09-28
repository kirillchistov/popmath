import type { ErrorCode, Support } from './types';

export type ScanMode = 'read' | 'algo' | 'review';

export interface ScanTopicHint {
  id: string;
  title: string;
  phrase: string;
  steps: string[];
  traps: string[];
}

export interface ScanSimilar {
  prompt: string;
  answer: string;
  hint: string;
}

export interface ScanReview {
  error_code: ErrorCode | 'none';
  title: string;
  body: string;
  next_step: string;
}

export interface ScanReadResult {
  prompt: string;
  readable: boolean;
  note?: string;
}

export interface ScanAlgoResult {
  support: Support;
  similar: ScanSimilar;
  answer?: string;
}

export interface ScanReviewResult {
  review: ScanReview;
  support?: Support;
}

export const SCAN_ERROR_CODES: Array<ErrorCode | 'none'> = [
  'knowledge',
  'algorithm',
  'inattention',
  'calculation',
  'freeze',
  'strategy',
  'none',
];
