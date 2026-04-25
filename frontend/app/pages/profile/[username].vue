<template>
  <div class="min-h-screen px-4 sm:px-6 py-12">
    <div class="max-w-5xl mx-auto">

      <BackButton to="/feed" label="Retour" />

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
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-red-900/30 shrink-0">
            {{ profile.username[0].toUpperCase() }}
          </div>
          <div class="flex-1">
            <h1 class="text-2xl font-bold mb-1">{{ profile.username }}</h1>
            <p class="text-xs text-gray-600">Membre depuis {{ fmt(profile.createdAt) }}</p>
          </div>
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
        </div>

        <!-- ══ VUE PROPRE : contenu identique au dashboard ══════════════════ -->
        <template v-if="isSelf && stats">

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            <div class="card p-5 text-center">
              <p class="text-3xl font-bold text-green-400">{{ stats.counts.finished }}</p>
              <p class="text-xs text-gray-500 mt-1">Terminés</p>
            </div>
            <div class="card p-5 text-center">
              <p class="text-3xl font-bold text-blue-400">{{ stats.counts.inProgress }}</p>
              <p class="text-xs text-gray-500 mt-1">En cours</p>
            </div>
            <div class="card p-5 text-center">
              <p class="text-3xl font-bold text-gray-400">{{ stats.counts.toRead }}</p>
              <p class="text-xs text-gray-500 mt-1">À lire</p>
            </div>
            <div class="card p-5 text-center">
              <p class="text-3xl font-bold text-yellow-400">{{ stats.counts.reviews }}</p>
              <p class="text-xs text-gray-500 mt-1">Avis postés</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div class="card p-6">
              <h2 class="text-sm font-semibold text-gray-300 mb-4">Activité des 12 derniers mois</h2>
              <div class="flex items-end gap-1 h-24">
                <div v-for="m in stats.monthlyActivity" :key="m.label" class="flex-1 flex flex-col items-center gap-1">
                  <div
                    class="w-full rounded-sm bg-red-500/70 transition-all"
                    :style="{ height: maxMonthly > 0 ? `${(m.count / maxMonthly) * 80}px` : '2px' }"
                    :title="`${m.count} comic(s) terminé(s)`"
                  />
                  <span class="text-[9px] text-gray-600 rotate-45 origin-left">{{ m.label }}</span>
                </div>
              </div>
            </div>
            <div class="card p-6 flex flex-col gap-5">
              <div>
                <h2 class="text-sm font-semibold text-gray-300 mb-2">Note moyenne donnée</h2>
                <p v-if="stats.avgRatingGiven" class="text-4xl font-bold text-yellow-400">
                  ★ {{ stats.avgRatingGiven }}<span class="text-lg text-gray-500">/5</span>
                </p>
                <p v-else class="text-gray-600 text-sm">Aucun avis posté</p>
              </div>
              <div>
                <h2 class="text-sm font-semibold text-gray-300 mb-2">Communauté</h2>
                <div class="flex gap-6 text-sm">
                  <div>
                    <span class="text-xl font-semibold text-gray-200">{{ stats.counts.following }}</span>
                    <span class="text-gray-500 ml-1">suivis</span>
                  </div>
                  <div>
                    <span class="text-xl font-semibold text-gray-200">{{ stats.counts.followers }}</span>
                    <span class="text-gray-500 ml-1">abonnés</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div class="card p-6">
              <h2 class="text-sm font-semibold text-gray-300 mb-4">Genres préférés</h2>
              <div v-if="stats.topGenres.length" class="space-y-3">
                <div v-for="g in stats.topGenres" :key="g.genre" class="flex items-center gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex justify-between text-xs mb-1">
                      <span class="text-gray-300 truncate">{{ g.genre }}</span>
                      <span class="text-gray-500 ml-2">{{ g.count }}</span>
                    </div>
                    <div class="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div class="h-full rounded-full bg-red-500/70" :style="{ width: `${(g.count / stats.topGenres[0].count) * 100}%` }" />
                    </div>
                  </div>
                </div>
              </div>
              <p v-else class="text-gray-600 text-sm">Lis des comics pour voir tes genres préférés.</p>
            </div>
            <div class="card p-6">
              <h2 class="text-sm font-semibold text-gray-300 mb-4">Auteurs préférés</h2>
              <div v-if="stats.topAuthors.length" class="space-y-3">
                <div v-for="a in stats.topAuthors" :key="a.author" class="flex items-center gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex justify-between text-xs mb-1">
                      <span class="text-gray-300 truncate">{{ a.author }}</span>
                      <span class="text-gray-500 ml-2">{{ a.count }}</span>
                    </div>
                    <div class="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div class="h-full rounded-full bg-blue-500/70" :style="{ width: `${(a.count / stats.topAuthors[0].count) * 100}%` }" />
                    </div>
                  </div>
                </div>
              </div>
              <p v-else class="text-gray-600 text-sm">Lis des comics pour voir tes auteurs préférés.</p>
            </div>
          </div>

          <div class="card p-6 mb-10">
            <h2 class="text-sm font-semibold text-gray-300 mb-4">
              Badges <span class="text-gray-600 font-normal">({{ stats.badges.length }}/10)</span>
            </h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <div
                v-for="badge in stats.badges"
                :key="badge.badgeKey"
                class="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 border border-white/8 text-center"
                :title="badge.description"
              >
                <span class="text-2xl">{{ badge.icon }}</span>
                <span class="text-xs font-medium text-gray-300">{{ badge.name }}</span>
                <span class="text-[10px] text-gray-600">{{ new Date(badge.earnedAt).toLocaleDateString('fr-FR') }}</span>
              </div>
              <div
                v-for="i in (10 - stats.badges.length)"
                :key="`empty-${i}`"
                class="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/3 border border-white/5 text-center opacity-30"
              >
                <span class="text-2xl grayscale">🏅</span>
                <span class="text-xs text-gray-600">???</span>
              </div>
            </div>
          </div>

        </template>

        <!-- ══ VUE PUBLIQUE (autre user) ══════════════════════════════════════ -->
        <template v-else>

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

        </template>

        <!-- Avis (commun) -->
        <div v-if="allReviews.length" class="mb-10">
          <h2 class="text-lg font-bold mb-5">Avis <span class="text-gray-600 text-sm font-normal">({{ allReviews.length }})</span></h2>
          <div class="space-y-3">
            <div v-for="review in displayedReviews" :key="review.id" class="card p-4 flex gap-4">
              <NuxtLink :to="`/comics/${review.comic.externalId}`" class="shrink-0">
                <div class="w-12 aspect-[2/3] rounded-lg overflow-hidden bg-white/5">
                  <img :src="getComicCover(review.comic)" :alt="review.comic.title" class="w-full h-full object-cover" loading="lazy" />
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

        <!-- Listes publiques (commun) -->
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
import { getComicCover } from '~/utils/comicCover.js'
const route = useRoute()
const config = useRuntimeConfig()
const base = config.public.apiBase
const { isLoggedIn, user, fetchMe, token } = useAuth()

