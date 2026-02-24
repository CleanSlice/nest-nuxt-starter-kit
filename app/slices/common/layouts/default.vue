<template>
  <div class="min-h-screen flex flex-col bg-background text-foreground">
    <CommonHeader />

    <main class="flex-1">
      <slot />
    </main>

    <CommonFooter />
  </div>
</template>
