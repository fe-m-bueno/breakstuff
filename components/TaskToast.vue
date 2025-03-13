<template>
  <ToastProvider :duration="3000">
    <ToastRoot
      v-if="isOpen"
      class="fixed bottom-4 right-4 bg-zinc-600 dark:bg-stone-800 text-white px-4 py-2 rounded shadow"
    >
      <div class="flex flex-row items-center justify-between">
        <ToastTitle>{{ message }}</ToastTitle>
        <ToastClose
          class="ml-2 cursor-pointer text-gray-400 hover:text-white --reka-toast-swipe-end-x"
          @click="isOpen = false"
        >
          <X class="w-4 h-4" />
        </ToastClose>
      </div>
    </ToastRoot>
    <ToastViewport class="fixed bottom-0 right-0 p-4" />
  </ToastProvider>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { X } from 'lucide-vue-next';
import { ToastProvider, ToastRoot, ToastTitle, ToastClose, ToastViewport } from 'reka-ui';

const isOpen = ref(false);
const message = ref('');

const show = (msg: string) => {
  message.value = msg;
  isOpen.value = true;
};

defineExpose({ show });
</script>
