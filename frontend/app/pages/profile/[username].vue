<template>
  <div class="min-h-screen px-4 sm:px-6 py-12">
    <div class="max-w-4xl mx-auto">

      <div v-if="pending" class="flex items-center gap-3 text-gray-500 py-16">
        <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Chargement…
      </div>

      <div v-else-if="!profile" class="text-center py-24">
        <div class="text-5xl mb-4">👤</div>
        <p class="text-gray-400">Utilisateur introuvable</p>
        <NuxtLink to="/" class="btn-ghost !px-6 mt-6 inline-block">Retour</NuxtLink>
      </div>

      <template v-else>
        <!-- Header profil -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-6 mb-10">
          <!-- Avatar -->
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-red-900/30 shrink-0">
            {{ profile.username[0].toUpperCase() }}
          </div>

          <div class="flex-1">
            <h1 class="text-2xl font-bold mb-1">{{ profile.username }}</h1>
            <p class="text-xs text-gray-600">Membre depuis {{ fmt(profile.createdAt) }}</p>
          </div>

          <!-- Bouton follow (si connecté et pas soi-même) -->
          <div v-if="isLoggedIn && !isSelf" class="shrink-0">
            <button
              @click="toggleFollow"
              :disabled="followLoading"
              class="transition-all"
              :class="following ? 'btn-ghost !py-2 !px-5 text-sm' : 'btn-primary !py-2 !px-5 text-sm'"
            >
              {{ followLoading ? '…' : (following ? 'Abonné ✓' : 'Suivre') }}
            </button>
          </div>

          <NuxtLink v-else-if="isSelf" to="/reviews" class="btn-ghost !py-2 !px-5 text-sm shrink-0">
            Mes avis
          </NuxtLink>
        </div>

        <!-- Badges -->
        <div v-if="badges.length" class="mb-8">
          <h2 class="text-sm font-semibold text-gray-500 mb-3">Badges</h2>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="badge in badges"
              :key="badge.badgeKey"
              class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-xs"
              :title="badge.description"
            >
              <span>{{ badge.icon }}</span>
              <span class="text-gray-300">{{ badge.name }}</span>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          <div class="card px-4 py-4 text-center">
            <div class="text-xl font-black text-white mb-0.5">{{ profile._count.readingEntries }}</div>
            <div class="text-xs text-gray-600">Comics suivis</div>
          </div>
          <div class="card px-4 py-4 text-center">
            <div class="text-xl font-black text-white mb-0.5">{{ profile._count.reviews }}</div>
            <div class="text-xs text-gray-600">Avis</div>
          </div>
          <div class="card px-4 py-4 text-center">
            <div class="text-xl font-black text-white mb-0.5">{{ profile._count.followers }}</div>
            <div class="text-xs text-gray-600">Abonnés</div>
          </div>
          <div class="card px-4 py-4 text-center">
            <div class="text-xl font-black text-white mb-0.5">{{ profile._count.following }}</div>
            <div class="text-xs text-gray-600">Abonnements</div>
          </div>
        </div>

        <!-- Avis -->
        <div v-if="allReviews.length" class="mb-10">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg font-bold">Avis <span class="text-gray-600 text-sm font-normal">({{ allReviews.length }})</span></h2>
          </div>
          <div class="space-y-3">
            <div v-for="review in displayedReviews" :key="review.id" class="card p-4 flex gap-4">
              <NuxtLink :to="`/comics/${review.comic.externalId}`" class="shrink-0">
                <div class="w-12 aspect-[2/3] rounded-lg overflow-hidden bg-white/5">
                  <img v-if="review.comic.coverUrl" :src="review.comic.coverUrl" class="w-full h-full object-cover" loading="lazy" />
                  <div v-else class="w-full h-full flex items-center justify-center text-lg text-gray-700">📚</div>
                </div>
              </NuxtLink>
              <div class="flex-1 min-w-0">
                <NuxtLink :to="`/comics/${review.comic.externalId}`" class="font-medium text-sm text-gray-200 hover:text-white transition line-clamp-1">
                  {{ review.comic.title }}
                </NuxtLink>
                <div class="flex gap-0.5 my-1">
                  <span v-for="s in 5" :key="s" class="text-sm leading-none" :class="s <= review.rating ? 'text-yellow-400' : 'text-gray-700'">★</span>
                </div>
                <p v-if="review.content" class="text-xs text-gray-500 line-clamp-2 leading-relaxed">{{ review.content }}</p>
              </div>
            </div>
          </div>
          <button
            v-if="allReviews.length > reviewLimit"
            @click="reviewLimit = reviewLimit === 5 ? allReviews.length : 5"
            class="mt-4 text-sm text-gray-500 hover:text-white transition"
          >
            {{ reviewLimit === 5 ? `Voir tous les avis (${allReviews.length})` : 'Voir moins' }}
          </button>
        </div>

        <!-- Listes publiques -->
        <div v-if="profile.lists.length">
          <h2 class="text-lg font-bold mb-5">Listes publiques</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NuxtLink
              v-for="list in profile.lists"
              :key="list.id"
              :to="`/lists/public/${list.slug}`"
              class="card p-4 hover:border-white/15 transition-all group"
            >
              <div class="flex items-center justify-between">
                <p class="font-medium text-sm group-hover:text-white transition-colors">{{ list.name }}</p>
                <span class="text-xs text-gray-600">{{ list._count.items }} comics</span>
              </div>
            </NuxtLink>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const config = useRuntimeConfig()
