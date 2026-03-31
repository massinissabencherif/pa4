<template>
  <div class="min-h-screen px-4 sm:px-6 py-12">
    <div class="max-w-6xl mx-auto">

      <!-- En-tête -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold mb-1">Explorer les comics</h1>
        <p class="text-gray-500 text-sm">Recherche dans la bibliothèque</p>
      </div>

      <!-- Barre de recherche + filtres -->
      <div class="flex flex-col gap-4 mb-8">
        <form @submit.prevent="doSearch" class="flex gap-3 max-w-xl">
          <div class="relative flex-1">
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input v-model="query" type="text" placeholder="Titre, auteur…" class="input pl-11" />
          </div>
          <button type="submit" :disabled="loading" class="btn-primary !px-6 shrink-0 disabled:opacity-40">
            {{ loading ? '…' : 'Rechercher' }}
          </button>
        </form>

        <!-- Filtres -->
        <div class="flex flex-wrap gap-3">
          <select v-model="selectedGenre" @change="doSearch" class="input !w-auto text-sm">
            <option value="">Tous les genres</option>
            <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
          </select>
          <select v-model="selectedAuthor" @change="doSearch" class="input !w-auto text-sm">
            <option value="">Tous les auteurs</option>
            <option v-for="a in authorNames" :key="a" :value="a">{{ a }}</option>
          </select>
          <button
            v-if="selectedGenre || selectedAuthor || query"
            @click="clearFilters"
            class="text-xs text-gray-500 hover:text-white transition px-3 py-2 rounded-lg border border-white/10 hover:border-white/20"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      <!-- Erreur -->
      <div v-if="error" class="card p-4 border-red-500/20 bg-red-500/5 text-sm text-red-400 mb-8">{{ error }}</div>

      <!-- Résultats / grille -->
      <template v-if="displayedComics.length">
        <div class="flex items-center justify-between mb-5">
          <p class="text-sm text-gray-500">
            {{ total }} résultat{{ total > 1 ? 's' : '' }}
            <span v-if="lastQuery" class="text-gray-300 font-medium"> pour "{{ lastQuery }}"</span>
            <span v-if="selectedGenre" class="text-gray-300 font-medium"> · {{ selectedGenre }}</span>
            <span v-if="selectedAuthor" class="text-gray-300 font-medium"> · {{ selectedAuthor }}</span>
          </p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <NuxtLink
            v-for="comic in displayedComics"
            :key="comic.id"
            :to="`/comics/${comic.externalId}`"
            class="group flex flex-col"
          >
            <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 mb-3 ring-1 ring-white/8 group-hover:ring-red-500/50 transition-all duration-200">
              <img v-if="comic.coverUrl" :src="comic.coverUrl" :alt="comic.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              <div v-else class="w-full h-full flex items-center justify-center text-4xl text-gray-700">📚</div>
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <span class="text-xs text-white font-medium">Voir le détail →</span>
              </div>
            </div>
            <p class="text-sm font-medium text-gray-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">{{ comic.title }}</p>
            <p v-if="comic.authors?.length" class="text-xs text-gray-600 mt-0.5 line-clamp-1">{{ comic.authors.join(', ') }}</p>
          </NuxtLink>
        </div>

        <!-- Load more (recherche par texte) -->
        <div v-if="searched && displayedComics.length < total" class="flex justify-center mt-12">
          <button @click="loadMore" :disabled="loading" class="btn-ghost !px-8 disabled:opacity-40">
            <span v-if="loading">Chargement…</span>
            <span v-else>Voir plus ({{ total - displayedComics.length }} restants)</span>
          </button>
        </div>
      </template>

      <!-- Aucun résultat -->
      <div v-else-if="(searched || selectedGenre || selectedAuthor) && !loading" class="text-center py-24">
        <div class="text-5xl mb-4">🔍</div>
        <p class="text-gray-400 font-medium mb-1">Aucun résultat</p>
        <p class="text-gray-600 text-sm">Essaie d'autres critères de recherche.</p>
      </div>

    </div>
  </div>
</template>

<script setup>
const config = useRuntimeConfig()
const base = config.public.apiBase

const query = ref('')
const selectedGenre = ref('')
const selectedAuthor = ref('')
const lastQuery = ref('')

const results = ref([])
const allComics = ref([])
const total = ref(0)
const offset = ref(0)
const loading = ref(false)
const error = ref('')
const searched = ref(false)

// Genres et auteurs disponibles
const { data: genres } = await useFetch(`${base}/comics/genres`)
const { data: authorNames } = await useFetch(`${base}/comics/author-names`)

// Charger tous les comics au montage
const { data: initialData } = await useFetch(`${base}/comics`, { params: { limit: 100 } })
if (initialData.value) {
  allComics.value = initialData.value.comics
  total.value = initialData.value.total
}

// Comics affichés selon l'état
const displayedComics = computed(() => searched.value ? results.value : allComics.value)

async function doSearch() {
  const hasTextQuery = query.value.trim().length >= 2
  const hasFilters = selectedGenre.value || selectedAuthor.value

  if (!hasTextQuery && !hasFilters) {
    searched.value = false
    return
  }

  results.value = []
  offset.value = 0
  searched.value = true
  lastQuery.value = query.value.trim()
  await fetchComics(false)
}

async function loadMore() {
  offset.value += 20
  await fetchComics(true)
}

async function fetchComics(append = false) {
  loading.value = true
  error.value = ''

  try {
    let data
    if (lastQuery.value.length >= 2) {
      data = await $fetch(`${base}/comics/search`, {
        params: { q: lastQuery.value, limit: 20, offset: offset.value },
      })
    } else {
      data = await $fetch(`${base}/comics`, {
        params: {
          limit: 100,
          offset: 0,
          genre: selectedGenre.value || undefined,
          author: selectedAuthor.value || undefined,
        },
      })
    }
    total.value = data.total
    results.value = append ? [...results.value, ...data.comics] : data.comics
  } catch (e) {
    error.value = e.data?.error || 'Erreur lors de la recherche'
  } finally {
    loading.value = false
  }
}

function clearFilters() {
  query.value = ''
  selectedGenre.value = ''
  selectedAuthor.value = ''
  searched.value = false
  results.value = []
  lastQuery.value = ''
}
</script>
