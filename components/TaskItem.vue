<template>
  <CollapsibleRoot class="w-full bg-white dark:bg-stone-800 mb-2 rounded-lg shadow-sm dark:shadow-white/10" defaultOpen>
    <ContextMenuRoot>
      <ContextMenuTrigger class="w-full">
        <div class="flex items-center justify-between p-3">
          <div class="flex items-center gap-2">
            <CollapsibleTrigger v-if="task.subtasks?.length" @click="expanded = !expanded">
              <ChevronDown v-if="!expanded" class="w-5 h-5" />
              <ChevronUp v-else class="w-5 h-5" />
            </CollapsibleTrigger>
            <CheckboxRoot
              @click="store.toggleTask(task.id)"
              v-model="task.completed"
              class="hover:bg-stone-50 dark:hover:bg-stone-50/50 flex w-6 h-6 aspect-square appearance-none items-center justify-center rounded-md bg-white dark:bg-white/5 shadow-sm border outline-none focus-within:shadow-[0_0_0_2px_black]"
            >
              <CheckboxIndicator
                class="bg-blue-500 dark:bg-white text-white dark:text-black h-full w-full rounded flex items-center justify-center"
              >
                <Check class="w-4 h-4" />
              </CheckboxIndicator>
            </CheckboxRoot>
            <EditableRoot
              v-model="task.text"
              @update:model-value="store.saveTasks()"
              submit-mode="both"
              title="Double click to edit task"
              activation-mode="dblclick"
              v-slot="{ isEditing }"
              class="flex md:flex-row flex-col gap-4 w-full ml-2"
              :class="{ 'bg-stone-50 dark:bg-stone-500/50': isEditing, 'line-through': task.completed }"
            >
              <EditableArea>
                <EditablePreview />
                <EditableInput class="~w-[16rem]/[72rem] bg-white dark:bg-white/5" />
              </EditableArea>

              <div v-if="isEditing" class="flex gap-2">
                <EditableSubmitTrigger class="hover:bg-gray-200 dark:hover:bg-stone-600 p-1 rounded text-sm" />
                <EditableCancelTrigger
                  class="bg-red-500 dark:bg-red-700 hover:bg-red-600 dark:hover:bg-red-600 p-1 rounded text-sm text-white"
                />
              </div>
            </EditableRoot>
          </div>
          <div v-if="showEstimatedTime" class="flex items-center gap-2">
            <span v-if="task.estimated" class="text-gray-700 dark:text-gray-300 text-sm"
              >Estimated time: {{ task.estimated }} minutes</span
            >
            <span v-else class="text-gray-700 dark:text-gray-300 text-sm">No estimated time</span>
          </div>
          <div class="flex md:flex-row flex-col items-center gap-2">
            <DropdownMenuRoot>
              <DropdownMenuTrigger class="p-1 rounded hover:bg-gray-200 dark:hover:bg-stone-600" title="Options">
                <MoreHorizontal class="w-5 h-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                class="bg-white dark:bg-stone-800 rounded-md border border-gray-200 dark:border-stone-300"
              >
                <DropdownMenuItem
                  @click="handleBreakdown"
                  class="flex flex-row items-center p-2 hover:bg-gray-200 dark:hover:bg-stone-600 cursor-pointer"
                >
                  <Sparkles class="w-4 h-4 mr-2" /> Breakdown
                </DropdownMenuItem>
                <DropdownMenuItem
                  @click="store.toggleTask(task.id)"
                  class="flex flex-row items-center p-2 hover:bg-gray-200 dark:hover:bg-stone-600 cursor-pointer"
                >
                  <Check class="w-4 h-4 mr-2" /> Set Completed
                </DropdownMenuItem>
                <DropdownMenuItem
                  @click="openDeleteDialog"
                  class="flex flex-row items-center p-2 hover:bg-gray-200 dark:hover:bg-stone-600 cursor-pointer"
                >
                  <Trash class="w-4 h-4 mr-2 text-red-500" /> Remove
                </DropdownMenuItem>
                <DropdownMenuItem
                  @click="showEstimatedTime = !showEstimatedTime"
                  class="flex flex-row items-center p-2 hover:bg-gray-200 dark:hover:bg-stone-600 cursor-pointer"
                >
                  <Clock class="w-4 h-4 mr-2" /> {{ showEstimatedTime ? 'Hide' : 'Show' }} estimated time
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuRoot>
            <button
              @click="handleBreakdown"
              class="hover:bg-gray-200 dark:hover:bg-stone-600 p-1 rounded"
              title="Breakdown"
            >
              <WandSparkles class="w-5 h-5" />
            </button>
            <button
              @click="openDeleteDialog"
              class="hover:bg-gray-200 dark:hover:bg-stone-600 p-1 rounded"
              title="Delete"
            >
              <Trash class="w-5 h-5" />
            </button>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent class="bg-white dark:bg-stone-800 rounded-md border border-gray-200 dark:border-stone-300">
        <ContextMenuItem
          @click="handleBreakdown"
          class="flex flex-row items-center p-2 hover:bg-gray-200 dark:hover:bg-stone-600 cursor-pointer"
        >
          <Sparkles class="w-4 h-4 mr-2" /> Breakdown
        </ContextMenuItem>
        <ContextMenuItem
          @click="store.toggleTask(task.id)"
          class="flex flex-row items-center p-2 hover:bg-gray-200 dark:hover:bg-stone-600 cursor-pointer"
        >
          <Check class="w-4 h-4 mr-2" /> Set Completed
        </ContextMenuItem>
        <ContextMenuItem
          @click="openDeleteDialog"
          class="flex flex-row items-center p-2 hover:bg-gray-200 dark:hover:bg-stone-600 cursor-pointer"
        >
          <Trash class="w-4 h-4 mr-2 text-red-500" /> Remove
        </ContextMenuItem>
        <ContextMenuItem
          @click="showEstimatedTime = true"
          class="flex flex-row items-center p-2 hover:bg-gray-200 dark:hover:bg-stone-600 cursor-pointer"
        >
          <Clock class="w-4 h-4 mr-2" /> Show estimated time
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenuRoot>

    <CollapsibleContent
      class="pl-6 border rounded-lg border-gray-300 dark:border-stone-300"
      v-if="task.subtasks?.length"
    >
      <TaskItem v-for="subtask in task.subtasks" :key="subtask.id" :task="subtask" />
    </CollapsibleContent>
  </CollapsibleRoot>

  <TaskAlertDialog ref="deleteDialog" @confirm="confirmDelete" />
  <TaskToast ref="toast" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useTasksStore } from '@/store/taskStore';
import {
  CheckboxRoot,
  CheckboxIndicator,
  CollapsibleRoot,
  CollapsibleTrigger,
  CollapsibleContent,
  ContextMenuRoot,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  EditableRoot,
  EditableInput,
  EditableArea,
  EditablePreview,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  EditableSubmitTrigger,
  EditableCancelTrigger
} from 'reka-ui';
import { MoreHorizontal, Trash, Check, ChevronDown, ChevronUp, WandSparkles, Pencil, Clock } from 'lucide-vue-next';
import TaskAlertDialog from '@/components/TaskAlertDialog.vue';
import TaskToast from '@/components/TaskToast.vue';

const props = defineProps<{ task: any }>();
const store = useTasksStore();
const deleteDialog = ref();
const toast = ref();
const isEditing = ref(false);
const expanded = ref(true);
const showEstimatedTime = ref(false);

const openDeleteDialog = () => deleteDialog.value.open();
const confirmDelete = () => {
  store.removeTask(props.task.id);
  toast.value.show('Tarefa removida!');
};

const handleBreakdown = () => {
  store.breakdownTask(props.task.id);
  toast.value.show('Breakdown iniciado!');
};
</script>
