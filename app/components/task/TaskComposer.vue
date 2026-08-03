<script setup lang="ts">
import { PhPlus } from '@phosphor-icons/vue';
import BaseButton from '~/components/ui/BaseButton.vue';

const emit = defineEmits<{ submit: [text: string] }>();

const MAX = 500;

const draft = ref('');
const inputRef = useTemplateRef<HTMLInputElement>('input');

const trimmed = computed(() => draft.value.trim());
const canSubmit = computed(() => trimmed.value.length > 0);
const remaining = computed(() => MAX - draft.value.length);
/* Only warn near the ceiling. A counter that is always on is just noise. */
const showCounter = computed(() => remaining.value <= 60);

function submit() {
  if (!canSubmit.value) return;
  emit('submit', trimmed.value);
  draft.value = '';
  // Keep the caret where it was: adding tasks is a repeated action, and losing
  // focus after each one turns a list of five into five round trips to the mouse.
  inputRef.value?.focus();
}

defineExpose({ focus: () => inputRef.value?.focus() });
</script>

<template>
  <form class="flex flex-col gap-2" @submit.prevent="submit">
    <label for="task-input" class="sr-only">What are you putting off?</label>

    <!--
      The composer is the hero's call to action, so it is sized like one: a tall
      field with a labelled button rather than a bare arrow. The 2px border and
      the accent ring on focus give it more presence than the rows below it,
      which is the hierarchy the page needs.
    -->
    <div
      class="flex items-center gap-2 rounded-surface border-2 border-line-strong bg-surface pr-2 pl-4 transition-[border-color,box-shadow] duration-150 ease-snap focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--ui-accent-soft)]"
    >
      <input
        id="task-input"
        ref="input"
        v-model="draft"
        :maxlength="MAX"
        type="text"
        autocomplete="off"
        enterkeyhint="done"
        placeholder="Rewrite the onboarding flow"
        aria-describedby="task-input-hint"
        class="h-13 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-subtle sm:h-14 sm:text-[1.0625rem]"
      />

      <BaseButton type="submit" variant="primary" size="md" :disabled="!canSubmit">
        <PhPlus class="size-4" weight="bold" aria-hidden="true" />
        <span class="hidden sm:inline">Add</span>
        <span class="sr-only sm:hidden">Add task</span>
      </BaseButton>
    </div>

    <!--
      The hint is permanent and the counter replaces nothing, so the row never
      changes height as you type. aria-live only on the counter, so the hint is
      not re-announced on every keystroke.
    -->
    <p id="task-input-hint" class="flex min-h-5 items-center gap-2 text-xs text-ink-subtle">
      <span>Enter to add. Then hit <strong class="font-semibold text-ink-muted">Break down</strong> on any row.</span>
      <span
        v-if="showCounter"
        aria-live="polite"
        class="meta-num ml-auto shrink-0"
        :class="remaining <= 0 && 'text-danger'"
      >
        {{ remaining }}
      </span>
    </p>
  </form>
</template>
