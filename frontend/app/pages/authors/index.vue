<template>
  <div class="min-h-screen px-4 sm:px-6 py-12">
    <div class="max-w-5xl mx-auto">

      <div class="mb-10">
        <h1 class="text-3xl font-bold mb-1">Auteurs</h1>
        <p class="text-white text-sm">Découvrez les créateurs derrière vos comics préférés</p>
      </div>

      <div v-if="pending" class="flex justify-center py-20 text-white">Chargement…</div>

      <div v-else-if="authors?.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        <NuxtLink
          v-for="author in authors"
          :key="author.id"
          :to="`/authors/${author.slug}`"
          class="card p-5 hover:border-red-500/30 transition group flex items-center gap-4"
        >
          <div class="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-2xl shrink-0 group-hover:border-red-500/30 transition">
            ✍️
          </div>
          <div class="min-w-0">
            <p class="font-semibold text-white group-hover:text-white transition truncate">{{ author.name }}</p>
            <p class="text-[13px] text-white mt-0.5">{{ author.comicCount }} comic{{ author.comicCount > 1 ? 's' : '' }}</p>
          </div>
        </NuxtLink>
      </div>

      <div v-else class="text-center py-24 text-white">
        <div class="text-4xl mb-3">✍️</div>
        <p>Aucun auteur disponible pour l'instant.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const config = useRuntimeConfig()
const base = config.public.apiBase

// `default` évite un `undefined` si la requête échoue : sans lui, `authors.length`
// jetait un TypeError et la page entière partait en 500.
const { data: authors, pending, refresh } = await useFetch(`${base}/authors`, {
  default: () => [],
})

// En local, le conteneur frontend n'atteint pas l'API sur `localhost:3001` au rendu
// serveur. Le fetch échouait, la valeur par défaut était sérialisée vers le client,
// et la page restait sur « Aucun auteur disponible » alors que l'API en renvoyait 36.
// On rejoue donc la requête depuis le navigateur quand le serveur n'a rien ramené —
// sans renoncer au rendu serveur là où il fonctionne (dev, sandbox, prod).
onMounted(() => {
  if (!authors.value?.length) refresh()
})
</script>
