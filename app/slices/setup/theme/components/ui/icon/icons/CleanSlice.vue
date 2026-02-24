<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

interface Props {
  size?: number | string
  strokeWidth?: number | string
  class?: HTMLAttributes['class']
}

withDefaults(defineProps<Props>(), {
  strokeWidth: 2,
})
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="$props.class"
  >
    <ellipse cx="12" cy="5" rx="9" ry="3.0" />
    <path d="M3 11.0 a10 3.5 0 0 0 18 0" />
    <path d="M3 16.0 a10 3.5 0 0 0 18 0" />
    <path d="M3 21.0 a10 3.5 0 0 0 18 0" />
  </svg>
</template>
