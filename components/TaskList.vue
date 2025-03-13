<template>
  <div class="p-4">
    <ul v-if="store.tasks.length" class="gap-4">
      <TaskItem v-for="task in store.filteredTasks" :key="task.id" :task="task" />
    </ul>
    <div v-else class="text-gray-700 dark:text-gray-300 text-base flex flex-col items-center justify-center gap-2">
      <span>Add a new task and break it down with AI</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTasksStore } from '@/store/taskStore';
import TaskItem from '@/components/TaskItem.vue';

const store = useTasksStore();
</script>
