<template>
  <div class="flex gap-2 px-4">
    <input
      v-model="newTask"
      @keyup.enter="addTask"
      placeholder="Add a new task..."
      class="border rounded p-2 flex-grow bg-white dark:bg-stone-800/40"
    />
    <button @click="addTask" class="bg-blue-500 dark:bg-stone-800 text-white px-4 py-2 rounded">+</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useTasksStore } from '@/store/taskStore';

const taskStore = useTasksStore();
const newTask = ref('');

const addTask = () => {
  if (newTask.value.trim()) {
    taskStore.addTask(newTask.value);
    newTask.value = '';
  }
};
</script>
