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
            <option value="">Tous les éditeurs</option>
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
          <p v-if="totalPages > 1" class="text-xs text-gray-600">Page {{ currentPage }} / {{ totalPages }}</p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <NuxtLink
            v-for="comic in displayedComics"
            :key="comic.id"
            :to="`/comics/${comic.externalId}`"
            class="group flex flex-col"
          >
            <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 mb-3 ring-1 ring-white/8 group-hover:ring-red-500/50 transition-all duration-200">
              <img :src="getComicCover(comic)" :alt="comic.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <span class="text-xs text-white font-medium">Voir le détail →</span>
              </div>
            </div>
            <p class="text-sm font-medium text-gray-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">{{ comic.title }}</p>
            <p v-if="comic.authors?.length" class="text-xs text-gray-600 mt-0.5 line-clamp-1">{{ comic.authors.join(', ') }}</p>
          </NuxtLink>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-1 mt-12">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1 || loading"
            class="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >← Préc.</button>

          <template v-for="p in pageNumbers" :key="p">
            <span v-if="p === '...'" class="px-2 py-2 text-gray-600 text-sm">…</span>
            <button
              v-else
              @click="goToPage(p)"
              :disabled="loading"
              class="w-9 h-9 rounded-lg text-sm font-medium transition"
              :class="p === currentPage ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'"
            >{{ p }}</button>
          </template>

          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages || loading"
            class="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >Suiv. →</button>
        </div>
      </template>

      <!-- Aucun résultat -->
      <div v-else-if="!loading" class="text-center py-24">
        <div class="text-5xl mb-4">🔍</div>
        <p class="text-gray-400 font-medium mb-1">Aucun résultat</p>
        <p class="text-gray-600 text-sm">Essaie d'autres critères de recherche.</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { getComicCover } from '~/utils/comicCover.js'
const config = useRuntimeConfig()
const base = config.public.apiBase

const PAGE_SIZE = 10

const query = ref('')
const selectedGenre = ref('')
const selectedAuthor = ref('')
const lastQuery = ref('')
const currentPage = ref(1)

const displayedComics = ref([])
const total = ref(0)
const loading = ref(false)
const error = ref('')

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))
const offset = computed(() => (currentPage.value - 1) * PAGE_SIZE)

// Numéros de pages à afficher (avec ellipsis)
const pageNumbers = computed(() => {
  const total = totalPages.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const cur = currentPage.value
  const pages = []
  pages.push(1)
  if (cur > 3) pages.push('...')
  for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

// Genres et auteurs disponibles
const { data: genres } = await useFetch(`${base}/comics/genres`)
const { data: authorNames } = await useFetch(`${base}/comics/author-names`)

// Chargement initial
await fetchComics()

async function fetchComics() {
  loading.value = true
  error.value = ''
  try {
    const params = {
      limit: PAGE_SIZE,
      offset: offset.value,
    }
    let data
    if (lastQuery.value.length >= 2) {
      data = await $fetch(`${base}/comics/search`, {
        params: { q: lastQuery.value, limit: PAGE_SIZE, offset: offset.value },
      })
    } else {
      if (selectedGenre.value) params.genre = selectedGenre.value
      if (selectedAuthor.value) params.author = selectedAuthor.value
      data = await $fetch(`${base}/comics`, { params })
    }
    displayedComics.value = data.comics
    total.value = data.total
  } catch (e) {
    error.value = e.data?.error || 'Erreur lors du chargement'
  } finally {
    loading.value = false
  }
}

async function doSearch() {
  const hasTextQuery = query.value.trim().length >= 2
  const hasFilters = selectedGenre.value || selectedAuthor.value
  lastQuery.value = hasTextQuery ? query.value.trim() : ''
  currentPage.value = 1
  if (!hasTextQuery && !hasFilters) {
    lastQuery.value = ''
  }
  await fetchComics()
}

async function goToPage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  await fetchComics()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function clearFilters() {
  query.value = ''
  selectedGenre.value = ''
  selectedAuthor.value = ''
  lastQuery.value = ''
  currentPage.value = 1
  fetchComics()
}
</script>
