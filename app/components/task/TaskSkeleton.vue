<script setup lang="ts">
/*
 * Placeholder rows shaped like the steps that are about to land, rather than a
 * spinner: nothing shifts when the real content arrives, and the count tells the
 * user roughly what to expect. Widths vary so it reads as text.
 *
 * The leading spacer and gaps deliberately mirror TaskItem's own layout (pl-1.5,
 * a w-7 disclosure slot, gap-1, then the checkbox). Without it the placeholder
 * checkboxes sit ~30px left of the real ones and the whole block jumps sideways
 * the moment the steps render.
 */
const WIDTHS = ['72%', '58%', '81%', '64%', '69%'];
</script>

<template>
  <ul class="flex flex-col" aria-hidden="true">
    <li v-for="(width, index) in WIDTHS" :key="index" class="flex h-6 items-center gap-1 py-2 pl-1.5">
      <span class="w-7 shrink-0" />
      <span class="size-[1.1875rem] shrink-0 rounded-[0.25rem] border-[1.5px] border-line" />
      <span class="relative ml-1 h-3.5 overflow-hidden rounded-sm bg-surface-sunken" :style="{ width }">
        <!-- Shimmer is the only looping animation in the app, and it exists only
             while a request is in flight, so it cannot become ambient noise. -->
        <span
          class="absolute inset-0 animate-shimmer bg-linear-to-r from-transparent via-line to-transparent"
          :style="{ animationDelay: `${index * 90}ms` }"
        />
      </span>
    </li>
  </ul>
</template>
