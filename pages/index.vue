<template>
  <div class="flex flex-col w-5/6 mx-auto min-h-screen justify-between gap-4">
    <div class="flex flex-col justify-start gap-4">
      <TheNavbar />

      <TaskInput />

      <TaskList />
      <TaskFilter />
    </div>
    <TheFooter />
  </div>
</template>

<script setup lang="ts">
import TaskInput from '@/components/TaskInput.vue';
import TaskList from '@/components/TaskList.vue';
import TaskFilter from '@/components/TaskFilter.vue';
import TheFooter from '@/components/TheFooter.vue';
</script>
