<template>
  <div class="min-h-screen px-4 sm:px-6 py-12">
    <div class="max-w-5xl mx-auto">

      <!-- En-tête -->
      <div class="mb-10">
        <h1 class="text-3xl font-bold mb-1">Mon journal</h1>
        <p class="text-gray-500 text-sm">Tous tes comics suivis, avec leur statut et tes notes.</p>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="flex items-center gap-3 text-gray-500 py-16">
        <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Chargement…
      </div>

      <template v-else>
        <!-- Filtres -->
        <div class="flex flex-wrap gap-2 mb-8">
          <button
            v-for="f in filters"
            :key="f.value"
            @click="activeFilter = f.value"
            class="px-4 py-1.5 rounded-full text-sm transition-all border"
            :class="activeFilter === f.value
              ? 'bg-red-600 border-red-600 text-white'
              : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'"
          >
            {{ f.label }}
            <span class="ml-1.5 text-xs opacity-60">{{ countFor(f.value) }}</span>
          </button>
        </div>

        <!-- Liste vide -->
        <div v-if="!filtered.length" class="text-center py-24">
          <div class="text-5xl mb-4">📖</div>
          <p class="text-gray-400 font-medium mb-1">
            {{ activeFilter === 'ALL' ? 'Ton journal est vide' : 'Aucun comic dans cette catégorie' }}
          </p>
          <p class="text-gray-600 text-sm mb-6">
            {{ activeFilter === 'ALL' ? 'Commence par explorer des comics et ajoute-les à ta liste.' : '' }}
          </p>
          <NuxtLink v-if="activeFilter === 'ALL'" to="/comics/search" class="btn-primary !px-6">
            Explorer les comics
          </NuxtLink>
        </div>

        <!-- Grille -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="entry in filtered"
            :key="entry.id"
            class="card p-4 flex gap-4 hover:border-white/15 transition-all group"
          >
            <!-- Cover -->
            <NuxtLink :to="`/comics/${entry.comic.externalId}`" class="shrink-0">
              <div class="w-14 aspect-[2/3] rounded-lg overflow-hidden bg-white/5 ring-1 ring-white/8">
                <img
                  v-if="entry.comic.coverUrl"
                  :src="entry.comic.coverUrl"
                  :alt="entry.comic.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-xl text-gray-700">📚</div>
              </div>
            </NuxtLink>

            <!-- Infos -->
            <div class="flex-1 min-w-0">
              <NuxtLink :to="`/comics/${entry.comic.externalId}`">
                <p class="font-medium text-sm text-gray-200 line-clamp-2 leading-snug hover:text-white transition-colors mb-2">
                  {{ entry.comic.title }}
                </p>
              </NuxtLink>

              <!-- Statut -->
              <select
                v-model="entry.status"
                @change="updateStatus(entry)"
                class="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-400 focus:outline-none cursor-pointer mb-2 w-full"
              >
                <option value="TO_READ">📌 À lire</option>
                <option value="IN_PROGRESS">📖 En cours</option>
                <option value="FINISHED">✅ Terminé</option>
              </select>

              <!-- Note existante -->
              <div v-if="reviewMap[entry.comicId]" class="flex items-center gap-1 mb-1">
                <span class="text-yellow-400 text-xs">{{ '★'.repeat(reviewMap[entry.comicId].rating) }}</span>
                <span class="text-gray-700 text-xs">{{ '★'.repeat(5 - reviewMap[entry.comicId].rating) }}</span>
              </div>

              <!-- Dates -->
              <div class="text-xs text-gray-700 space-y-0.5">
                <div v-if="entry.startedAt">Commencé le {{ fmt(entry.startedAt) }}</div>
                <div v-if="entry.finishedAt">Terminé le {{ fmt(entry.finishedAt) }}</div>
              </div>
            </div>

            <!-- Supprimer -->
            <button
              @click="removeEntry(entry)"
              class="shrink-0 self-start text-gray-700 hover:text-red-400 transition p-1"
              title="Retirer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

const config = useRuntimeConfig()
const base = config.public.apiBase
const { token } = useAuth()

function authHeaders() {
  return token.value ? { Authorization: `Bearer ${token.value}` } : {}
}

// Chargement des données
const pending = ref(true)
const entries = ref([])
const reviewMap = ref({}) // comicId → review

async function load() {
  pending.value = true
  try {
    const history = await $fetch(`${base}/history`, { headers: authHeaders() })
    entries.value = history

    const { user } = useAuth()
    const rMap = {}
    await Promise.all(
      history.map(async (e) => {
        try {
          const comicReviews = await $fetch(`${base}/reviews/comic/${e.comicId}`)
          const mine = comicReviews.find(r => r.userId === user.value?.id)
          if (mine) rMap[e.comicId] = mine
        } catch {}
      })
    )
    reviewMap.value = rMap
  } catch {}
  pending.value = false
}

onMounted(load)

// Filtres
const activeFilter = ref('ALL')
const filters = [
  { value: 'ALL', label: 'Tout' },
  { value: 'TO_READ', label: 'À lire' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'FINISHED', label: 'Terminé' },
]

const filtered = computed(() =>
  activeFilter.value === 'ALL'
    ? entries.value
    : entries.value.filter(e => e.status === activeFilter.value)
)

function countFor(val) {
  if (val === 'ALL') return entries.value.length
  return entries.value.filter(e => e.status === val).length
}

// Actions
async function updateStatus(entry) {
  try {
    const updated = await $fetch(`${base}/reading-list/${entry.id}/status`, {
      method: 'PATCH',
      body: { status: entry.status },
      headers: authHeaders(),
    })
    const idx = entries.value.findIndex(e => e.id === entry.id)
    if (idx !== -1) entries.value[idx] = { ...entries.value[idx], ...updated }
  } catch {}
}

async function removeEntry(entry) {
  try {
    await $fetch(`${base}/reading-list/${entry.id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    entries.value = entries.value.filter(e => e.id !== entry.id)
  } catch {}
}

function fmt(date) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>
