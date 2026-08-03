<script setup lang="ts">
import { toast } from 'vue-sonner';
import type { Task } from '~~/shared/types/task';
import AppFooter from '~/components/layout/AppFooter.vue';
import AppHeader from '~/components/layout/AppHeader.vue';
import AppHero from '~/components/layout/AppHero.vue';
import TaskComposer from '~/components/task/TaskComposer.vue';
import TaskDeleteDialog from '~/components/task/TaskDeleteDialog.vue';
import TaskEmptyState from '~/components/task/TaskEmptyState.vue';
import TaskList from '~/components/task/TaskList.vue';
import TaskToolbar from '~/components/task/TaskToolbar.vue';

/*
 * This page is a composition surface: it owns the wiring between the store and
 * the feature components, and nothing else. All task UI lives in components/task.
 */
const store = useTasksStore();
const composer = useTemplateRef<{ focus: () => void }>('composer');

useSeoMeta({
  title: 'Break Stuff - break big tasks into steps you can start',
  description:
    'Break Stuff splits a task that is too big to begin into a short, ordered list of steps, each with a time estimate. Everything stays in your browser.',
  ogTitle: 'Break Stuff',
  ogDescription: 'Break a task that is too big to begin into steps you can actually start.',
  ogType: 'website',
  twitterCard: 'summary'
});

/* Delete confirmation state. Held here so one dialog serves every row. */
const pendingDelete = ref<Task | null>(null);
const dialogOpen = ref(false);

function countTree(list: Task[]): number {
  return list.reduce((total, task) => total + 1 + (task.subtasks ? countTree(task.subtasks) : 0), 0);
}

const pendingSubtaskCount = computed(() =>
  pendingDelete.value?.subtasks ? countTree(pendingDelete.value.subtasks) : 0
);

function requestDelete(task: Task) {
  pendingDelete.value = task;
  dialogOpen.value = true;
}

function confirmDelete() {
  const task = pendingDelete.value;
  if (!task) return;

  // Position is captured before removal so undo puts it back where it was,
  // rather than at the bottom of the list.
  const index = store.tasks.findIndex((item) => item.id === task.id);
  const removed = store.removeTask(task.id);
  pendingDelete.value = null;
  if (!removed) return;

  toast('Task deleted', {
    description: task.text,
    action: index >= 0 ? { label: 'Undo', onClick: () => store.reinsert(removed, index) } : undefined
  });
}

function addTask(text: string) {
  store.addTask(text);
}

function useExample(text: string) {
  store.addTask(text);
  composer.value?.focus();
}

function clearCompleted() {
  const removed = store.completedCount;
  const snapshot = JSON.parse(JSON.stringify(store.tasks)) as Task[];
  store.clearCompleted();
  toast(`Cleared ${removed} ${removed === 1 ? 'task' : 'tasks'}`, {
    action: { label: 'Undo', onClick: () => (store.tasks = snapshot) }
  });
}
</script>

<template>
  <div class="flex min-h-[100dvh] flex-col">
    <!-- Skip link: the first tab stop, hidden until focused. -->
    <a
      href="#tasks"
      class="sr-only-focusable absolute top-2 left-2 z-50 rounded-control bg-accent px-3 py-2 text-sm text-accent-ink"
    >
      Skip to tasks
    </a>

    <AppHeader :active-count="store.activeCount" :remaining-minutes="store.remainingMinutes" />

    <main class="mx-auto w-full max-w-3xl flex-1 px-4 pt-10 sm:px-6 sm:pt-16">
      <!--
        The hero and composer animate in on first load only, staggered, so the
        page assembles itself rather than appearing all at once. This fires once
        per session, which is the frequency that earns an entrance.
      -->
      <div class="animate-rise" style="animation-delay: 0ms">
        <AppHero />
      </div>

      <div class="animate-rise mt-7 sm:mt-9" style="animation-delay: 70ms">
        <TaskComposer ref="composer" @submit="addTask" />
      </div>

      <section
        id="tasks"
        class="animate-rise mt-9 flex flex-col gap-3 sm:mt-11"
        style="animation-delay: 140ms"
        aria-label="Tasks"
      >
        <!--
          The list lives in localStorage, so there is nothing for the server to
          render and any attempt produces a hydration mismatch. ClientOnly keeps
          the shell above server-rendered (good for first paint and crawlers)
          while the stateful part waits for the browser. The fallback reserves the
          same height so the composer does not jump when the list arrives.
        -->
        <ClientOnly>
          <template #fallback>
            <div class="h-40" aria-hidden="true" />
          </template>

          <TaskToolbar
            v-if="!store.isEmpty"
            :filter="store.filter"
            :total-count="store.totalCount"
            :active-count="store.activeCount"
            :completed-count="store.completedCount"
            @update:filter="store.setFilter($event)"
            @clear-completed="clearCompleted"
          />

          <TaskEmptyState v-if="store.isEmpty" class="mt-3" @pick="useExample" />

          <p
            v-else-if="store.visibleTasks.length === 0"
            class="mt-3 rounded-surface border border-dashed border-line px-5 py-8 text-sm text-ink-muted"
          >
            {{ store.filter === 'active' ? 'Everything here is done.' : 'Nothing finished yet.' }}
          </p>

          <!-- relative: leaving rows are position:absolute mid-transition. -->
          <div v-else class="relative mt-3">
            <TaskList :tasks="store.visibleTasks" @remove="requestDelete" />
          </div>
        </ClientOnly>
      </section>
    </main>

    <AppFooter />

    <TaskDeleteDialog
      v-if="pendingDelete"
      v-model:open="dialogOpen"
      :task-text="pendingDelete.text"
      :subtask-count="pendingSubtaskCount"
      @confirm="confirmDelete"
    />
  </div>
</template>
