<template>
  <div class="min-h-screen px-4 sm:px-6 py-12">
    <div class="max-w-4xl mx-auto">

      <BackButton to="/comics/search" label="Retour à la recherche" />

      <!-- Loading -->
      <div v-if="pending" class="flex items-center gap-3 text-gray-500">
        <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Chargement…
      </div>

      <!-- Erreur -->
      <div v-else-if="fetchError" class="card p-6 border-red-500/20 bg-red-500/5 text-red-400">
        {{ fetchError }}
      </div>

      <!-- Contenu -->
      <div v-else-if="comic" class="flex flex-col sm:flex-row gap-10">
        <!-- Couverture -->
        <div class="shrink-0">
          <div class="w-52 rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-black/60">
            <img
              :src="getComicCover(comic)"
              :alt="comic.title"
              class="w-full aspect-[2/3] object-cover"
            />
          </div>
        </div>

        <!-- Infos -->
        <div class="flex-1 min-w-0">
          <h1 class="text-3xl font-extrabold leading-tight mb-3">{{ comic.title }}</h1>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4">
            <!-- Auteurs liés (modèle Author — cliquables) -->
            <template v-if="linkedAuthors.length">
              <NuxtLink
                v-for="author in linkedAuthors"
                :key="author.id"
                :to="`/authors/${author.slug}`"
                class="text-sm text-red-400 hover:text-red-300 transition font-medium"
              >
                {{ author.name }}
              </NuxtLink>
            </template>
            <!-- Auteurs texte libres -->
            <span v-else-if="comic.authors?.length" class="text-sm text-gray-300">{{ comic.authors.join(', ') }}</span>
            <!-- Éditeur -->
            <span v-if="comic.publisher" class="text-sm text-gray-500">{{ comic.publisher }}</span>
            <!-- Note moyenne -->
            <div v-if="avgRating" class="flex items-center gap-1">
              <span class="text-yellow-400 text-sm">★</span>
              <span class="text-sm font-semibold text-white">{{ avgRating }}</span>
              <span class="text-xs text-gray-600">({{ communityReviews.length }})</span>
            </div>
          </div>

          <!-- Genres -->
          <div v-if="comic.genres?.length" class="flex flex-wrap gap-2 mb-6">
            <span
              v-for="genre in comic.genres"
              :key="genre"
              class="px-3 py-1 rounded-full bg-white/6 border border-white/10 text-xs text-gray-400"
            >
              {{ genre }}
            </span>
          </div>

          <!-- Description -->
          <p v-if="comic.description" class="text-gray-400 text-sm leading-relaxed mb-6">
            {{ comic.description }}
          </p>

          <!-- Date -->
          <div v-if="comic.publishedAt" class="flex items-center gap-2 text-xs text-gray-600 mb-8">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            Publié le {{ new Date(comic.publishedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) }}
          </div>

          <!-- Actions connecté -->
          <!-- Bouton lire PDF (toujours visible si PDF dispo) -->
          <div v-if="comic.pdfUrl" class="mb-6">
            <NuxtLink
              :to="`/comics/read/${comic.externalId}`"
              class="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/40 text-white font-medium px-5 py-2.5 rounded-xl transition-all duration-150"
            >
              <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
              Lire le comic
            </NuxtLink>
          </div>

          <template v-if="isLoggedIn">
            <!-- Feedback actions -->
            <div v-if="actionMsg" class="flex items-center gap-2 text-sm mb-4" :class="actionError ? 'text-red-400' : 'text-green-400'">
              <span>{{ actionMsg }}</span>
            </div>

            <!-- Statut lecture -->
            <div class="flex flex-wrap gap-3 mb-6">
              <template v-if="!entry">
                <button
                  @click="addToList"
                  :disabled="actionLoading"
                  class="btn-primary !py-2.5 flex items-center gap-2 disabled:opacity-50"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Ajouter à ma liste
                </button>
              </template>
              <template v-else>
                <!-- Sélecteur de statut -->
                <div class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm">
                  <span class="text-gray-400">Statut :</span>
                  <select
                    v-model="entry.status"
                    @change="updateStatus(entry.status)"
                    :disabled="actionLoading"
                    class="bg-transparent text-white focus:outline-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="TO_READ">À lire</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="FINISHED">Terminé</option>
                  </select>
                </div>
                <button
                  @click="removeFromList"
                  :disabled="actionLoading"
                  class="btn-ghost !py-2.5 text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  Retirer
                </button>
              </template>
            </div>

            <!-- Ajouter à une liste -->
            <div class="card p-5 max-w-md mb-4">
              <h3 class="font-semibold mb-3">Ajouter à une liste</h3>
              <div v-if="!userLists.length" class="text-sm text-gray-500">
                Aucune liste.
                <NuxtLink to="/lists" class="text-red-400 hover:text-red-300">Créer une liste →</NuxtLink>
              </div>
              <div v-else class="space-y-2">
                <label
                  v-for="l in userLists"
                  :key="l.id"
                  class="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    :checked="listContains(l.id)"
                    @change="toggleList(l, $event.target.checked)"
                    class="accent-red-500 w-4 h-4"
                  />
                  <span class="text-sm text-gray-300 group-hover:text-white transition-colors">{{ l.name }}</span>
                  <span class="ml-auto text-xs text-gray-700">{{ l._count?.items ?? 0 }}</span>
                </label>
              </div>
            </div>

            <!-- Avis -->
            <div class="card p-5 max-w-md">
              <h3 class="font-semibold mb-4">{{ review ? 'Ton avis' : 'Donner un avis' }}</h3>

              <!-- Étoiles -->
              <div class="flex gap-1 mb-4">
                <button
                  v-for="star in 5"
                  :key="star"
                  @click="reviewForm.rating = star"
                  class="text-2xl transition-transform hover:scale-110"
                  :class="star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-700'"
                >
                  ★
                </button>
              </div>

              <textarea
                v-model="reviewForm.content"
                placeholder="Ton avis (optionnel)…"
                rows="3"
                class="input resize-none mb-4 text-sm"
              />

              <div class="flex gap-3">
                <button
                  @click="submitReview"
                  :disabled="reviewForm.rating === 0 || reviewLoading"
                  class="btn-primary !py-2 !px-5 text-sm disabled:opacity-40"
                >
                  {{ review ? 'Modifier' : 'Publier' }}
                </button>
                <button
                  v-if="review"
                  @click="deleteReview"
                  :disabled="reviewLoading"
                  class="text-sm text-red-400 hover:text-red-300 transition disabled:opacity-50"
                >
                  Supprimer
                </button>
              </div>

              <p v-if="reviewMsg" class="text-xs mt-3" :class="reviewError ? 'text-red-400' : 'text-green-400'">
                {{ reviewMsg }}
              </p>
            </div>
          </template>

          <!-- Actions non connecté -->
          <div v-else class="card p-5 max-w-sm">
            <p class="text-sm text-gray-400 mb-3">
              Connecte-toi pour ajouter ce comic à ta liste et laisser un avis.
            </p>
            <div class="flex gap-3">
              <NuxtLink to="/auth/login" class="btn-primary !py-2 !px-4 text-sm">Se connecter</NuxtLink>
              <NuxtLink to="/auth/register" class="btn-ghost !py-2 !px-4 text-sm">S'inscrire</NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Avis de la communauté -->
      <div v-if="comic && communityReviews.length" class="mt-16">
        <h2 class="text-xl font-bold mb-6">Avis de la communauté</h2>
        <div class="space-y-6">
          <div v-for="r in communityReviews" :key="r.id" class="card p-5">
            <div class="flex items-center gap-3 mb-2">
              <NuxtLink :to="`/profile/${r.user.username}`" class="font-medium text-sm text-gray-300 hover:text-red-400 transition">{{ r.user.username }}</NuxtLink>
              <span class="text-yellow-400 text-sm">{{ '★'.repeat(r.rating) }}<span class="text-gray-700">{{ '★'.repeat(5 - r.rating) }}</span></span>
            </div>
            <p v-if="r.content" class="text-sm text-gray-400 leading-relaxed mb-4">{{ r.content }}</p>

            <!-- Commentaires sur l'avis -->
            <div v-if="r.comments?.length" class="border-t border-white/8 pt-3 mt-3 space-y-3">
              <div v-for="c in r.comments" :key="c.id" class="flex items-start gap-3">
                <div class="flex-1 min-w-0">
                  <span class="text-xs font-medium text-gray-400">{{ c.user.username }}</span>
                  <p class="text-xs text-gray-500 leading-relaxed mt-0.5">{{ c.content }}</p>
                </div>
                <!-- Like bouton -->
                <button
                  @click="toggleCommentLike(c)"
                  class="flex items-center gap-1 text-xs transition shrink-0 mt-0.5"
                  :class="c.likedByMe ? 'text-red-400' : 'text-gray-600 hover:text-red-400'"
                  :aria-label="c.likedByMe ? 'Retirer le like' : 'Liker'"
                >
                  <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <span>{{ c.likeCount }}</span>
                </button>
              </div>
            </div>

            <!-- Formulaire de commentaire -->
            <div v-if="isLoggedIn" class="border-t border-white/8 pt-3 mt-3">
              <form @submit.prevent="submitComment(r)" class="flex gap-2">
                <input
                  v-model="commentDrafts[r.id]"
                  type="text"
                  placeholder="Ajouter un commentaire…"
                  maxlength="1000"
                  class="input flex-1 text-xs !py-1.5"
                />
                <button type="submit" class="btn-primary !py-1.5 !px-3 text-xs">Envoyer</button>
              </form>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { getComicCover } from '~/utils/comicCover.js'
