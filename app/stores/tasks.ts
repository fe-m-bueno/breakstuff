import { defineStore } from 'pinia';
import type { BreakdownResponse, Task, TaskFilter } from '~~/shared/types/task';

/**
 * Depth-first walk. Used by every lookup below so nesting behaviour lives in
 * exactly one place.
 */
function findIn(list: Task[], id: string): Task | null {
  for (const task of list) {
    if (task.id === id) return task;
    if (task.subtasks?.length) {
      const found = findIn(task.subtasks, id);
      if (found) return found;
    }
  }
  return null;
}

/** The parent array that directly contains `id`, for splice-based removal and reordering. */
function findOwner(list: Task[], id: string): Task[] | null {
  if (list.some((task) => task.id === id)) return list;
  for (const task of list) {
    if (task.subtasks?.length) {
      const owner = findOwner(task.subtasks, id);
      if (owner) return owner;
    }
  }
  return null;
}

/**
 * Keeps a task if it matches, or if any descendant does. A parent is shown for
 * its matching children even when the parent itself does not match, otherwise
 * filtering to "active" would hide the only route to an unfinished subtask.
 */
function filterTree(list: Task[], keep: (task: Task) => boolean): Task[] {
  return list.reduce<Task[]>((acc, task) => {
    const children = task.subtasks?.length ? filterTree(task.subtasks, keep) : [];
    if (keep(task)) {
      acc.push(children.length ? { ...task, subtasks: children } : { ...task, subtasks: task.subtasks });
    } else if (children.length) {
      acc.push({ ...task, subtasks: children });
    }
    return acc;
  }, []);
}

function countTree(list: Task[], predicate: (task: Task) => boolean): number {
  return list.reduce(
    (total, task) => total + (predicate(task) ? 1 : 0) + (task.subtasks ? countTree(task.subtasks, predicate) : 0),
    0
  );
}

function sumEstimates(list: Task[]): number {
  return list.reduce((total, task) => {
    // A parent's own estimate is superseded by its children's once it is split,
    // so only leaves contribute. Otherwise the same work is counted twice.
    if (task.subtasks?.length) return total + sumEstimates(task.subtasks);
    return total + (task.completed ? 0 : (task.estimated ?? 0));
  }, 0);
}

