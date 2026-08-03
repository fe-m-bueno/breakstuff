<script setup lang="ts">
import type { TaskFilter } from '~~/shared/types/task';

const props = defineProps<{
  filter: TaskFilter;
  totalCount: number;
  activeCount: number;
  completedCount: number;
}>();

const emit = defineEmits<{
  'update:filter': [value: TaskFilter];
  clearCompleted: [];
}>();

const tabs = computed<{ value: TaskFilter; label: string; count: number }[]>(() => [
  { value: 'all', label: 'All', count: props.totalCount },
  { value: 'active', label: 'Active', count: props.activeCount },
  { value: 'completed', label: 'Done', count: props.completedCount }
]);
</script>

<template>
  <!--
    A real tablist, so arrow keys move between filters and the selected one is
    announced. The previous build used three unlabelled buttons with an underline.
  -->
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div
      role="tablist"
      aria-label="Filter tasks"
      class="flex items-center gap-0.5 rounded-control bg-surface-sunken p-0.5"
    >
      <button
        v-for="tab in tabs"
        :key="tab.value"
        role="tab"
        type="button"
        :aria-selected="filter === tab.value"
        class="flex items-center gap-1.5 rounded-[0.3125rem] px-2.5 py-1 text-[0.8125rem] font-medium transition-[background-color,color,transform] duration-150 ease-snap active:scale-[0.98]"
        :class="filter === tab.value ? 'bg-accent text-accent-ink' : 'text-ink-muted hover:bg-surface hover:text-ink'"
        @click="emit('update:filter', tab.value)"
      >
        {{ tab.label }}
        <span
          class="meta-num text-[0.6875rem]"
          :class="filter === tab.value ? 'text-accent-ink/70' : 'text-ink-subtle'"
          >{{ tab.count }}</span
        >
      </button>
    </div>

    <button
      v-if="completedCount > 0"
      type="button"
      class="rounded-control px-1 text-[0.8125rem] text-ink-subtle underline decoration-line-strong underline-offset-2 transition-colors duration-150 ease-snap hover:text-danger hover:decoration-danger"
      @click="emit('clearCompleted')"
    >
      Clear done
    </button>
  </div>
</template>
