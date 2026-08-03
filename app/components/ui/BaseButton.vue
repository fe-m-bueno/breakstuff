<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/utils/cn';

/*
 * One button, four intents. Variants are typed rather than assembled from
 * template ternaries so a new call site cannot invent a fifth look.
 *
 * Press feedback (scale 0.97) is on every variant: a control that does not move
 * under the finger reads as ignored. Hover is gated behind a pointer query,
 * because on a touch screen :hover latches after a tap and leaves the row
 * looking permanently focused.
 */
const button = cva(
  [
    'relative inline-flex shrink-0 select-none items-center justify-center gap-1.5',
    'rounded-control font-medium whitespace-nowrap',
    'transition-[background-color,color,border-color,transform,opacity] duration-150 ease-snap',
    'active:scale-[0.97]',
    'disabled:pointer-events-none'
  ],
  {
    variants: {
      variant: {
        /*
         * Disabled primary drops to a flat neutral rather than a faded fill.
         * Reducing the opacity of a brown button turns it into a pale tan that
         * reads as a rendering fault, not as "not yet".
         */
        primary:
          'bg-accent text-accent-ink hover:enabled:bg-accent-hover disabled:bg-surface-sunken disabled:text-ink-subtle',
        // border-line-strong, not border-line: this is a control boundary and
        // has to clear 3:1 against the surface behind it.
        secondary: 'border border-line-strong bg-surface text-ink hover:enabled:bg-hover disabled:opacity-45',
        ghost: 'text-ink-muted hover:enabled:bg-hover hover:enabled:text-ink disabled:opacity-40',
        danger: 'bg-danger text-white hover:enabled:brightness-110 disabled:opacity-45'
      },
      size: {
        // Every size clears the 44px touch target on its smallest axis via
        // padding or an explicit square, so nothing here is thumb-hostile.
        // h-7 to sit on the task rows' 28px line grid. Desktop-only call sites,
        // so the sub-44px height never becomes a touch target.
        sm: 'h-7 px-2.5 text-[0.8125rem]',
        md: 'h-9 px-3 text-sm',
        icon: 'size-8',
        'icon-sm': 'size-7'
      }
    },
    defaultVariants: { variant: 'ghost', size: 'md' }
  }
);

type ButtonVariants = VariantProps<typeof button>;

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariants['variant'];
    size?: ButtonVariants['size'];
    type?: 'button' | 'submit';
    disabled?: boolean;
    /** Used verbatim as aria-label. Required for icon-only buttons. */
    label?: string;
    class?: string;
  }>(),
  { type: 'button', disabled: false }
);

const classes = computed(() => cn(button({ variant: props.variant, size: props.size }), props.class));
</script>

<template>
  <button :type="type" :disabled="disabled" :aria-label="label" :class="classes">
    <slot />
  </button>
</template>
