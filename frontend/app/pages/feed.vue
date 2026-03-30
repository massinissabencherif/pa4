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
                  v-if="event.comic.coverUrl"
                  :src="event.comic.coverUrl"
                  :alt="event.comic.title"
                  class="w-12 h-16 object-cover rounded-lg"
                />
                <div v-else class="w-12 h-16 bg-white/5 rounded-lg flex items-center justify-center text-gray-600 text-xs">
                  📄
                </div>
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

      <!-- ── Recommandations ───────────────────────────────────────────── -->
      <aside class="hidden lg:block w-72 shrink-0">
        <h2 class="text-lg font-bold mb-4">Recommandations</h2>

        <div v-if="recoData?.basis === 'popular' || recoData?.basis === 'taste'" class="mb-3">
          <p class="text-xs text-gray-600">
            {{ recoData.basis === 'taste' ? `Basé sur : ${recoData.topGenres?.slice(0,3).join(', ')}` : 'Comics populaires' }}
          </p>
        </div>

        <div class="space-y-3">
          <div v-if="recoPending" v-for="i in 4" :key="i" class="card p-3 animate-pulse flex gap-3">
            <div class="w-10 h-14 bg-white/5 rounded"></div>
            <div class="flex-1 space-y-2 py-1">
              <div class="h-3 bg-white/5 rounded w-3/4"></div>
              <div class="h-3 bg-white/5 rounded w-1/2"></div>
            </div>
          </div>

          <NuxtLink
            v-for="comic in recoData?.recommendations"
            :key="comic.id"
            :to="`/comics/${comic.externalId}`"
            class="card p-3 flex gap-3 hover:border-white/15 transition group"
          >
            <img
              v-if="comic.coverUrl"
              :src="comic.coverUrl"
              :alt="comic.title"
              class="w-10 h-14 object-cover rounded"
            />
            <div v-else class="w-10 h-14 bg-white/5 rounded flex items-center justify-center text-gray-600 text-xs shrink-0">📄</div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium group-hover:text-white transition line-clamp-2">{{ comic.title }}</p>
              <p class="text-xs text-gray-600 mt-1">{{ comic.genres.slice(0,2).join(', ') }}</p>
            </div>
          </NuxtLink>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

const config = useRuntimeConfig()
const base = config.public.apiBase
const { token } = useAuth()

const headers = computed(() => ({ Authorization: `Bearer ${token.value}` }))

const { data: feedData, pending: feedPending } = await useFetch(`${base}/feed`, { headers })
const { data: recoData, pending: recoPending } = await useFetch(`${base}/recommendations?limit=3`, { headers })

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
