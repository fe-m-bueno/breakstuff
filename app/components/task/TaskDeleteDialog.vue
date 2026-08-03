<script setup lang="ts">
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle
} from 'reka-ui';
import BaseButton from '~/components/ui/BaseButton.vue';

const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
  taskText: string;
  /** Steps that go with it. Named so the warning is specific, not vague. */
  subtaskCount: number;
}>();

const emit = defineEmits<{ confirm: [] }>();

const detail = computed(() =>
  props.subtaskCount > 0
    ? `This also removes ${props.subtaskCount} ${props.subtaskCount === 1 ? 'step' : 'steps'} underneath it.`
    : 'You can undo this from the toast.'
);

function confirm() {
  emit('confirm');
  open.value = false;
}
</script>

<template>
  <AlertDialogRoot v-model:open="open">
    <AlertDialogPortal>
      <AlertDialogOverlay class="animate-overlay-in fixed inset-0 z-40 bg-cocoa-950/40 backdrop-blur-[2px]" />
      <!--
        Modals keep transform-origin at centre: unlike a popover they are not
        anchored to a trigger, so scaling out of one would be arbitrary.
        Positioned with a grid rather than translate so tall content on a small
        screen scrolls instead of overflowing off both edges.
      -->
      <AlertDialogContent
        class="animate-surface-in fixed inset-0 z-50 m-auto grid h-fit max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md gap-3 overflow-y-auto rounded-overlay border border-line bg-surface-raised p-5 shadow-[0_16px_48px_-12px_rgb(var(--ui-shadow-color)/0.28)]"
      >
        <AlertDialogTitle class="text-[0.9375rem] font-semibold text-ink"> Delete this task? </AlertDialogTitle>

        <AlertDialogDescription class="text-sm text-ink-muted">
          <span class="text-ink">&ldquo;{{ taskText }}&rdquo;</span>
          {{ ' ' }}{{ detail }}
        </AlertDialogDescription>

        <div class="mt-2 flex justify-end gap-2">
          <AlertDialogCancel as-child>
            <BaseButton variant="secondary" size="md">Keep it</BaseButton>
          </AlertDialogCancel>
          <AlertDialogAction as-child>
            <BaseButton variant="danger" size="md" @click="confirm">Delete</BaseButton>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
