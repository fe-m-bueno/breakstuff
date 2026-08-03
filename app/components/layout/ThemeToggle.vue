<script setup lang="ts">
import { PhMonitor, PhMoon, PhSun } from '@phosphor-icons/vue';
import BaseButton from '~/components/ui/BaseButton.vue';

/*
 * Three states rather than two, cycling system -> light -> dark. A binary toggle
 * has no way back to "follow the OS" once touched, which silently strands anyone
 * who switches themes on a schedule.
 *
 * @nuxtjs/color-mode writes the class before first paint, so there is no flash of
 * the wrong theme on load. The old build read localStorage in onMounted, which
 * meant every dark-mode reload started white.
 */
const colorMode = useColorMode();

const ORDER = ['system', 'light', 'dark'] as const;
type Mode = (typeof ORDER)[number];

const modes: Record<Mode, { icon: typeof PhSun; label: string }> = {
  system: { icon: PhMonitor, label: 'Theme: match system' },
  light: { icon: PhSun, label: 'Theme: light' },
  dark: { icon: PhMoon, label: 'Theme: dark' }
};

const current = computed<Mode>(() =>
  ORDER.includes(colorMode.preference as Mode) ? (colorMode.preference as Mode) : 'system'
);
const active = computed(() => modes[current.value]);

function cycle() {
  const next = ORDER[(ORDER.indexOf(current.value) + 1) % ORDER.length];
  colorMode.preference = next!;
}
</script>

<template>
  <BaseButton variant="ghost" size="icon" :label="active.label" :title="active.label" @click="cycle">
    <!--
      No cross-fade between icons. Switching theme repaints the entire page in
      one frame; animating the 16px icon on top of that just looks like lag.
    -->
    <component :is="active.icon" class="size-[1.0625rem]" aria-hidden="true" />
  </BaseButton>
</template>
