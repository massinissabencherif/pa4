<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-10">

    <div class="flex gap-8">

      <!-- ── Feed principal ────────────────────────────────────────────── -->
      <div class="flex-1 min-w-0">
        <h1 class="text-2xl font-bold mb-6">Fil d'actualité</h1>

        <!-- Bannière suggestion -->
        <div v-if="feedData?.suggestion" class="card p-4 mb-6 flex items-center gap-4 border-red-500/20 bg-red-500/5">
          <span class="text-2xl shrink-0">👥</span>
          <div>
            <p class="text-sm font-medium text-white">Suis des fans de comics pour personnaliser ton fil d'actualité</p>
            <p class="text-xs text-gray-500 mt-0.5">En attendant, voici quelques activités de la communauté</p>
          </div>
        </div>

        <!-- Événements -->
        <div v-if="feedData?.events?.length" class="space-y-4">
          <div v-if="feedPending" class="space-y-4">
            <div v-for="i in 5" :key="i" class="card p-5 animate-pulse">
              <div class="flex gap-3">
                <div class="w-10 h-10 rounded-full bg-white/5"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-3 bg-white/5 rounded w-1/3"></div>
                  <div class="h-3 bg-white/5 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-for="event in feedData?.events"
            :key="`${event.type}-${event.id}`"
            class="card p-5 hover:border-white/15 transition"
          >
            <div class="flex gap-4">
              <!-- Cover -->
              <NuxtLink :to="`/comics/${event.comic.externalId}`" class="shrink-0">
                <img
                  :src="getComicCover(event.comic)"
                  :alt="event.comic.title"
                  class="w-12 h-16 object-cover rounded-lg"
                />
              </NuxtLink>

              <!-- Contenu -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2 mb-1">
                  <p class="text-sm">
                    <NuxtLink :to="`/profile/${event.user.username}`" class="font-semibold hover:text-red-400 transition">
                      {{ event.user.username }}
                    </NuxtLink>
                    <span class="text-gray-500"> {{ eventLabel(event.type) }} </span>
                    <NuxtLink :to="`/comics/${event.comic.externalId}`" class="font-medium hover:text-white transition">
                      {{ event.comic.title }}
                    </NuxtLink>
                  </p>
                  <span class="text-xs text-gray-600 shrink-0">{{ timeAgo(event.date) }}</span>
                </div>

                <!-- Étoiles + avis -->
                <template v-if="event.type === 'REVIEW'">
                  <div class="flex gap-0.5 mb-1">
                    <span v-for="i in 5" :key="i" :class="i <= event.data.rating ? 'text-amber-400' : 'text-gray-700'" class="text-sm">★</span>
                  </div>
                  <p v-if="event.data.content" class="text-sm text-gray-400 line-clamp-2">{{ event.data.content }}</p>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Sidebar droite (recommandations + derniers ajouts) ────────── -->
      <aside class="hidden lg:block w-72 shrink-0 space-y-8">

        <!-- Recommandations -->
        <div>
          <h2 class="text-base font-bold mb-3">Recommandations</h2>
          <div v-if="recoData?.basis === 'popular' || recoData?.basis === 'taste'" class="mb-2">
            <p class="text-xs text-gray-600">
              {{ recoData.basis === 'taste' ? `Basé sur : ${recoData.topGenres?.slice(0,3).join(', ')}` : 'Comics populaires' }}
            </p>
          </div>
          <div class="space-y-2">
            <NuxtLink
              v-for="comic in recoData?.recommendations"
              :key="comic.id"
              :to="`/comics/${comic.externalId}`"
              class="card p-3 flex gap-3 hover:border-white/15 transition group"
            >
              <img :src="getComicCover(comic)" :alt="comic.title" class="w-10 h-14 object-cover rounded shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium group-hover:text-white transition line-clamp-2">{{ comic.title }}</p>
                <p class="text-xs text-gray-600 mt-1">{{ comic.genres?.slice(0,2).join(', ') }}</p>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- Derniers ajouts -->
        <div v-if="latestData?.comics?.length">
          <h2 class="text-base font-bold mb-3">Derniers ajouts</h2>
          <div class="space-y-2">
            <NuxtLink
              v-for="comic in latestData.comics"
              :key="comic.id"
              :to="`/comics/${comic.externalId}`"
              class="card p-3 flex gap-3 hover:border-white/15 transition group"
            >
              <img :src="getComicCover(comic)" :alt="comic.title" class="w-10 h-14 object-cover rounded shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium group-hover:text-white transition line-clamp-2">{{ comic.title }}</p>
                <p v-if="comic.publisher" class="text-xs text-gray-600 mt-1">{{ comic.publisher }}</p>
              </div>
            </NuxtLink>
          </div>
        </div>

      </aside>
    </div>

    <!-- Tendances du jour (pleine largeur, même style que commentaires) -->
    <div v-if="trendingData?.comics?.length" class="mt-10">
      <h2 class="text-xl font-bold mb-4">Tendances du jour</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink
          v-for="comic in trendingData.comics"
          :key="comic.id"
          :to="`/comics/${comic.externalId}`"
          class="card p-4 hover:border-white/15 transition group"
        >
          <div class="flex gap-3 mb-3">
            <img :src="getComicCover(comic)" :alt="comic.title" class="w-10 h-14 object-cover rounded shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-xs text-gray-500 line-clamp-1">{{ comic.publisher || '' }}</p>
              <p class="text-sm font-medium group-hover:text-white transition line-clamp-2 mt-0.5">{{ comic.title }}</p>
            </div>
          </div>
          <p class="text-xs text-gray-600">{{ comic.readCount }} lecture{{ comic.readCount > 1 ? 's' : '' }} aujourd'hui</p>
        </NuxtLink>
      </div>
    </div>

    <!-- Commentaires les plus aimés (pleine largeur, même style) -->
    <div v-if="topLikedData?.comments?.length" class="mt-10">
      <h2 class="text-xl font-bold mb-4">Commentaires les plus aimés</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink
          v-for="c in topLikedData.comments"
          :key="c.id"
          :to="`/comics/${c.review?.comic?.externalId}`"
          class="card p-4 hover:border-white/15 transition group"
        >
          <div class="flex gap-3 mb-3">
            <img
              v-if="c.review?.comic"
              :src="getComicCover(c.review.comic)"
              :alt="c.review.comic.title"
              class="w-10 h-14 object-cover rounded shrink-0"
            />
            <div class="flex-1 min-w-0">
              <p class="text-xs text-gray-500 line-clamp-1">{{ c.review?.comic?.title }}</p>
              <p class="text-xs font-medium text-gray-400 mt-0.5">{{ c.user?.username }}</p>
            </div>
          </div>
          <p class="text-sm text-gray-400 leading-relaxed line-clamp-3">{{ c.content }}</p>
          <div class="flex items-center gap-1 mt-3 text-xs text-red-400">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            {{ c.likeCount }}
          </div>
        </NuxtLink>
      </div>
    </div>

  </div>
</template>

<script setup>
import { getComicCover } from '~/utils/comicCover.js'
definePageMeta({ middleware: 'auth' })

const config = useRuntimeConfig()
const base = config.public.apiBase
const { token } = useAuth()

const headers = computed(() => ({ Authorization: `Bearer ${token.value}` }))

const { data: feedData, pending: feedPending } = await useFetch(`${base}/feed`, { headers })
const { data: recoData } = await useFetch(`${base}/recommendations?limit=3`, { headers })
const { data: latestData } = await useFetch(`${base}/comics/latest?limit=5`)
const { data: trendingData } = await useFetch(`${base}/comics/trending?period=today&limit=5`)
const { data: topLikedData } = await useFetch(`${base}/comments/top-liked?period=7d&limit=6`)

function eventLabel(type) {
  switch (type) {
    case 'REVIEW':   return 'a noté'
    case 'FINISHED': return 'a terminé'
    case 'STARTED':  return 'a commencé'
    case 'ADDED':    return 'veut lire'
  }
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return "à l'instant"
  if (mins < 60)  return `il y a ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7)   return `il y a ${days}j`
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
</script>