export const useTasksStore = defineStore(
  'tasks',
  () => {
    const tasks = ref<Task[]>([]);
    const filter = ref<TaskFilter>('all');
    /** Ids currently being broken down, so each row can show its own spinner. */
    const pendingIds = ref<string[]>([]);
    /** Per-task failure message, cleared on the next attempt. */
    const errors = ref<Record<string, string>>({});

    const visibleTasks = computed(() => {
      if (filter.value === 'active') return filterTree(tasks.value, (task) => !task.completed);
      if (filter.value === 'completed') return filterTree(tasks.value, (task) => task.completed);
      return tasks.value;
    });

    const totalCount = computed(() => countTree(tasks.value, () => true));
    const activeCount = computed(() => countTree(tasks.value, (task) => !task.completed));
    const completedCount = computed(() => totalCount.value - activeCount.value);
    /** Minutes of unfinished, already-estimated work. */
    const remainingMinutes = computed(() => sumEstimates(tasks.value));

    const isEmpty = computed(() => tasks.value.length === 0);

    function isPending(id: string) {
      return pendingIds.value.includes(id);
    }

    function errorFor(id: string) {
      return errors.value[id] ?? null;
    }

    function addTask(text: string): Task | null {
      const trimmed = text.trim();
      if (!trimmed) return null;
      const task: Task = {
        id: crypto.randomUUID(),
        text: trimmed,
        completed: false,
        createdAt: Date.now()
      };
      tasks.value.push(task);
      return task;
    }

    function renameTask(id: string, text: string) {
      const trimmed = text.trim();
      const task = findIn(tasks.value, id);
      // An empty edit is a mistake, not a request to blank the row.
      if (!task || !trimmed || trimmed === task.text) return;
      task.text = trimmed;
    }

    /**
     * Toggling cascades down and reconciles up: completing a parent completes its
     * steps, and completing the last step completes the parent. Anything else
     * lets the tree show a state the user did not ask for.
     */
    function toggleTask(id: string) {
      const task = findIn(tasks.value, id);
      if (!task) return;
      const next = !task.completed;
      task.completed = next;
      if (task.subtasks?.length) setSubtree(task.subtasks, next);
      reconcile(tasks.value);
    }

    function setSubtree(list: Task[], completed: boolean) {
      for (const task of list) {
        task.completed = completed;
        if (task.subtasks?.length) setSubtree(task.subtasks, completed);
      }
    }

    function reconcile(list: Task[]) {
      for (const task of list) {
        if (!task.subtasks?.length) continue;
        reconcile(task.subtasks);
        task.completed = task.subtasks.every((child) => child.completed);
      }
    }

    function removeTask(id: string): Task | null {
      const owner = findOwner(tasks.value, id);
      if (!owner) return null;
      const index = owner.findIndex((task) => task.id === id);
      const [removed] = owner.splice(index, 1);
      delete errors.value[id];
      pendingIds.value = pendingIds.value.filter((pending) => pending !== id);
      reconcile(tasks.value);
      return removed ?? null;
    }

    /**
     * Keyboard-reachable reordering. Buttons rather than drag-and-drop: a task
     * list has to be operable without a pointer, and move-by-one is the only
     * reorder gesture that is equally good with a keyboard, a screen reader and
     * a thumb. Movement is clamped to siblings so a step cannot escape its parent.
     */
    function moveTask(id: string, direction: -1 | 1) {
      const owner = findOwner(tasks.value, id);
      if (!owner) return;
      const from = owner.findIndex((task) => task.id === id);
      const to = from + direction;
      if (to < 0 || to >= owner.length) return;
      const [moved] = owner.splice(from, 1);
      if (moved) owner.splice(to, 0, moved);
    }

    function canMove(id: string, direction: -1 | 1) {
      const owner = findOwner(tasks.value, id);
      if (!owner) return false;
      const index = owner.findIndex((task) => task.id === id);
      const to = index + direction;
      return to >= 0 && to < owner.length;
    }

    function clearCompleted() {
      tasks.value = filterTree(tasks.value, (task) => !task.completed);
    }

    function setFilter(next: TaskFilter) {
      filter.value = next;
    }

    /**
     * Asks the server for steps and replaces this task's children with them.
     * Resolves to true on success so the caller can decide what to announce.
     */
    async function breakdownTask(id: string): Promise<boolean> {
      const task = findIn(tasks.value, id);
      if (!task || isPending(id)) return false;

      pendingIds.value.push(id);
      delete errors.value[id];

      try {
        const response = await $fetch<BreakdownResponse>('/api/breakdown', {
          method: 'POST',
          body: {
            task: task.text,
            parentContext: parentTextOf(id) ?? undefined,
            locale: import.meta.client ? navigator.language : undefined
          }
        });

        task.subtasks = response.steps.map((step) => ({
          id: crypto.randomUUID(),
          text: step.text,
          estimated: step.estimated,
          completed: false,
          createdAt: Date.now()
        }));
        // Splitting a finished task reopens it: its new steps are not done yet.
        task.completed = false;
        reconcile(tasks.value);
        return true;
      } catch (error) {
        errors.value[id] = messageFor(error);
        return false;
      } finally {
        pendingIds.value = pendingIds.value.filter((pending) => pending !== id);
      }
    }

    function parentTextOf(id: string): string | null {
      const walk = (list: Task[], parent: Task | null): string | null => {
        for (const task of list) {
          if (task.id === id) return parent?.text ?? null;
          if (task.subtasks?.length) {
            const found = walk(task.subtasks, task);
            if (found) return found;
          }
        }
        return null;
      };
      return walk(tasks.value, null);
    }

    function dismissError(id: string) {
      delete errors.value[id];
    }

    /** Restores a removed task at its previous position, for undo. */
    function reinsert(task: Task, index: number) {
      tasks.value.splice(Math.min(index, tasks.value.length), 0, task);
    }

    return {
      // state (all of it returned: setup stores need this for devtools,
      // persistence and SSR)
      tasks,
      filter,
      pendingIds,
      errors,
      // getters
      visibleTasks,
      totalCount,
      activeCount,
      completedCount,
      remainingMinutes,
      isEmpty,
      // actions
      isPending,
      errorFor,
      addTask,
      renameTask,
      toggleTask,
      removeTask,
      moveTask,
      canMove,
      clearCompleted,
      setFilter,
      breakdownTask,
      dismissError,
      reinsert
    };
  },
  {
    persist: {
      // Only durable data. Spinners and error strings must not survive a reload.
      pick: ['tasks', 'filter']
    }
  }
);

/** Turns a $fetch rejection into something worth showing a person. */
function messageFor(error: unknown): string {
  const status =
    (error as { statusCode?: number; status?: number })?.statusCode ?? (error as { status?: number })?.status;
  const fromServer = (error as { statusMessage?: string })?.statusMessage;
  if (fromServer) return fromServer;
  if (status === 429) return 'Rate limited. Try again in a moment.';
  if (status === 504) return 'That took too long. Try again.';
  if (status === 503) return 'Breakdowns are not configured on this server.';
  return 'Could not break that down. Try again.';
}
