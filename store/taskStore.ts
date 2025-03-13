import { defineStore } from 'pinia';
import { useCookie } from 'nuxt/app';
import { fetchAI } from '@/utils/fetchAI';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  subtasks?: Task[];
  estimated?: number;
  parentContext?: string;
}

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    tasks: useCookie<Task[]>('tasks', {
      default: () => [],
      watch: false,
      maxAge: 60 * 60 * 24 * 7,
    }),
    filter: 'all' as 'all' | 'active' | 'completed',
  }),

  getters: {
    completedTasks(state) {
      const filterCompleted = (tasks: Task[]): Task[] => {
        return tasks.reduce((taskArray: Task[], task) => {
          if (task.completed) {
            const taskCopy = { ...task };
            if (task.subtasks) {
              taskCopy.subtasks = filterCompleted(task.subtasks);
            }
            taskArray.push(taskCopy);
          } else if (task.subtasks) {
            const completedSubtasks = filterCompleted(task.subtasks);
            if (completedSubtasks.length > 0) {
              taskArray.push({ ...task, subtasks: completedSubtasks });
            }
          }
          return taskArray;
        }, []);
      };
      return filterCompleted(state.tasks);
    },
    activeTasks(state) {
      const filterActive = (tasks: Task[]): Task[] => {
        return tasks.reduce((taskArray: Task[], task) => {
          if (!task.completed) {
            const taskCopy = { ...task };
            if (task.subtasks) {
              taskCopy.subtasks = filterActive(task.subtasks);
            }
            taskArray.push(taskCopy);
          } else if (task.subtasks) {
            const activeSubtasks = filterActive(task.subtasks);
            if (activeSubtasks.length > 0) {
              taskArray.push({ ...task, subtasks: activeSubtasks });
            }
          }
          return taskArray;
        }, []);
      };
      return filterActive(state.tasks);
    },
    filteredTasks(state): Task[] {
      if (state.filter === 'completed') {
        return this.completedTasks;
      } else if (state.filter === 'active') {
        return this.activeTasks;
      }
      return state.tasks;
    },
  },

  actions: {
    findTask(id: string, taskList?: Task[]): Task | null {
      const list = taskList || this.tasks;

      for (const task of list) {
        if (task.id === id) return task;
        if (task.subtasks) {
          const found = this.findTask(id, task.subtasks);
          if (found) return found;
        }
      }
      return null;
    },

    addTask(text: string) {
      this.tasks.push({ id: crypto.randomUUID(), text, completed: false });
      this.saveTasks();
    },

    toggleTask(id: string) {
      const task = this.findTask(id);
      if (task) {
        task.completed = !task.completed;
        this.saveTasks();
      }
    },

    removeTask(id: string, taskList?: Task[]) {
      if (!taskList) taskList = this.tasks;

      for (let i = 0; i < taskList.length; i++) {
        if (taskList[i].id === id) {
          taskList.splice(i, 1);
          this.saveTasks();
          return;
        }

        if (taskList[i].subtasks) {
          this.removeTask(id, taskList[i].subtasks);
        }
      }
    },

    async breakdownTask(id: string) {
      const task = this.findTask(id);
      if (!task) return;

      const parentContext = task.parentContext || task.text;

      const breakdown = await fetchAI(task.text, parentContext);

      task.subtasks = breakdown.map((subtask) => ({
        id: crypto.randomUUID(),
        text: subtask.text,
        estimated: subtask.estimated,
        completed: false,
        parentContext: task.text,
      }));

      this.saveTasks();
    },

    setFilter(newFilter: 'all' | 'active' | 'completed') {
      this.filter = newFilter;
    },

    saveTasks() {
      useCookie('tasks').value = JSON.parse(JSON.stringify(this.tasks));
    },
  },
});
