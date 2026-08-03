<script setup lang="ts">
defineProps<{ class?: string }>();
</script>

<template>
  <!--
    The mark: one block cut clean in two, the halves pulled apart. Two rectangles
    and a gap, which is the only shape that still reads at 22px. Hand-drawn rather
    than pulled from an icon set because it has to mean this app specifically.
  -->
  <svg viewBox="0 0 20 20" aria-hidden="true" :class="$props.class" fill="currentColor">
    <rect x="1" y="2" width="7.5" height="12" rx="1.25" />
    <rect x="11.5" y="6" width="7.5" height="12" rx="1.25" opacity="0.5" />
  </svg>
</template>