function authHeaders() {
  return token.value ? { Authorization: `Bearer ${token.value}` } : {}
}

const BADGE_META = {
  first_read:            { name: 'Premier pas',         icon: '📖', description: 'Terminer son premier comic' },
  bookworm:              { name: 'Rat de bibliothèque', icon: '🐛', description: 'Terminer 5 comics' },
  librarian:             { name: 'Bibliothécaire',       icon: '🏛️', description: 'Terminer 20 comics' },
  first_review:          { name: 'Critique en herbe',   icon: '✍️', description: 'Poster son premier avis' },
  top_critic:            { name: 'Grand critique',       icon: '🏆', description: 'Poster 10 avis' },
  social:                { name: 'Connecté',             icon: '🤝', description: 'Suivre 5 personnes' },
  explorer:              { name: 'Explorateur',          icon: '🧭', description: 'Lire 3 genres différents' },
  genre_master:          { name: 'Maître des genres',   icon: '🎭', description: 'Lire 5 genres différents' },
  in_progress_collector: { name: 'Multitâche',          icon: '⚡', description: '3 comics en cours simultanément' },
  early_adopter:         { name: 'Pionnier',             icon: '🌟', description: 'Parmi les 50 premiers inscrits' },
}

const pending     = ref(true)
const profile     = ref(null)
const following   = ref(false)
const followLoading = ref(false)
const allReviews  = ref([])
const badges      = ref([])
const stats       = ref(null)
// isSelf en ref (pas computed) pour éviter le problème de timing
const isSelf      = ref(false)
const reviewLimit = ref(5)

const displayedReviews = computed(() => allReviews.value.slice(0, reviewLimit.value))
const maxMonthly = computed(() =>
  stats.value ? Math.max(...stats.value.monthlyActivity.map(m => m.count), 1) : 1
)

onMounted(async () => {
  await fetchMe()

  // Détermine si c'est son propre profil APRÈS fetchMe
  isSelf.value = !!user.value && user.value.username === route.params.username

  try {
    const requests = [
      $fetch(`${base}/users/${route.params.username}`),
      $fetch(`${base}/users/${route.params.username}/reviews`),
      $fetch(`${base}/users/${route.params.username}/badges`).catch(() => []),
    ]
    if (isSelf.value) {
      requests.push($fetch(`${base}/stats/me`, { headers: authHeaders() }).catch(() => null))
    }

    const [profileData, reviews, userBadges, statsData] = await Promise.all(requests)

    profile.value    = profileData
    allReviews.value = reviews
    badges.value     = userBadges.map(b => ({
      ...b,
      ...(BADGE_META[b.badgeKey] || { name: b.badgeKey, icon: '🏅', description: '' })
    }))
    if (isSelf.value) stats.value = statsData ?? null

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
      await $fetch(`${base}/users/${profile.value.id}/follow`, { method: 'DELETE', headers: authHeaders() })
      following.value = false
      if (profile.value._count) profile.value._count.followers--
    } else {
      await $fetch(`${base}/users/${profile.value.id}/follow`, { method: 'POST', headers: authHeaders() })
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
