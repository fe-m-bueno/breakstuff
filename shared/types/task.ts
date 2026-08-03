/** A single step. Tasks nest: a step can itself be broken down further. */
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  /** Minutes. Set by the model on generated steps, absent on hand-typed ones. */
  estimated?: number;
  subtasks?: Task[];
  /** Millisecond epoch. Used only for sort stability, never displayed. */
  createdAt: number;
}

export type TaskFilter = 'all' | 'active' | 'completed';

/** One generated step, as returned by /api/breakdown. */
export interface BreakdownStep {
  text: string;
  estimated: number;
}

export interface BreakdownResponse {
  steps: BreakdownStep[];
}
