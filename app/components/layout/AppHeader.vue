<script setup lang="ts">
import NumberFlow from '@number-flow/vue';
import AppMark from '~/components/layout/AppMark.vue';
import ThemeToggle from '~/components/layout/ThemeToggle.vue';

defineProps<{
  /** Unfinished leaf work, in minutes. Zero hides the summary. */
  remainingMinutes: number;
  activeCount: number;
}>();

/*
 * These two numbers change on nearly every interaction, so a plain text swap
 * makes them flicker without telling you which way they went. NumberFlow rolls
 * the digits, which is enough to register "that went down" out of the corner of
 * your eye. It honours prefers-reduced-motion internally.
 */
const FLOW_FORMAT = { useGrouping: false } as const;
</script>

<template>
  <!--
    A translucent bar with content scrolling underneath, rather than an opaque
    strip that permanently eats a band of the viewport. The blur is what keeps
    text legible as rows pass behind it.
  -->
  <header
    class="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur-md supports-[not(backdrop-filter:blur(0))]:bg-canvas"
  >
    <div class="mx-auto flex h-14 max-w-3xl items-center gap-2.5 px-4 sm:px-6">
      <AppMark class="size-[1.375rem] shrink-0 text-accent" />

      <!--
        The wordmark, not the headline. The page's argument is made once, in the
        hero below; repeating it here would be two voices saying the same thing.
      -->
      <p class="display-mark text-[1.0625rem] text-ink">Break Stuff</p>

      <!--
        ClientOnly because the counts come from localStorage, which does not
        exist during SSR: the server would always render zero tasks and Vue would
        report a hydration mismatch against the real list on the client.

        aria-live is deliberately absent: the counts are a glanceable summary, and
        announcing them on every checkbox tick would talk over the action itself.
      -->
      <ClientOnly>
        <p v-if="activeCount > 0" class="ml-1 hidden min-w-0 shrink truncate text-[0.8125rem] text-ink-subtle sm:block">
          <NumberFlow :value="activeCount" :format="FLOW_FORMAT" class="meta-num" />
          {{ activeCount === 1 ? 'step' : 'steps' }} left<template v-if="remainingMinutes > 0">
            <span aria-hidden="true"> &middot; </span>
            <NumberFlow :value="remainingMinutes" :format="FLOW_FORMAT" class="meta-num" /> min</template
          >
        </p>
      </ClientOnly>

      <ThemeToggle class="ml-auto" />
    </div>
  </header>
</template>
