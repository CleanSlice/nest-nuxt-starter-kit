<script setup lang="ts">
import { Layers, Github, ExternalLink, Sun, Moon } from 'lucide-vue-next'

const colorMode = useColorMode()
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
    <div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
      <NuxtLink to="/" class="flex items-center gap-2.5">
        <div class="flex size-7 items-center justify-center rounded-lg bg-foreground">
          <Layers class="size-3.5 text-background" :stroke-width="2.5" />
        </div>
        <span class="text-sm font-semibold tracking-tight">CleanSlice</span>
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
