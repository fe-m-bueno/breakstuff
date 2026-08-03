<script setup lang="ts">
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui';
import { PhCheck } from '@phosphor-icons/vue';

const model = defineModel<boolean>({ required: true });

defineProps<{
  /** Names what is being checked, for screen readers. */
  label: string;
}>();
</script>

<template>
  <!--
    active:scale-90 rather than the buttons' 0.97: a 20px target needs a larger
    proportional squash to register as pressed at all. Feedback is on the press,
    not on release, so it never feels like the click was missed.
  -->
  <CheckboxRoot
    v-model="model"
    :aria-label="label"
    class="group grid size-[1.1875rem] shrink-0 place-items-center rounded-[0.25rem] border-[1.5px] border-line-strong bg-surface transition-[background-color,border-color,transform] duration-150 ease-snap active:scale-90 data-[state=checked]:border-accent data-[state=checked]:bg-accent hover:border-accent"
  >
    <CheckboxIndicator class="grid place-items-center text-accent-ink">
      <!--
        The tick scales in from 0.5 rather than 0, and only ever inside an
        already-visible box, so it reads as the box filling rather than a glyph
        materialising out of nothing.
      -->
      <PhCheck
        class="size-3 origin-center scale-50 opacity-0 transition-[transform,opacity] duration-200 ease-snap group-data-[state=checked]:scale-100 group-data-[state=checked]:opacity-100"
        weight="bold"
      />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
