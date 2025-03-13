<template>
  <div class="flex flex-col justify-center items-center gap-4 p-2">
    <span class="text-gray-700 dark:text-gray-300 text-sm">Double-click to edit task</span>
    <div class="flex gap-2">
      <button
        @click="store.setFilter('all')"
        :class="{ 'font-bold underline': store.filter === 'all' }"
        class="text-gray-700 dark:text-gray-300"
      >
        All
      </button>
      <button
        @click="store.setFilter('active')"
        :class="{ 'font-bold underline': store.filter === 'active' }"
        class="text-gray-700 dark:text-gray-300"
      >
        Active
      </button>
      <button
        @click="store.setFilter('completed')"
        :class="{ 'font-bold underline': store.filter === 'completed' }"
        class="text-gray-700 dark:text-gray-300"
      >
        Completed
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTasksStore } from '@/store/taskStore';

const store = useTasksStore();
</script>
