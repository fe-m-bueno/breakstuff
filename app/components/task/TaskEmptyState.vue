<script setup lang="ts">
import { PhArrowUpRight } from '@phosphor-icons/vue';

const emit = defineEmits<{ pick: [text: string] }>();

/*
 * Real starting points rather than an illustration. An empty state's job is to
 * get the user to a populated state, and a task they can click is a shorter path
 * than a paragraph explaining what to type. These are deliberately the kind of
 * thing people actually stall on.
 */
const EXAMPLES = ['Rewrite the onboarding flow', 'File last year’s taxes', 'Move the API off the legacy server'];
</script>

<template>
  <div class="rounded-surface border-2 border-dashed border-line px-5 py-7">
    <p class="text-sm font-semibold text-ink">Nothing broken yet.</p>
    <p class="mt-1 max-w-[58ch] text-[0.8125rem] text-ink-muted">
      Add the thing you keep scrolling past, or take one of these.
    </p>

    <ul class="mt-4 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
      <li v-for="example in EXAMPLES" :key="example">
        <button
          type="button"
          class="group flex w-full items-center justify-between gap-2 rounded-control border border-line-strong bg-surface px-3 py-2 text-left text-[0.8125rem] text-ink-muted transition-[background-color,border-color,color,transform] duration-150 ease-snap active:scale-[0.97] hover:border-accent hover:bg-accent-soft hover:text-ink sm:w-auto"
          @click="emit('pick', example)"
        >
          {{ example }}
          <PhArrowUpRight
            class="size-3.5 shrink-0 text-ink-subtle transition-colors duration-150 ease-snap group-hover:text-accent"
            weight="bold"
            aria-hidden="true"
          />
        </button>
      </li>
    </ul>
  </div>
</template>
