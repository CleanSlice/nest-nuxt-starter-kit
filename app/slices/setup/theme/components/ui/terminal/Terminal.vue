<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { TerminalVariants } from '.'
import { cn } from '#theme/utils'
import { terminalVariants } from '.'

interface Props {
  title?: string
  variant?: TerminalVariants['variant']
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  title: 'terminal',
})
</script>

<template>
  <div :class="cn(terminalVariants({ variant }), props.class)">
    <div class="flex items-center gap-1.5 border-b border-border/40 px-4 py-2.5">
      <span class="size-2.5 rounded-full bg-border" />
      <span class="size-2.5 rounded-full bg-border" />
      <span class="size-2.5 rounded-full bg-border" />
      <span v-if="title" class="ml-2 text-[11px] text-muted-foreground/60">{{ title }}</span>
    </div>
    <div class="divide-y divide-border/20">
      <slot />
    </div>
  </div>
</template>
