<script setup lang="ts">
import { Github, ExternalLink, Sun, Moon } from 'lucide-vue-next'

const colorMode = useColorMode()

const logoColors = computed(() => {
  const isDark = colorMode.value === 'dark'
  return {
    bg: isDark ? '#071A22' : '#F4FBFC',
    l1: isDark ? '#0E3A46' : '#0B2F38',
    l2: isDark ? '#1E6E7A' : '#136B76',
    l3: isDark ? '#3BB9C4' : '#1FB6C1',
    l4: isDark ? '#6FEFF5' : '#4FD1D9',
  }
})
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
    <div class="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
      <NuxtLink to="/" class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" class="h-6 w-6 rounded">
          <rect width="64" height="64" rx="14" :fill="logoColors.bg" />
          <ellipse cx="32" cy="48" rx="20" ry="7" :fill="logoColors.l1" />
          <ellipse cx="32" cy="38" rx="20" ry="7" :fill="logoColors.l2" />
          <ellipse cx="32" cy="28" rx="20" ry="7" :fill="logoColors.l3" />
          <ellipse cx="32" cy="18" rx="20" ry="7" :fill="logoColors.l4" />
        </svg>
        <span class="text-base font-medium">CleanSlice</span>
      </NuxtLink>

      <nav class="flex items-center gap-1">
        <NuxtLink
          to="/users"
          class="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Users
        </NuxtLink>
        <a
          href="https://cleanslice.org"
          target="_blank"
          class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Docs
          <ExternalLink class="size-3 opacity-50" />
        </a>
        <button
          class="ml-1 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
          @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
        >
          <Sun v-if="colorMode.value === 'dark'" class="size-4" />
          <Moon v-else class="size-4" />
        </button>
        <a
          href="https://github.com/CleanSlice/nest-nuxt-starter-kit"
          target="_blank"
          class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
        >
          <Github class="size-4" />
        </a>
      </nav>
    </div>
  </header>
</template>
