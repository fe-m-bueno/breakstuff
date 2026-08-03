<script setup lang="ts">
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui';
import { PhCaretRight, PhSparkle, PhWarningCircle } from '@phosphor-icons/vue';
import type { Task } from '~~/shared/types/task';
import BaseButton from '~/components/ui/BaseButton.vue';
import BaseCheckbox from '~/components/ui/BaseCheckbox.vue';
import TaskRowMenu from '~/components/task/TaskRowMenu.vue';
import TaskSkeleton from '~/components/task/TaskSkeleton.vue';

const props = withDefaults(
  defineProps<{
    task: Task;
    /** Nesting level, for the indent guide. Root rows are 0. */
    depth?: number;
  }>(),
  { depth: 0 }
);

const store = useTasksStore();

const isOpen = ref(true);
const isEditing = ref(false);
const draft = ref('');
const editRef = useTemplateRef<HTMLInputElement>('edit');

const subtasks = computed(() => props.task.subtasks ?? []);
const hasSubtasks = computed(() => subtasks.value.length > 0);
const pending = computed(() => store.isPending(props.task.id));
const error = computed(() => store.errorFor(props.task.id));

const completed = computed({
  get: () => props.task.completed,
  set: () => store.toggleTask(props.task.id)
});

/* Rolled-up estimate, so a collapsed parent still reports its own cost. */
const estimate = computed(() => {
  if (!hasSubtasks.value) return props.task.estimated ?? 0;
  const sum = (list: Task[]): number =>
    list.reduce((total, item) => total + (item.subtasks?.length ? sum(item.subtasks) : (item.estimated ?? 0)), 0);
  return sum(subtasks.value);
});

const doneCount = computed(() => subtasks.value.filter((item) => item.completed).length);

const isRoot = computed(() => props.depth === 0);

/*
 * Root and step rows use different type sizes, so they need different line boxes.
 * The controls and the text share one height per depth, which is what actually
 * centres the checkbox against the first line: matching them by eye leaves a
 * pixel or two of drift that reads as a misalignment once rows stack up.
 */
const lineBox = computed(() => (isRoot.value ? 'h-7' : 'h-6'));
const lineLeading = computed(() => (isRoot.value ? 'leading-7' : 'leading-6'));

/*
 * Breaking a task down is the whole product, so on root rows the action is a
 * labelled button that is always on screen. Nested steps keep the icon-only
 * version behind hover: by then the gesture is learned, and five visible buttons
 * per level would bury the text they belong to.
 */
const showFullBreakdownButton = computed(() => isRoot.value && !hasSubtasks.value);

/* Fires the stagger only on the render right after steps arrive. */
const justBrokeDown = ref(false);
watch(hasSubtasks, (has, had) => {
  if (has && !had) {
    justBrokeDown.value = true;
    setTimeout(() => (justBrokeDown.value = false), 800);
  }
});

async function startEditing() {
  draft.value = props.task.text;
  isEditing.value = true;
  await nextTick();
  editRef.value?.select();
}

function commitEdit() {
  if (!isEditing.value) return;
  store.renameTask(props.task.id, draft.value);
  isEditing.value = false;
}

function cancelEdit() {
  isEditing.value = false;
}

async function breakdown() {
  // Expand first so the skeleton is visible where the steps will appear;
  // otherwise the work happens behind a collapsed section.
  isOpen.value = true;
  await store.breakdownTask(props.task.id);
}

const emit = defineEmits<{ remove: [task: Task] }>();
</script>

