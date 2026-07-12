<template>
  <div>

    <!-- Page header -->
    <div style="border-bottom:1px solid #1e1e1e;">
      <div class="max-w-[1100px] mx-auto px-6 pt-9 pb-0">
        <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:5px;color:#e02020;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:10px;">
          <div style="width:16px;height:2px;background:#e02020;flex-shrink:0;"></div>
          Bibliothèque · {{ total }} comics
        </div>
        <div style="font-family:impact,sans-serif;font-size:52px;letter-spacing:1px;color:#fff;text-transform:uppercase;line-height:1;padding-bottom:18px;">EXPLORER</div>
      </div>
    </div>

    <!-- Search bar -->
    <div style="border-bottom:1px solid #1e1e1e;">
      <div class="max-w-[1100px] mx-auto px-6 py-5">
        <form @submit.prevent="doSearch" style="display:flex;">
          <div style="flex:1;display:flex;align-items:stretch;border:1px solid #2a2a2a;border-right:none;">
            <input
              v-model="query"
              type="text"
              placeholder="Titre, auteur, éditeur…"
              style="flex:1;background:transparent;border:none;color:#fff;font-family:'Courier New',monospace;font-size:14px;letter-spacing:1px;padding:14px 16px;outline:none;"
            />
          </div>
          <button
            type="submit"
            :disabled="loading"
            class="btn-primary"
            style="border-radius:0;padding:0 28px;flex-shrink:0;font-size:13px;"
            :style="loading ? 'opacity:0.4;' : ''"
          >{{ loading ? '…' : 'RECHERCHER ▶' }}</button>
        </form>
      </div>
    </div>

    <!-- Filters strip -->
    <div style="border-bottom:1px solid #1e1e1e;">
      <div class="max-w-[1100px] mx-auto px-6" style="display:flex;align-items:center;height:44px;">
        <span style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;color:#fff;text-transform:uppercase;padding-right:20px;border-right:1px solid #1e1e1e;flex-shrink:0;">FILTRES</span>
        <select
          v-model="selectedGenre"
          @change="doSearch"
          style="background:transparent;border:none;border-right:1px solid #1e1e1e;color:#fff;font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:0 32px 0 16px;height:44px;outline:none;cursor:pointer;appearance:none;background-image:url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%276%27 fill=%27none%27%3E%3Cpath stroke=%27%23555%27 stroke-width=%271.5%27 d=%27M1 1l4 4 4-4%27/%3E%3C/svg%3E');background-repeat:no-repeat;background-position:right 12px center;"
        >
          <option value="" style="background:#111;">Tous les genres</option>
          <option v-for="g in genres" :key="g" :value="g" style="background:#111;">{{ g }}</option>
        </select>
        <select
          v-model="selectedAuthor"
          @change="doSearch"
          style="background:transparent;border:none;border-right:1px solid #1e1e1e;color:#fff;font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:0 32px 0 16px;height:44px;outline:none;cursor:pointer;appearance:none;background-image:url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%276%27 fill=%27none%27%3E%3Cpath stroke=%27%23555%27 stroke-width=%271.5%27 d=%27M1 1l4 4 4-4%27/%3E%3C/svg%3E');background-repeat:no-repeat;background-position:right 12px center;"
        >
          <option value="" style="background:#111;">Tous les éditeurs</option>
          <option v-for="a in authorNames" :key="a" :value="a" style="background:#111;">{{ a }}</option>
        </select>
        <button
          v-if="selectedGenre || selectedAuthor || query"
          @click="clearFilters"
          class="btn-ghost"
          style="margin-left:auto;font-size:10px;letter-spacing:3px;padding:6px 14px;"
        >× RÉINITIALISER</button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="max-w-[1100px] mx-auto px-6 mt-6">
      <div style="display:flex;align-items:center;gap:8px;background:rgba(224,32,32,0.08);border:1px solid rgba(224,32,32,0.2);padding:12px 16px;font-family:'Courier New',monospace;font-size:13px;color:#e02020;">
        ⚠ {{ error }}
      </div>
    </div>

    <!-- Results -->
    <template v-if="displayedComics.length">

      <!-- Results meta -->
      <div class="max-w-[1100px] mx-auto px-6 py-5" style="display:flex;justify-content:space-between;align-items:center;">
        <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;color:#fff;text-transform:uppercase;">
          <span style="font-family:impact,sans-serif;font-size:14px;letter-spacing:1px;color:#e02020;">{{ total }}</span>
          &nbsp;résultat{{ total > 1 ? 's' : '' }}
          <span v-if="lastQuery"> pour "{{ lastQuery }}"</span>
          <span v-if="selectedGenre"> · {{ selectedGenre }}</span>
          <span v-if="selectedAuthor"> · {{ selectedAuthor }}</span>
        </div>
        <div v-if="totalPages > 1" style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;color:#fff;text-transform:uppercase;">
          Page {{ currentPage }} / {{ totalPages }}
        </div>
      </div>

      <!-- Comics grid -->
      <div class="max-w-[1100px] mx-auto px-6 pb-12" style="display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:#1a1a1a;">
        <NuxtLink
          v-for="comic in displayedComics"
          :key="comic.id"
          :to="`/comics/${comic.externalId}`"
          class="group"
          style="background:#0f0f0f;display:flex;flex-direction:column;text-decoration:none;overflow:hidden;"
        >
          <!-- Cover -->
          <div style="aspect-ratio:2/3;position:relative;overflow:hidden;background:#1a1a1a;">
            <img
              :src="getComicCover(comic)"
              :alt="comic.title"
              class="w-full h-full object-cover block group-hover:scale-[1.03]"
              style="transition:transform 0.2s;"
              loading="lazy"
            />
            <!-- Hover overlay -->
            <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.85) 0%,transparent 50%);display:flex;align-items:flex-end;padding:10px;opacity:0;transition:opacity 0.2s;" class="group-hover:opacity-100">
              <span style="font-family:impact,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#e02020;">VOIR →</span>
            </div>
          </div>
          <!-- Info strip -->
          <div style="padding:10px 12px 14px;border-top:1px solid #1a1a1a;flex:1;">
            <div style="font-family:impact,sans-serif;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;color:#fff;line-height:1.15;margin-bottom:5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">{{ comic.title }}</div>
            <div v-if="comic.authors?.length" style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:1px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px;">{{ comic.authors.join(', ') }}</div>
            <div v-if="comic.avgRating" style="font-family:'Courier New',monospace;font-size:11px;color:#fbbf24;">{{ comic.avgRating.toFixed(1) }} ★</div>
          </div>
        </NuxtLink>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="max-w-[1100px] mx-auto px-6 pb-14" style="display:flex;align-items:center;border-top:1px solid #1e1e1e;padding-top:24px;margin-top:0;">
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1 || loading"
          style="background:transparent;border:1px solid #1e1e1e;border-right:none;color:#fff;font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:9px 16px;cursor:pointer;border-radius:0;"
          :style="(currentPage === 1 || loading) ? 'opacity:0.25;cursor:not-allowed;' : ''"
        >← PRÉC</button>

        <template v-for="p in pageNumbers" :key="p">
          <span
            v-if="p === '...'"
            style="padding:9px 10px;color:#fff;font-size:10px;font-family:'Courier New',monospace;border:1px solid #1e1e1e;border-right:none;"
          >…</span>
          <button
            v-else
            @click="goToPage(p)"
            :disabled="loading"
            style="background:transparent;border:1px solid #1e1e1e;border-right:none;font-family:'Courier New',monospace;font-size:10px;letter-spacing:1px;padding:9px 14px;cursor:pointer;border-radius:0;transition:background 0.15s,color 0.15s;"
            :style="p === currentPage ? 'background:#e02020;color:#fff;border-color:#e02020;' : 'color:#fff;'"
          >{{ p }}</button>
        </template>

        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages || loading"
          style="background:transparent;border:1px solid #1e1e1e;color:#fff;font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:9px 16px;cursor:pointer;border-radius:0;"
          :style="(currentPage === totalPages || loading) ? 'opacity:0.25;cursor:not-allowed;' : ''"
        >SUIV →</button>
      </div>

    </template>

    <!-- Empty state -->
    <div v-else-if="!loading" style="text-align:center;padding:96px 24px;">
      <div style="font-family:impact,sans-serif;font-size:48px;letter-spacing:2px;text-transform:uppercase;color:#1e1e1e;margin-bottom:14px;">AUCUN RÉSULTAT</div>
      <div style="font-family:'Courier New',monospace;font-size:12px;letter-spacing:3px;color:#fff;text-transform:uppercase;">Essaie d'autres critères de recherche.</div>
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