const route = useRoute()
const config = useRuntimeConfig()
const base = config.public.apiBase
const { isLoggedIn, token } = useAuth()

const { data: comic, pending, error: _fetchError } = await useFetch(`${base}/comics/${route.params.id}`)
const fetchError = computed(() => _fetchError.value?.data?.error || (_fetchError.value ? 'Erreur lors du chargement' : null))

// Auteurs liés (inclus dans la réponse du comic)
const linkedAuthors = computed(() => comic.value?.linkedAuthors ?? [])

// --- Lecture ---
const entry = ref(null)
const actionLoading = ref(false)
const actionMsg = ref('')
const actionError = ref(false)

function authHeaders() {
  return token.value ? { Authorization: `Bearer ${token.value}` } : {}
}

async function loadEntry() {
  if (!isLoggedIn.value || !comic.value) return
  try {
    const history = await $fetch(`${base}/history`, { headers: authHeaders() })
    entry.value = history.find(e => e.comicId === comic.value.id) ?? null
  } catch {}
}

async function addToList() {
  actionLoading.value = true
  actionMsg.value = ''
  try {
    entry.value = await $fetch(`${base}/reading-list`, {
      method: 'POST',
      body: { comicId: comic.value.id },
      headers: authHeaders(),
    })
    actionMsg.value = 'Ajouté à ta liste ✓'
    actionError.value = false
  } catch (e) {
    actionMsg.value = e.data?.error || 'Erreur'
    actionError.value = true
  } finally {
    actionLoading.value = false
  }
}

