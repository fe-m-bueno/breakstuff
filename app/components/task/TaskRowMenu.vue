<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from 'reka-ui';
import { PhArrowDown, PhArrowUp, PhDotsThree, PhPencilSimple, PhSparkle, PhTrash } from '@phosphor-icons/vue';
import BaseButton from '~/components/ui/BaseButton.vue';
import { cn } from '~/utils/cn';

const props = defineProps<{
  taskText: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  pending: boolean;
}>();

const emit = defineEmits<{
  breakdown: [];
  rename: [];
  moveUp: [];
  moveDown: [];
  remove: [];
}>();

const itemClass =
  'flex cursor-pointer select-none items-center gap-2 rounded-control px-2 py-1.5 text-[0.8125rem] text-ink-muted outline-none transition-colors duration-100 ease-snap data-highlighted:bg-hover data-highlighted:text-ink data-disabled:pointer-events-none data-disabled:opacity-40';

/*
 * Merged rather than concatenated: `text-danger` and the base `text-ink-muted`
 * are the same Tailwind property, so appending would leave stylesheet order to
 * decide which wins. twMerge drops the loser.
 */
const dangerItemClass = cn(itemClass, 'text-danger data-highlighted:bg-danger-soft data-highlighted:text-danger');
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <BaseButton variant="ghost" size="icon-sm" :label="`More actions for ${props.taskText}`">
        <PhDotsThree class="size-[1.125rem]" weight="bold" aria-hidden="true" />
      </BaseButton>
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <!--
        transform-origin comes from Reka so the menu grows out of the button that
        opened it. Scaling from its own centre is the CSS default and is wrong for
        anything anchored to a trigger.
      -->
      <DropdownMenuContent
        :side-offset="4"
        align="end"
        class="z-40 min-w-[11rem] origin-(--reka-dropdown-menu-content-transform-origin) rounded-surface border border-line bg-surface-raised p-1 shadow-[0_10px_32px_-8px_rgb(var(--ui-shadow-color)/0.24)] data-[state=open]:animate-surface-in data-[state=closed]:animate-surface-out"
      >
        <DropdownMenuItem :class="itemClass" :disabled="pending" @select="emit('breakdown')">
          <PhSparkle class="size-4 text-accent" aria-hidden="true" />
          Break into steps
        </DropdownMenuItem>

        <DropdownMenuItem :class="itemClass" @select="emit('rename')">
          <PhPencilSimple class="size-4" aria-hidden="true" />
          Rename
        </DropdownMenuItem>

        <DropdownMenuSeparator class="my-1 h-px bg-line" />

        <DropdownMenuItem :class="itemClass" :disabled="!canMoveUp" @select="emit('moveUp')">
          <PhArrowUp class="size-4" aria-hidden="true" />
          Move up
        </DropdownMenuItem>

        <DropdownMenuItem :class="itemClass" :disabled="!canMoveDown" @select="emit('moveDown')">
          <PhArrowDown class="size-4" aria-hidden="true" />
          Move down
        </DropdownMenuItem>

        <DropdownMenuSeparator class="my-1 h-px bg-line" />

        <DropdownMenuItem :class="dangerItemClass" @select="emit('remove')">
          <PhTrash class="size-4" aria-hidden="true" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
