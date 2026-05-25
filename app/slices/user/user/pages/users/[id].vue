<template>
  <div class="container mx-auto py-8 px-4">
    <UserProvider :id="id" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const id = computed(() => route.params.id as string);
</script>