const base = config.public.apiBase
const { isLoggedIn, user, fetchMe } = useAuth()

function authHeaders() {
  return token.value ? { Authorization: `Bearer ${token.value}` } : {}
}

const BADGE_META = {
  first_read: { name: 'Premier pas', icon: '📖', description: 'Terminer son premier comic' },
  bookworm: { name: 'Rat de bibliothèque', icon: '🐛', description: 'Terminer 5 comics' },
  librarian: { name: 'Bibliothécaire', icon: '🏛️', description: 'Terminer 20 comics' },
  first_review: { name: 'Critique en herbe', icon: '✍️', description: 'Poster son premier avis' },
  top_critic: { name: 'Grand critique', icon: '🏆', description: 'Poster 10 avis' },
  social: { name: 'Connecté', icon: '🤝', description: 'Suivre 5 personnes' },
  explorer: { name: 'Explorateur', icon: '🧭', description: 'Lire 3 genres différents' },
  genre_master: { name: 'Maître des genres', icon: '🎭', description: 'Lire 5 genres différents' },
  in_progress_collector: { name: 'Multitâche', icon: '⚡', description: '3 comics en cours simultanément' },
  early_adopter: { name: 'Pionnier', icon: '🌟', description: 'Parmi les 50 premiers inscrits' },
}

const pending = ref(true)
const profile = ref(null)
const following = ref(false)
const followLoading = ref(false)
const allReviews = ref([])
const badges = ref([])
const reviewLimit = ref(5)
const displayedReviews = computed(() => allReviews.value.slice(0, reviewLimit.value))

const isSelf = computed(() => !!user.value && user.value.username === route.params.username)

onMounted(async () => {
  // Ensure user.value is populated (same pattern as settings page)
  await fetchMe()
  try {
    const [profileData, reviews, userBadges] = await Promise.all([
      $fetch(`${base}/users/${route.params.username}`),
      $fetch(`${base}/users/${route.params.username}/reviews`),
      $fetch(`${base}/users/${route.params.username}/badges`).catch(() => []),
    ])
    profile.value = profileData
    allReviews.value = reviews
    badges.value = userBadges.map(b => ({ ...b, ...(BADGE_META[b.badgeKey] || { name: b.badgeKey, icon: '🏅', description: '' }) }))
    if (isLoggedIn.value && !isSelf.value) {
      const { following: f } = await $fetch(`${base}/users/${profile.value.id}/follow`, {
        headers: authHeaders()
      })
      following.value = f
    }
  } catch {}
  pending.value = false
})

async function toggleFollow() {
  followLoading.value = true
  try {
    if (following.value) {
      await $fetch(`${base}/users/${profile.value.id}/follow`, {
        method: 'DELETE', headers: authHeaders()
      })
      following.value = false
      if (profile.value._count) profile.value._count.followers--
    } else {
      await $fetch(`${base}/users/${profile.value.id}/follow`, {
        method: 'POST', headers: authHeaders()
      })
      following.value = true
      if (profile.value._count) profile.value._count.followers++
    }
  } catch {}
  followLoading.value = false
}

function fmt(date) {
  return new Date(date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}
</script>