async function updateStatus(status) {
  actionLoading.value = true
  try {
    entry.value = await $fetch(`${base}/reading-list/${entry.value.id}/status`, {
      method: 'PATCH',
      body: { status },
      headers: authHeaders(),
    })
    actionMsg.value = 'Statut mis à jour ✓'
    actionError.value = false
  } catch (e) {
    actionMsg.value = e.data?.error || 'Erreur'
    actionError.value = true
  } finally {
    actionLoading.value = false
  }
}

async function removeFromList() {
  actionLoading.value = true
  try {
    await $fetch(`${base}/reading-list/${entry.value.id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    entry.value = null
    actionMsg.value = 'Retiré de ta liste'
    actionError.value = false
  } catch (e) {
    actionMsg.value = e.data?.error || 'Erreur'
    actionError.value = true
  } finally {
    actionLoading.value = false
  }
}

// --- Reviews ---
const avgRating = computed(() => {
  if (!communityReviews.value.length) return null
  const avg = communityReviews.value.reduce((sum, r) => sum + r.rating, 0) / communityReviews.value.length
  return avg.toFixed(1)
})

const review = ref(null)
const reviewForm = reactive({ rating: 0, content: '' })
const reviewLoading = ref(false)
const reviewMsg = ref('')
const reviewError = ref(false)
const communityReviews = ref([])

async function loadReviews() {
  if (!comic.value) return
  try {
    const all = await $fetch(`${base}/reviews/comic/${comic.value.id}`)
    communityReviews.value = all
    if (isLoggedIn.value) {
      const { user } = useAuth()
      review.value = all.find(r => r.userId === user.value?.id) ?? null
      if (review.value) {
        reviewForm.rating = review.value.rating
        reviewForm.content = review.value.content || ''
      }
    }
  } catch {}
}

async function submitReview() {
  reviewLoading.value = true
  reviewMsg.value = ''
  try {
    if (review.value) {
      review.value = await $fetch(`${base}/reviews/${review.value.id}`, {
        method: 'PATCH',
        body: { rating: reviewForm.rating, content: reviewForm.content },
        headers: authHeaders(),
      })
      reviewMsg.value = 'Avis modifié ✓'
    } else {
      review.value = await $fetch(`${base}/reviews`, {
        method: 'POST',
        body: { comicId: comic.value.id, rating: reviewForm.rating, content: reviewForm.content },
        headers: authHeaders(),
      })
      reviewMsg.value = 'Avis publié ✓'
    }
    reviewError.value = false
    await loadReviews()
  } catch (e) {
    reviewMsg.value = e.data?.error || 'Erreur'
    reviewError.value = true
  } finally {
    reviewLoading.value = false
  }
}

async function deleteReview() {
  reviewLoading.value = true
  try {
    await $fetch(`${base}/reviews/${review.value.id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    review.value = null
    reviewForm.rating = 0
    reviewForm.content = ''
    reviewMsg.value = 'Avis supprimé'
    reviewError.value = false
    await loadReviews()
  } catch (e) {
    reviewMsg.value = e.data?.error || 'Erreur'
    reviewError.value = true
  } finally {
    reviewLoading.value = false
  }
}

// --- Listes ---
const userLists = ref([])
const listMembership = ref({}) // listId → boolean

async function loadLists() {
  if (!isLoggedIn.value) return
  try {
    const lists = await $fetch(`${base}/lists`, { headers: authHeaders() })
    userLists.value = lists
    // Pour chaque liste, vérifier si le comic y est
    for (const l of lists) {
      const detail = await $fetch(`${base}/lists/${l.id}`, { headers: authHeaders() })
      listMembership.value[l.id] = detail.items.some(i => i.comicId === comic.value?.id)
    }
  } catch {}
}

function listContains(listId) {
  return !!listMembership.value[listId]
}

async function toggleList(list, checked) {
  try {
    if (checked) {
      await $fetch(`${base}/lists/${list.id}/comics`, {
        method: 'POST',
        body: { comicId: comic.value.id },
        headers: authHeaders(),
      })
      listMembership.value[list.id] = true
      if (list._count) list._count.items++
    } else {
      await $fetch(`${base}/lists/${list.id}/comics/${comic.value.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      listMembership.value[list.id] = false
      if (list._count && list._count.items > 0) list._count.items--
    }
  } catch {}
}

// --- Commentaires & Likes ---
const commentDrafts = reactive({})

async function submitComment(review) {
  const content = commentDrafts[review.id]?.trim()
  if (!content) return
  try {
    const comment = await $fetch(`${base}/reviews/${review.id}/comments`, {
      method: 'POST',
      body: { content },
      headers: authHeaders(),
    })
    review.comments = [...(review.comments || []), comment]
    commentDrafts[review.id] = ''
  } catch {}
}

async function toggleCommentLike(comment) {
  if (!isLoggedIn.value) { navigateTo('/auth/login'); return }
  const wasLiked = comment.likedByMe
  comment.likedByMe = !wasLiked
  comment.likeCount += wasLiked ? -1 : 1
  try {
    const res = await $fetch(`${base}/comments/${comment.id}/like`, {
      method: wasLiked ? 'DELETE' : 'POST',
      headers: authHeaders(),
    })
    comment.likeCount = res.likeCount
  } catch {
    comment.likedByMe = wasLiked
    comment.likeCount += wasLiked ? 1 : -1
  }
}

onMounted(async () => {
  await Promise.all([loadEntry(), loadReviews(), loadLists()])
})
</script>
