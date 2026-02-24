<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import type { IconVariants } from './variants'
import { cn } from '#theme/utils'
import { iconVariants, resolveIcon } from './variants'

interface Props {
  icon?: Component
  name?: string
  size?: IconVariants['size']
  strokeWidth?: number
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  strokeWidth: 2,
})

const resolvedIcon = computed(() => {
  if (props.icon) return props.icon
  if (props.name) return resolveIcon(props.name)
  return undefined
})
</script>

<template>
  <component
    v-if="resolvedIcon"
    :is="resolvedIcon"
    :class="cn(iconVariants({ size }), props.class)"
    :stroke-width="strokeWidth"
  />
</template>
