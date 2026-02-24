<script setup lang="ts">
import {
  Layers, Shield, Database, Component,
  Code2, Box, ArrowRight,
  ChevronRight, Terminal as TerminalIcon, Cpu, Puzzle,
} from 'lucide-vue-next'

const features = [
  {
    icon: Layers,
    title: 'Vertical Slices',
    description: 'Each feature is a self-contained folder. Add a feature by adding a slice. Delete it by removing one.',
  },
  {
    icon: Shield,
    title: 'Clean Architecture',
    description: 'Three layers — Presentation, Domain, Data. Dependencies point inward. Domain stays framework-free.',
  },
  {
    icon: Database,
    title: 'Gateway Pattern',
    description: 'Abstract in domain, concrete in data. Prisma IS the repository — no extra abstraction layer.',
  },
  {
    icon: Component,
    title: 'Provider.vue',
    description: 'Every component folder has a Provider that fetches data. Children receive it via props.',
  },
  {
    icon: Code2,
    title: 'Type-safe API',
    description: 'Auto-generated TypeScript SDK from Swagger. Change the backend, regenerate, catch errors at compile time.',
  },
  {
    icon: Box,
    title: 'Full Stack',
    description: 'NestJS + Prisma backend. Nuxt + Vue + Pinia frontend. Same conventions across the entire stack.',
  },
]

const stack = ['NestJS', 'Prisma', 'Nuxt 3', 'Vue 3', 'Pinia', 'Tailwind CSS', 'shadcn-vue']

const setupSteps = [
  {
    icon: Cpu,
    step: '1',
    title: 'Add the MCP Server',
    description: 'Connect Claude Code to the CleanSlice architecture docs, conventions, and patterns.',
    command: 'claude mcp add --scope user --transport http cleanslice https://mcp.cleanslice.org/mcp',
  },
  {
    icon: Puzzle,
    step: '2',
    title: 'Install Skills',
    description: 'Run the setup skill to install shadcn-vue, cleanslice, and conventional-commits.',
    command: '/setup',
  },
  {
    icon: TerminalIcon,
    step: '3',
    title: 'Start Building',
    description: 'Claude Code now understands CleanSlice. Ask it to create slices, gateways, and more.',
    command: 'claude',
  },
]

