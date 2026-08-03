<script setup lang="ts">
import type { Task } from '~~/shared/types/task';
import TaskItem from '~/components/task/TaskItem.vue';

defineProps<{ tasks: Task[] }>();

const emit = defineEmits<{ remove: [task: Task] }>();
</script>

<template>
  <!--
    Root tasks are separated by a hairline rather than by gaps or cards: it groups
    each task with its own steps and keeps the left edge of every row aligned.

    TransitionGroup so removing a row collapses the gap instead of snapping, and
    the rest of the list slides up. Exit is faster than enter: the user has
    already decided to delete it.
  -->
  <TransitionGroup
    tag="ul"
    class="flex flex-col divide-y divide-line"
    enter-active-class="transition-[opacity,transform] duration-200 ease-snap"
    enter-from-class="opacity-0 -translate-y-1"
    leave-active-class="transition-[opacity,transform] duration-150 ease-snap absolute w-full"
    leave-to-class="opacity-0 translate-y-1"
    move-class="transition-transform duration-200 ease-glide"
  >
    <TaskItem v-for="task in tasks" :key="task.id" :task="task" @remove="emit('remove', $event)" />
  </TransitionGroup>
</template>
