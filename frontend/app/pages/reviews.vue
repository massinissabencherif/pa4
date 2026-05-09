<template>
  <div>

    <!-- Page header -->
    <div style="border-bottom:1px solid #2a2a2a;">
      <div class="max-w-[1100px] mx-auto px-6 pt-9 pb-0">
        <div style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:5px;color:#e02020;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:10px;">
          <div style="width:16px;height:2px;background:#e02020;flex-shrink:0;"></div>
          Critiques · Notes
        </div>
        <div style="font-family:impact,sans-serif;font-size:52px;letter-spacing:1px;color:#fff;text-transform:uppercase;line-height:1;padding-bottom:18px;">MES AVIS</div>
      </div>
    </div>

    <div class="max-w-[1100px] mx-auto px-6 py-8">

      <!-- Loading -->
      <div v-if="pending" style="display:flex;align-items:center;gap:10px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;color:#888;text-transform:uppercase;padding:80px 0;">
        <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Chargement…
      </div>

      <!-- Vide -->
      <div v-else-if="!reviews.length" style="text-align:center;padding:80px 0;">
        <div style="font-family:impact,sans-serif;font-size:48px;letter-spacing:2px;text-transform:uppercase;color:#2a2a2a;margin-bottom:12px;">⭐</div>
        <p style="font-family:impact,sans-serif;font-size:18px;letter-spacing:2px;text-transform:uppercase;color:#555;margin-bottom:8px;">Aucun avis pour l'instant</p>
        <p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;color:#444;text-transform:uppercase;margin-bottom:24px;">Explore des comics et laisse tes premières notes.</p>
        <NuxtLink to="/comics/search" class="btn-primary">Explorer les comics</NuxtLink>
      </div>

      <!-- Liste des avis -->
      <div v-else class="space-y-px" style="background:#2a2a2a;">
        <div
          v-for="review in reviews"
          :key="review.id"
          style="background:#111;padding:20px;transition:background 0.15s;"
          class="hover:bg-[#141414]"
        >
          <div class="flex gap-4">

            <!-- Cover comic -->
            <NuxtLink :to="`/comics/${review.comic.externalId}`" class="shrink-0">
              <div style="width:60px;aspect-ratio:2/3;overflow:hidden;background:#1e1e1e;flex-shrink:0;transition:opacity 0.15s;" class="hover:opacity-80">
                <img
                  v-if="review.comic.coverUrl"
                  :src="review.comic.coverUrl"
                  :alt="review.comic.title"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <div v-else style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:24px;color:#555;">📚</div>
              </div>
            </NuxtLink>

            <!-- Contenu -->
            <div class="flex-1 min-w-0">

              <!-- Mode lecture -->
              <template v-if="editingId !== review.id">
                <NuxtLink :to="`/comics/${review.comic.externalId}`" class="group">
                  <p style="font-family:impact,sans-serif;font-size:15px;letter-spacing:0.5px;text-transform:uppercase;color:#fff;line-height:1.2;margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" class="group-hover:text-[#e02020] transition-colors">
                    {{ review.comic.title }}
                  </p>
                </NuxtLink>

                <!-- Étoiles -->
                <div style="margin-bottom:10px;">
                  <span style="font-family:'Courier New',monospace;font-size:13px;color:#fbbf24;">{{ review.rating }} ★</span>
                </div>

                <!-- Texte -->
                <p v-if="review.content" style="font-family:'Courier New',monospace;font-size:12px;line-height:1.7;color:#aaa;margin-bottom:12px;">
                  {{ review.content }}
                </p>
                <p v-else style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:1px;color:#555;font-style:italic;margin-bottom:12px;">Aucun commentaire</p>

                <!-- Date + actions -->
                <div style="display:flex;align-items:center;justify-content:space-between;">
                  <span style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;color:#666;">
                    {{ fmt(review.updatedAt) }}
                  </span>
                  <div style="display:flex;align-items:center;gap:16px;">
                    <button
                      @click="startEdit(review)"
                      style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#888;background:none;border:none;cursor:pointer;transition:color 0.15s;"
                      class="hover:text-[#fbbf24]"
                    >
                      Modifier
                    </button>
                    <button
                      @click="deleteReview(review)"
                      style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#888;background:none;border:none;cursor:pointer;transition:color 0.15s;"
                      class="hover:text-[#e02020]"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </template>

              <!-- Mode édition inline -->
              <template v-else>
                <p style="font-family:impact,sans-serif;font-size:15px;letter-spacing:0.5px;text-transform:uppercase;color:#fff;line-height:1.2;margin-bottom:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ review.comic.title }}</p>

                <!-- Étoiles éditables -->
                <div class="flex gap-1 mb-3">
                  <button
                    v-for="s in 5"
                    :key="s"
                    @click="editForm.rating = s"
                    style="font-size:22px;background:none;border:none;cursor:pointer;transition:transform 0.1s;"
                    class="hover:scale-110 leading-none"
                    :style="s <= editForm.rating ? 'color:#fbbf24;' : 'color:#3a3a3a;'"
                  >★</button>
                </div>

                <textarea
                  v-model="editForm.content"
                  rows="3"
                  placeholder="Ton avis…"
                  class="input resize-none text-sm mb-3"
                />

                <div v-if="editError" style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:1px;color:#e02020;margin-bottom:10px;">{{ editError }}</div>

                <div class="flex items-center gap-3">
                  <button
                    @click="saveEdit(review)"
                    :disabled="editSaving"
                    class="btn-primary"
                    style="font-size:11px;padding:8px 20px;"
                  >
                    {{ editSaving ? 'Enregistrement…' : 'Enregistrer' }}
                  </button>
                  <button
                    @click="editingId = null"
                    style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#888;background:none;border:none;cursor:pointer;transition:color 0.15s;"
                    class="hover:text-[#d4d4d4]"
                  >
                    Annuler
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats en bas -->
      <div v-if="reviews.length" style="margin-top:40px;padding-top:28px;border-top:1px solid #2a2a2a;display:flex;flex-wrap:wrap;gap:40px;">
        <div style="text-align:center;">
          <div style="font-family:impact,sans-serif;font-size:28px;letter-spacing:1px;color:#fff;">{{ reviews.length }}</div>
          <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#888;margin-top:4px;">Comics notés</div>
        </div>
        <div style="text-align:center;">
          <div style="font-family:impact,sans-serif;font-size:28px;letter-spacing:1px;color:#fbbf24;">{{ avgRating }}</div>
          <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#888;margin-top:4px;">Note moyenne</div>
        </div>
        <div style="text-align:center;">
          <div style="font-family:impact,sans-serif;font-size:28px;letter-spacing:1px;color:#fff;">{{ fiveStars }}</div>
          <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#888;margin-top:4px;">5 étoiles</div>
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

const avgRating = computed(() => {
  if (!reviews.value.length) return '—'
  const avg = reviews.value.reduce((s, r) => s + r.rating, 0) / reviews.value.length
  return avg.toFixed(1)
})
const fiveStars = computed(() => reviews.value.filter(r => r.rating === 5).length)

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
