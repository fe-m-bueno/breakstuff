<template>
  <button
    @click="toggleTheme"
    aria-label="Theme Toggle"
    class="relative flex items-center ~h-6/8 ~w-12/16 rounded-full border border-gray-200 bg-gray-100 p-1 transition-colors dark:border-gray-400 dark:bg-[#242424] focus:ring-2 focus:ring-blue-500"
  >
    <div
      class="absolute transform rounded-full ~h-5/6 ~w-5/6 bg-white shadow-md transition-transform duration-300 dark:bg-slate-950 items-center justify-center flex"
      :class="theme === 'dark' ? '~translate-x-5/8' : 'translate-x-0'"
    >
      <component :is="theme === 'dark' ? MoonIcon : SunIcon" class="m-1 ~h-3/4 ~w-3/4" />
    </div>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Sun as SunIcon, Moon as MoonIcon } from 'lucide-vue-next';

type Theme = 'light' | 'dark';

const theme = ref<Theme>('light');

const applyTheme = (newTheme: Theme) => {
  document.documentElement.setAttribute('data-mode', newTheme);
  document.documentElement.classList.toggle('dark', newTheme === 'dark');
};

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', theme.value);
  applyTheme(theme.value);
};

onMounted(() => {
  const storedTheme = (localStorage.getItem('theme') as Theme) || 'light';
  theme.value = storedTheme;
  applyTheme(storedTheme);
});
</script>
