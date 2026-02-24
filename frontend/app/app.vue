<script setup>
const { data, pending, error } = await useFetch('http://localhost:3001/health')
</script>

<template>
  <main class="min-h-screen p-8">
    <h1 class="text-2xl font-bold">Comicster</h1>

    <p class="mt-6" v-if="pending">Chargement...</p>
    <p class="mt-6" v-else-if="error">Erreur : {{ error.message }}</p>
    <pre class="mt-6 rounded border p-4" v-else>{{ data }}</pre>
  </main>
</template>