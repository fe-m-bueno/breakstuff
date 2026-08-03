<script setup lang="ts">
import { Toaster } from 'vue-sonner';
import 'vue-sonner/style.css';
</script>

<template>
  <NuxtPage />

  <!--
    One Toaster for the whole app. `rich-colors` is off on purpose: the toasts
    inherit the surface tokens below so they stay inside the brown palette
    instead of introducing green and red fills the rest of the page never uses.
  -->
  <Toaster
    position="bottom-right"
    :duration="6000"
    :toast-options="{
      class:
        'rounded-surface border border-line bg-surface-raised text-ink text-[0.8125rem] shadow-[0_10px_32px_-8px_rgb(var(--ui-shadow-color)/0.24)]',
      descriptionClass: 'text-ink-muted',
      actionButtonStyle: {
        backgroundColor: 'var(--ui-accent)',
        color: 'var(--ui-accent-text)',
        borderRadius: 'var(--radius-control)'
      }
    }"
  />
</template>
