<template>
  <div class="min-h-screen px-4 sm:px-6 py-12">
    <div class="max-w-4xl mx-auto">

      <!-- En-tête -->
      <div class="mb-10">
        <h1 class="text-3xl font-bold mb-1">Mes avis</h1>
        <p class="text-gray-500 text-sm">Tous les comics que tu as notés.</p>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="flex items-center gap-3 text-gray-500 py-16">
        <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Chargement…
      </div>

      <!-- Vide -->
      <div v-else-if="!reviews.length" class="text-center py-24">
        <div class="text-5xl mb-4">⭐</div>
        <p class="text-gray-400 font-medium mb-1">Aucun avis pour l'instant</p>
        <p class="text-gray-600 text-sm mb-6">Explore des comics et laisse tes premières notes.</p>
        <NuxtLink to="/comics/search" class="btn-primary !px-6">Explorer les comics</NuxtLink>
      </div>

      <!-- Liste des avis -->
      <div v-else class="space-y-4">
        <div
          v-for="review in reviews"
          :key="review.id"
          class="card p-5 hover:border-white/15 transition-all"
        >
          <div class="flex gap-4">

            <!-- Cover comic -->
            <NuxtLink :to="`/comics/${review.comic.externalId}`" class="shrink-0">
              <div class="w-16 aspect-[2/3] rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/8 hover:ring-red-500/40 transition-all">
                <img
                  v-if="review.comic.coverUrl"
                  :src="review.comic.coverUrl"
                  :alt="review.comic.title"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-2xl text-gray-700">📚</div>
              </div>
            </NuxtLink>

            <!-- Contenu -->
            <div class="flex-1 min-w-0">

              <!-- Mode lecture -->
              <template v-if="editingId !== review.id">
                <NuxtLink :to="`/comics/${review.comic.externalId}`" class="group">
                  <p class="font-semibold text-gray-100 group-hover:text-white transition-colors line-clamp-1 mb-1">
                    {{ review.comic.title }}
                  </p>
                </NuxtLink>

                <!-- Étoiles -->
                <div class="flex items-center gap-2 mb-2">
                  <div class="flex gap-0.5">
                    <span
                      v-for="s in 5"
                      :key="s"
                      class="text-lg leading-none"
                      :class="s <= review.rating ? 'text-yellow-400' : 'text-gray-700'"
                    >★</span>
                  </div>
                  <span class="text-xs text-gray-600">{{ review.rating }}/5</span>
                </div>

                <!-- Texte de l'avis -->
                <p v-if="review.content" class="text-sm text-gray-400 leading-relaxed mb-3">
                  {{ review.content }}
                </p>
                <p v-else class="text-sm text-gray-700 italic mb-3">Aucun commentaire</p>

                <!-- Date + actions -->
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-700">
                    {{ fmt(review.updatedAt) }}
                  </span>
                  <div class="flex items-center gap-4">
                    <button
                      @click="startEdit(review)"
                      class="text-xs text-gray-600 hover:text-yellow-400 transition"
                    >
                      Modifier
                    </button>
                    <button
                      @click="deleteReview(review)"
                      class="text-xs text-gray-600 hover:text-red-400 transition"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </template>

              <!-- Mode édition inline -->
              <template v-else>
                <p class="font-semibold text-gray-100 line-clamp-1 mb-3">{{ review.comic.title }}</p>

                <!-- Étoiles éditables -->
                <div class="flex gap-1 mb-3">
                  <button
                    v-for="s in 5"
                    :key="s"
                    @click="editForm.rating = s"
                    class="text-xl transition-transform hover:scale-110 leading-none"
                    :class="s <= editForm.rating ? 'text-yellow-400' : 'text-gray-700'"
                  >★</button>
                </div>

                <textarea
                  v-model="editForm.content"
                  rows="3"
                  placeholder="Ton avis…"
                  class="input resize-none text-sm mb-3"
                />

                <div v-if="editError" class="text-xs text-red-400 mb-2">{{ editError }}</div>

                <div class="flex items-center gap-3">
                  <button
                    @click="saveEdit(review)"
                    :disabled="editSaving"
                    class="btn-primary !py-1.5 !px-4 text-sm disabled:opacity-50"
                  >
                    {{ editSaving ? 'Enregistrement…' : 'Enregistrer' }}
                  </button>
                  <button @click="editingId = null" class="text-sm text-gray-600 hover:text-gray-300 transition">
                    Annuler
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats en bas -->
      <div v-if="reviews.length" class="mt-10 pt-8 border-t border-white/5 flex flex-wrap gap-8">
        <div class="text-center">
          <div class="text-2xl font-black text-white">{{ reviews.length }}</div>
          <div class="text-xs text-gray-600 mt-0.5">Comics notés</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-black text-yellow-400">{{ avgRating }}</div>
          <div class="text-xs text-gray-600 mt-0.5">Note moyenne</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-black text-white">{{ fiveStars }}</div>
          <div class="text-xs text-gray-600 mt-0.5">5 étoiles</div>
        </div>
      </div>
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

const pending = ref(true)
const reviews = ref([])

async function load() {
  pending.value = true
  try {
    reviews.value = await $fetch(`${base}/reviews/me`, { headers: authHeaders() })
  } catch {}
  pending.value = false
}

onMounted(load)

// Stats
const avgRating = computed(() => {
  if (!reviews.value.length) return '—'
  const avg = reviews.value.reduce((s, r) => s + r.rating, 0) / reviews.value.length
  return avg.toFixed(1)
})
const fiveStars = computed(() => reviews.value.filter(r => r.rating === 5).length)

// Édition inline
const editingId = ref(null)
const editForm = reactive({ rating: 0, content: '' })
const editSaving = ref(false)
const editError = ref('')

function startEdit(review) {
  editingId.value = review.id
  editForm.rating = review.rating
  editForm.content = review.content || ''
  editError.value = ''
}

async function saveEdit(review) {
  editSaving.value = true
  editError.value = ''
  try {
    const updated = await $fetch(`${base}/reviews/${review.id}`, {
      method: 'PATCH',
      body: { rating: editForm.rating, content: editForm.content },
      headers: authHeaders(),
    })
    const idx = reviews.value.findIndex(r => r.id === review.id)
    if (idx !== -1) reviews.value[idx] = { ...reviews.value[idx], ...updated }
    editingId.value = null
  } catch (e) {
    editError.value = e.data?.error || 'Erreur'
  } finally {
    editSaving.value = false
  }
}

async function deleteReview(review) {
  if (!confirm(`Supprimer ton avis sur "${review.comic.title}" ?`)) return
  try {
    await $fetch(`${base}/reviews/${review.id}`, { method: 'DELETE', headers: authHeaders() })
    reviews.value = reviews.value.filter(r => r.id !== review.id)
  } catch {}
}

function fmt(date) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>
