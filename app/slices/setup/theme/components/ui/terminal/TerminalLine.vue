<script setup lang="ts">
import { Copy, Check } from 'lucide-vue-next'
import type { HTMLAttributes } from 'vue'
import { cn } from '#theme/utils'

interface Props {
  command: string
  prompt?: string
  copyable?: boolean
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  prompt: '$',
  copyable: true,
})

const copied = ref(false)

function copy() {
  navigator.clipboard.writeText(props.command)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <div :class="cn('flex items-center justify-between gap-2 px-4 py-3', props.class)">
    <code class="flex-1 truncate text-sm text-muted-foreground">
      <span class="text-foreground/40">{{ prompt }}</span>
      {{ ' ' }}{{ command }}
    </code>
    <button
      v-if="copyable"
      class="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
      @click="copy"
    >
      <Check v-if="copied" class="size-3.5 text-emerald-500" />
      <Copy v-else class="size-3.5" />
    </button>
  </div>
</template>