</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden">
      <div class="hero-grid absolute inset-0 opacity-[0.03]" />
      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

      <div class="relative mx-auto max-w-5xl px-6 pb-24 pt-28">
        <div class="flex flex-col items-center text-center">
          <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3.5 py-1.5 text-xs text-muted-foreground">
            <span class="flex size-1.5 rounded-full bg-emerald-500" />
            Starter Kit
          </div>

          <h1 class="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Architecture that
            <span class="text-muted-foreground">scales.</span>
          </h1>

          <p class="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Full-stack starter kit built on vertical slices and clean architecture.
            NestJS backend, Nuxt frontend, unified conventions.
          </p>

          <div class="mt-8 flex items-center gap-3">
            <Button size="lg" as-child>
              <NuxtLink to="/users">
                Explore Demo
                <ArrowRight class="ml-1 size-4" />
              </NuxtLink>
            </Button>
            <Button variant="outline" size="lg" as-child>
              <a href="https://cleanslice.org" target="_blank">
                Documentation
              </a>
            </Button>
          </div>

          <!-- Terminal -->
          <Terminal class="mt-12 w-full max-w-md">
            <TerminalLine command="git clone <repo-url> my-project" />
          </Terminal>
        </div>
      </div>
    </section>

    <!-- Stack -->
    <section class="border-y border-border/40 bg-muted/30">
      <div class="mx-auto max-w-5xl px-6 py-5">
        <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <span
            v-for="tech in stack"
            :key="tech"
            class="text-xs font-medium tracking-wide text-muted-foreground/70 uppercase"
          >
            {{ tech }}
          </span>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="mx-auto max-w-5xl px-6 py-24">
      <div class="mb-12 text-center">
        <h2 class="text-2xl font-semibold tracking-tight sm:text-3xl">
          Everything in its place
        </h2>
        <p class="mt-3 text-muted-foreground">
          Conventions that keep your codebase clean as it grows.
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="group rounded-xl border border-border/50 bg-card/50 p-6 transition-colors hover:border-border hover:bg-card"
        >
          <div class="mb-4 flex size-10 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground transition-colors group-hover:text-foreground">
            <component :is="feature.icon" class="size-5" :stroke-width="1.5" />
          </div>
          <h3 class="text-sm font-semibold">{{ feature.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
            {{ feature.description }}
          </p>
        </div>
      </div>
    </section>

    <!-- Architecture -->
    <section class="border-y border-border/40 bg-muted/20">
      <div class="mx-auto max-w-5xl px-6 py-24">
        <div class="mb-12 text-center">
          <h2 class="text-2xl font-semibold tracking-tight sm:text-3xl">
            Three layers, one direction
          </h2>
          <p class="mt-3 text-muted-foreground">
            Dependencies always point inward. The domain never knows about frameworks.
          </p>
        </div>

        <div class="mx-auto max-w-2xl">
          <div class="rounded-xl border border-border/60 bg-card/50 overflow-hidden">
            <div class="border-b border-border/40 px-5 py-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Layers class="size-3.5" />
              <span class="font-mono">slices/user/</span>
            </div>

            <div class="divide-y divide-border/30">
              <!-- Presentation -->
              <div class="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/30">
                <div class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <ChevronRight class="size-4" />
                </div>
                <div>
                  <div class="text-sm font-medium">Presentation</div>
                  <div class="mt-0.5 text-xs text-muted-foreground">
                    Controllers, pages, components — HTTP and UI concerns only
                  </div>
                  <div class="mt-2 flex flex-wrap gap-1.5">
                    <code class="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">user.controller.ts</code>
                    <code class="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">Provider.vue</code>
                    <code class="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">users.vue</code>
                  </div>
                </div>
              </div>

              <!-- Domain -->
              <div class="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/30">
                <div class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Shield class="size-4" />
                </div>
                <div>
                  <div class="text-sm font-medium">Domain</div>
                  <div class="mt-0.5 text-xs text-muted-foreground">
                    Business rules, types, abstract gateways — no framework imports
                  </div>
                  <div class="mt-2 flex flex-wrap gap-1.5">
                    <code class="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">user.types.ts</code>
                    <code class="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">user.gateway.ts</code>
                    <code class="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">user.service.ts</code>
                  </div>
                </div>
              </div>

              <!-- Data -->
              <div class="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/30">
                <div class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Database class="size-4" />
                </div>
                <div>
                  <div class="text-sm font-medium">Data</div>
                  <div class="mt-0.5 text-xs text-muted-foreground">
                    Concrete gateways, mappers — Prisma, APIs, external services
                  </div>
                  <div class="mt-2 flex flex-wrap gap-1.5">
                    <code class="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">user.gateway.ts</code>
                    <code class="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">user.mapper.ts</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Claude Code Setup -->
    <section class="mx-auto max-w-5xl px-6 py-24">
      <div class="mb-12 text-center">
        <h2 class="text-2xl font-semibold tracking-tight sm:text-3xl">
          Set up Claude Code
        </h2>
        <p class="mt-3 text-muted-foreground">
          Three commands to give Claude full context of your architecture.
        </p>
      </div>

      <div class="mx-auto max-w-2xl space-y-4">
        <div
          v-for="step in setupSteps"
          :key="step.step"
          class="group rounded-xl border border-border/50 bg-card/50 overflow-hidden transition-colors hover:border-border hover:bg-card"
        >
          <div class="flex items-start gap-4 px-5 py-4">
            <div class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground/5 text-muted-foreground transition-colors group-hover:text-foreground">
              <component :is="step.icon" class="size-4" :stroke-width="1.5" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="flex size-5 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
                  {{ step.step }}
                </span>
                <span class="text-sm font-medium">{{ step.title }}</span>
              </div>
              <p class="mt-1 text-xs text-muted-foreground">
                {{ step.description }}
              </p>
              <TerminalLine :command="step.command" class="mt-3 rounded-lg border border-border/40 bg-background/80 px-3 py-2 text-xs" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="mx-auto max-w-5xl px-6 py-24 text-center">
      <h2 class="text-2xl font-semibold tracking-tight sm:text-3xl">
        Start building
      </h2>
      <p class="mt-3 text-muted-foreground">
        Clone the starter kit, add your slices, ship your product.
      </p>
      <div class="mt-8 flex items-center justify-center gap-3">
        <Button size="lg" as-child>
          <a href="https://cleanslice.org" target="_blank">
            Read the Docs
            <ArrowRight class="ml-1 size-4" />
          </a>
        </Button>
        <Button variant="outline" size="lg" as-child>
          <a href="https://github.com/CleanSlice/nest-nuxt-starter-kit" target="_blank">
            View on GitHub
          </a>
        </Button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero-grid {
  background-image:
    linear-gradient(to right, currentColor 1px, transparent 1px),
    linear-gradient(to bottom, currentColor 1px, transparent 1px);
  background-size: 48px 48px;
}
</style>