<template>
  <li class="relative">
    <CollapsibleRoot v-model:open="isOpen">
      <!--
        The row: a single hover surface with controls that fade in on hover and
        are always present for keyboard users (focus-within reveals them too, so
        tabbing never lands on something invisible).

        Root rows get their weight from type, not from a coloured bar on the edge:
        larger and semibold against lighter steps. Hierarchy is carried by the
        text itself plus the indent, which is how a document reads.
      -->
      <div
        class="group/row relative flex items-start gap-1 rounded-control py-2 pr-1.5 pl-1.5 transition-colors duration-150 ease-snap hover:bg-hover focus-within:bg-hover"
        :class="pending && 'opacity-70'"
      >
        <!--
          Disclosure occupies its slot whether or not there are steps, so text on
          rows with and without children stays on the same left edge. Every leading
          control is exactly one line box tall and centres inside it, which is what
          lines the checkbox up with the first line of text on wrapped rows too.
        -->
        <div class="grid w-7 shrink-0 place-items-center" :class="lineBox">
          <CollapsibleTrigger v-if="hasSubtasks" as-child>
            <BaseButton
              variant="ghost"
              size="icon-sm"
              :label="`${isOpen ? 'Collapse' : 'Expand'} steps for ${task.text}`"
            >
              <PhCaretRight
                class="size-3.5 transition-transform duration-200 ease-snap"
                :class="isOpen && 'rotate-90'"
                weight="bold"
                aria-hidden="true"
              />
            </BaseButton>
          </CollapsibleTrigger>
        </div>

        <div class="grid shrink-0 place-items-center" :class="lineBox">
          <BaseCheckbox v-model="completed" :label="`Mark &quot;${task.text}&quot; as done`" />
        </div>

        <!-- Text: an input while editing, a button otherwise. A button rather
             than a bare div so it is reachable and activatable by keyboard. -->
        <div class="min-w-0 flex-1">
          <input
            v-if="isEditing"
            ref="edit"
            v-model="draft"
            type="text"
            maxlength="500"
            :aria-label="`Rename ${task.text}`"
            :class="[lineLeading, isRoot ? 'text-[1.0625rem] font-semibold' : 'text-[0.9375rem]']"
            class="w-full rounded-[0.25rem] bg-surface px-1.5 text-ink outline-none ring-2 ring-accent"
            @keydown.enter.prevent="commitEdit"
            @keydown.esc.prevent="cancelEdit"
            @blur="commitEdit"
          />
          <button
            v-else
            type="button"
            class="w-full rounded-[0.25rem] px-1.5 text-left break-words transition-colors duration-150 ease-snap"
            :class="[
              lineLeading,
              // Root tasks are the thing; steps are how you get there.
              isRoot ? 'text-[1.0625rem] font-semibold tracking-[-0.011em]' : 'text-[0.9375rem]',
              task.completed ? 'text-ink-subtle line-through decoration-line-strong' : 'text-ink'
            ]"
            title="Click to rename"
            @click="startEditing"
          >
            {{ task.text }}
          </button>

          <!--
            Inline next to the task that failed, not as a toast: the message names
            a per-row problem and the retry button is right here. role="status"
            rather than "alert" so it is announced without interrupting.
          -->
          <p
            v-if="error"
            class="animate-step-in mt-1.5 flex flex-wrap items-start gap-x-2 gap-y-1 px-1.5 text-xs text-danger"
            role="status"
          >
            <span class="flex items-start gap-1.5">
              <PhWarningCircle class="mt-px size-3.5 shrink-0" aria-hidden="true" />
              {{ error }}
            </span>
            <span class="flex shrink-0 items-center gap-2">
              <button
                type="button"
                class="rounded-control font-medium underline decoration-danger/40 underline-offset-2 transition-colors duration-150 ease-snap hover:decoration-danger"
                @click="breakdown"
              >
                Retry
              </button>
              <button
                type="button"
                class="rounded-control text-ink-subtle underline decoration-line-strong underline-offset-2 transition-colors duration-150 ease-snap hover:text-ink"
                @click="store.dismissError(task.id)"
              >
                Dismiss
              </button>
            </span>
          </p>
        </div>

        <!--
          Metadata and actions. Estimate is text, not a progress bar: a filled
          track would imply a measurement nobody took.

          Both metadata slots reserve their width whether or not they have
          content, so the numbers line up in a column down the page instead of
          ragging against whatever sits beside them on each row.
        -->
        <div class="flex shrink-0 items-center gap-1" :class="lineBox">
          <span
            class="meta-num hidden w-12 text-right text-[0.6875rem] text-ink-subtle sm:block"
            :title="estimate > 0 ? `Estimated ${estimate} minutes` : undefined"
          >
            <template v-if="estimate > 0">{{ estimate }}m</template>
          </span>

          <span class="hidden w-10 text-right sm:block">
            <span
              v-if="hasSubtasks"
              class="meta-num text-[0.6875rem] text-ink-subtle"
              :title="`${doneCount} of ${subtasks.length} steps done`"
            >
              {{ doneCount }}/{{ subtasks.length }}
            </span>
          </span>

          <!--
            The primary action, promoted. An unbroken root task gets a labelled
            button that is always on screen, because that button is the reason the
            app exists and hiding it behind hover made the page look like a plain
            checklist. Everything else keeps the icon-only form behind hover, with
            its space reserved so nothing reflows.
          -->
          <!--
            The accessible name starts with the visible text and then names the
            task. Without it every promoted button announces only "Break down",
            so a screen reader's button list is a column of identical entries.
            Keeping "Break down" as the prefix satisfies Label in Name.
          -->
          <BaseButton
            v-if="showFullBreakdownButton"
            variant="secondary"
            size="sm"
            class="hidden border-accent/45 text-accent hover:enabled:bg-accent-soft sm:inline-flex"
            :label="`Break down ${task.text}`"
            :disabled="pending"
            @click="breakdown"
          >
            <PhSparkle
              class="size-3.5"
              :weight="pending ? 'fill' : 'bold'"
              :class="pending && 'animate-pulse'"
              aria-hidden="true"
            />
            {{ pending ? 'Breaking' : 'Break down' }}
          </BaseButton>

          <div
            class="flex items-center gap-0.5 transition-opacity duration-150 ease-snap max-[767px]:opacity-100 md:opacity-0 md:group-hover/row:opacity-100 md:group-focus-within/row:opacity-100"
          >
            <BaseButton
              :class="showFullBreakdownButton ? 'sm:hidden' : undefined"
              variant="ghost"
              size="icon-sm"
              :label="`Break &quot;${task.text}&quot; into steps`"
              :disabled="pending"
              @click="breakdown"
            >
              <PhSparkle
                class="size-4 text-accent"
                :class="pending && 'animate-pulse'"
                :weight="pending ? 'fill' : 'bold'"
                aria-hidden="true"
              />
            </BaseButton>

            <TaskRowMenu
              :task-text="task.text"
              :pending="pending"
              :can-move-up="store.canMove(task.id, -1)"
              :can-move-down="store.canMove(task.id, 1)"
              @breakdown="breakdown"
              @rename="startEditing"
              @move-up="store.moveTask(task.id, -1)"
              @move-down="store.moveTask(task.id, 1)"
              @remove="emit('remove', task)"
            />
          </div>
        </div>
      </div>

      <!--
        Children are indented against a hairline tree guide rather than a nested
        card. Boxes inside boxes at three levels deep stops communicating hierarchy
        and starts eating horizontal space, which matters most on a phone.
      -->
      <CollapsibleContent
        v-if="hasSubtasks || pending"
        class="overflow-hidden data-[state=open]:animate-collapse-open data-[state=closed]:animate-collapse-close"
      >
        <div class="ml-[1.75rem] border-l border-line pl-1.5 sm:ml-[2.05rem] sm:pl-2.5">
          <TaskSkeleton v-if="pending" />
          <ul v-else class="flex flex-col">
            <!--
              Staggered only on the render right after a breakdown lands, never on
              a page load or a filter change. 45ms apart, so five steps finish
              cascading in under half a second.
            -->
            <TaskItem
              v-for="(subtask, index) in subtasks"
              :key="subtask.id"
              :task="subtask"
              :depth="depth + 1"
              :class="justBrokeDown && 'animate-step-in'"
              :style="justBrokeDown ? { animationDelay: `${index * 45}ms` } : undefined"
              @remove="emit('remove', $event)"
            />
          </ul>
        </div>
      </CollapsibleContent>
    </CollapsibleRoot>
  </li>
</template>
