<template>
  <AlertDialogRoot v-model:open="isOpen">
    <AlertDialogPortal>
      <AlertDialogOverlay class="fixed inset-0 bg-black/50" />
      <AlertDialogContent
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-sm mx-auto p-6 bg-white dark:bg-stone-900 rounded-lg shadow-lg w-[32rem] h-[12rem]"
      >
        <div class="flex flex-col justify-between h-full">
          <AlertDialogTitle class="text-lg font-semibold">Confirm Delete</AlertDialogTitle>
          <AlertDialogDescription class="text-sm text-gray-600 dark:text-gray-200">
            Are you sure you want to delete this task? This action cannot be undone.
          </AlertDialogDescription>
          <div class="flex justify-end gap-2 mt-4">
            <AlertDialogCancel
              as="button"
              class="px-4 py-2 border rounded hover:bg-gray-200 dark:hover:bg-stone-600 transition-all duration-100 ease-in-out"
              @click="close"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              as="button"
              class="px-4 py-2 bg-red-500 dark:bg-red-700 hover:bg-red-600 dark:hover:bg-red-600 text-white rounded transition-all duration-100 ease-in-out"
              @click="confirm"
            >
              Delete
            </AlertDialogAction>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  AlertDialogRoot,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel
} from 'reka-ui';

const isOpen = ref(false);
const emit = defineEmits(['confirm']);

const open = () => (isOpen.value = true);
const close = () => (isOpen.value = false);
const confirm = () => {
  emit('confirm');
  close();
};

defineExpose({ open });
</script>
