import { ref, computed, watch } from 'vue';
import { useCookie } from 'nuxt/app';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  subtasks?: Task[];
  estimated?: number;
}

export function useTasks() {
  /*   const taskCookie = useCookie<Task[]>('tasks', {
    default: () => [],
    watch: true,
    maxAge: 60 * 60 * 24 * 7,
  }); */

  const tasks = ref<Task[]>([]);
  const filter = ref<'all' | 'active' | 'completed'>('all');

  /*   watch(
    tasks,
    (newTasks) => {
      taskCookie.value = [...newTasks];
    },
    { deep: true }
  ); */

  watch(
    tasks,
    (newTasks) => {
      tasks.value = newTasks;
    },
    { deep: true }
  );
  const filteredTasks = computed(() => {
    if (filter.value === 'active')
      return tasks.value.filter((task) => !task.completed);
    if (filter.value === 'completed')
      return tasks.value.filter((task) => task.completed);
    return tasks.value;
  });

  const addTask = (text: string) => {
    tasks.value = [
      ...tasks.value,
      { id: crypto.randomUUID(), text, completed: false },
    ];
  };

  const removeTask = (id: string) => {
    tasks.value = [...tasks.value.filter((task) => task.id !== id)];
  };

  const toggleTask = (id: string) => {
    tasks.value = tasks.value.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
  };

  return { tasks, filteredTasks, addTask, removeTask, toggleTask, filter };
}
