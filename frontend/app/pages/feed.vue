<template>
  <div>

    <!-- Page header -->
    <div style="border-bottom:1px solid #2a2a2a;">
      <div class="max-w-[1600px] mx-auto px-6 pt-9 pb-0">
        <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:5px;color:#e02020;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:10px;">
          <div style="width:16px;height:2px;background:#e02020;flex-shrink:0;"></div>
          Activité · Communauté
        </div>
        <div style="font-family:impact,sans-serif;font-size:52px;letter-spacing:1px;color:#fff;text-transform:uppercase;line-height:1;padding-bottom:18px;">FIL D'ACT.</div>
      </div>
    </div>

    <div class="max-w-[1600px] mx-auto px-6 py-8">
      <div class="flex gap-8">

        <!-- ── Feed principal ── -->
        <div class="flex-1 min-w-0">

          <!-- Bannière suggestion -->
          <div v-if="feedData?.suggestion" style="display:flex;align-items:center;gap:14px;background:rgba(224,32,32,0.06);border:1px solid rgba(224,32,32,0.2);border-top:2px solid #e02020;padding:16px 20px;margin-bottom:24px;">
            <span style="font-size:20px;flex-shrink:0;">👥</span>
            <div>
              <p style="font-family:impact,sans-serif;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#fff;">Suis des fans de comics pour personnaliser ton fil</p>
              <p style="font-family:'Courier New',monospace;font-size:12px;letter-spacing:1px;color:#fff;margin-top:4px;">En attendant, voici quelques activités de la communauté</p>
            </div>
          </div>

          <!-- Loading skeletons -->
          <div v-if="feedPending" class="space-y-4">
            <div v-for="i in 5" :key="i" class="card p-5 animate-pulse">
              <div class="flex gap-3">
                <div class="w-10 h-10 bg-white/8 flex-shrink-0"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-3 bg-white/8 w-1/3"></div>
                  <div class="h-3 bg-white/8 w-2/3"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Événements -->
          <div v-else-if="feedData?.events?.length" class="space-y-px" style="background:#2a2a2a;">
            <div
              v-for="event in feedData?.events"
              :key="`${event.type}-${event.id}`"
              style="background:#0f0f0f;padding:16px 20px;transition:background 0.15s;"
              class="hover:bg-[#141414]"
            >
              <div class="flex gap-4">
                <!-- Cover -->
                <NuxtLink :to="`/comics/${event.comic.externalId}`" class="shrink-0">
                  <div style="width:44px;height:60px;overflow:hidden;background:#1e1e1e;flex-shrink:0;">
                    <img
                      :src="getComicCover(event.comic)"
                      :alt="event.comic.title"
                      class="w-full h-full object-cover"
                    />
                  </div>
                </NuxtLink>

                <!-- Contenu -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2 mb-1">
                    <p style="font-family:'Courier New',monospace;font-size:13px;letter-spacing:0.5px;">
                      <NuxtLink :to="`/profile/${event.user.username}`" style="color:#fff;font-weight:700;text-decoration:none;transition:color 0.15s;" class="hover:text-[#e02020]">
                        {{ event.user.username }}
                      </NuxtLink>
                      <span style="color:#fff;"> {{ eventLabel(event.type) }} </span>
                      <NuxtLink :to="`/comics/${event.comic.externalId}`" style="color:#fff;text-decoration:none;transition:color 0.15s;" class="hover:text-white">
                        {{ event.comic.title }}
                      </NuxtLink>
                    </p>
                    <span style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:#fff;white-space:nowrap;flex-shrink:0;">{{ timeAgo(event.date) }}</span>
                  </div>

                  <!-- Étoiles + avis -->
                  <template v-if="event.type === 'REVIEW'">
                    <div class="flex gap-0.5 mb-1">
                      <span style="font-family:'Courier New',monospace;font-size:13px;color:#fbbf24;">{{ event.data.rating }} ★</span>
                    </div>
                    <p v-if="event.data.content" style="font-family:'Courier New',monospace;font-size:13px;line-height:1.6;color:#fff;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">{{ event.data.content }}</p>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- État vide -->
          <div v-else-if="!feedPending" style="text-align:center;padding:80px 24px;">
            <div style="font-family:impact,sans-serif;font-size:40px;letter-spacing:2px;text-transform:uppercase;color:#2a2a2a;margin-bottom:12px;">AUCUNE ACTIVITÉ</div>
            <div style="font-family:'Courier New',monospace;font-size:12px;letter-spacing:3px;color:#fff;text-transform:uppercase;">Suis des membres pour voir leur activité ici.</div>
          </div>
        </div>

        <!-- ── Sidebar droite ── -->
        <aside class="hidden lg:block w-72 shrink-0">

          <!-- Recommandations -->
          <div style="border:1px solid #2a2a2a;border-top:2px solid #e02020;margin-bottom:24px;">
            <div style="padding:12px 16px;border-bottom:1px solid #2a2a2a;display:flex;justify-content:space-between;align-items:center;">
              <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;color:#e02020;text-transform:uppercase;">Pour toi</div>
              <span style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:#fff;">
                {{ recoData?.basis === 'taste' ? 'GOÛTS' : 'POPULAR' }}
              </span>
            </div>
            <div v-if="recoData?.basis === 'taste' && recoData?.topGenres?.length" style="padding:8px 16px;border-bottom:1px solid #1e1e1e;">
              <p style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:#fff;text-transform:uppercase;">{{ recoData.topGenres.slice(0,3).join(' · ') }}</p>
            </div>
            <NuxtLink
              v-for="comic in recoData?.recommendations"
              :key="comic.id"
              :to="`/comics/${comic.externalId}`"
              style="display:flex;gap:12px;align-items:flex-start;padding:12px 16px;border-bottom:1px solid #1e1e1e;text-decoration:none;transition:background 0.15s;"
              class="hover:bg-[#141414] group"
            >
              <div style="width:36px;height:50px;overflow:hidden;background:#1e1e1e;flex-shrink:0;">
                <img :src="getComicCover(comic)" :alt="comic.title" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0">
                <p style="font-family:impact,sans-serif;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;color:#fff;line-height:1.2;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;" class="group-hover:text-[#e02020] transition-colors">{{ comic.title }}</p>
                <p style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1px;color:#fff;text-transform:uppercase;margin-bottom:2px;">{{ comic.genres?.slice(0,2).join(' · ') }}</p>
                <div v-if="comic.avgRating" style="font-family:'Courier New',monospace;font-size:11px;color:#fbbf24;">{{ comic.avgRating.toFixed(1) }} ★</div>
              </div>
            </NuxtLink>
          </div>

        </aside>
      </div>

      <div class="mt-10">
        <AdSlot placement="HOME" />
      </div>

      <!-- Tendances du jour -->
      <div v-if="trendingData?.comics?.length" class="mt-10">
        <div style="display:flex;align-items:baseline;gap:16px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #2a2a2a;">
          <div style="font-family:impact,sans-serif;font-size:22px;letter-spacing:1px;text-transform:uppercase;color:#fff;">Tendances du jour</div>
          <div style="width:20px;height:2px;background:#e02020;flex-shrink:0;align-self:center;"></div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style="background:#2a2a2a;">
          <NuxtLink
            v-for="comic in trendingData.comics"
            :key="comic.id"
            :to="`/comics/${comic.externalId}`"
            style="background:#0f0f0f;display:flex;gap:12px;padding:16px;text-decoration:none;transition:background 0.15s;"
            class="hover:bg-[#141414] group"
          >
            <div style="width:40px;height:56px;overflow:hidden;background:#1e1e1e;flex-shrink:0;">
              <img :src="getComicCover(comic)" :alt="comic.title" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 min-w-0">
              <p style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#fff;margin-bottom:4px;">{{ comic.publisher || '' }}</p>
              <p style="font-family:impact,sans-serif;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;color:#fff;line-height:1.2;margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;" class="group-hover:text-[#e02020] transition-colors">{{ comic.title }}</p>
              <p style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:#fff;text-transform:uppercase;margin-bottom:2px;">{{ comic.readCount }} lecture{{ comic.readCount > 1 ? 's' : '' }}</p>
              <div v-if="comic.avgRating" style="font-family:'Courier New',monospace;font-size:11px;color:#fbbf24;">{{ comic.avgRating.toFixed(1) }} ★</div>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Derniers ajouts -->
      <div v-if="latestData?.comics?.length" class="mt-10">
        <div style="display:flex;align-items:baseline;gap:16px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #2a2a2a;">
          <div style="font-family:impact,sans-serif;font-size:22px;letter-spacing:1px;text-transform:uppercase;color:#fff;">Derniers ajouts</div>
          <div style="width:20px;height:2px;background:#e02020;flex-shrink:0;align-self:center;"></div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style="background:#2a2a2a;">
          <NuxtLink
            v-for="comic in latestData.comics"
            :key="comic.id"
            :to="`/comics/${comic.externalId}`"
            style="background:#0f0f0f;display:flex;gap:12px;padding:16px;text-decoration:none;transition:background 0.15s;"
            class="hover:bg-[#141414] group"
          >
            <div style="width:40px;height:56px;overflow:hidden;background:#1e1e1e;flex-shrink:0;">
              <img :src="getComicCover(comic)" :alt="comic.title" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 min-w-0">
              <p style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#fff;margin-bottom:4px;">{{ comic.publisher || '' }}</p>
              <p style="font-family:impact,sans-serif;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;color:#fff;line-height:1.2;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;" class="group-hover:text-[#e02020] transition-colors">{{ comic.title }}</p>
              <div v-if="comic.avgRating" style="font-family:'Courier New',monospace;font-size:11px;color:#fbbf24;">{{ comic.avgRating.toFixed(1) }} ★</div>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Commentaires les plus aimés -->
      <div v-if="topLikedData?.comments?.length" class="mt-10">
        <div style="display:flex;align-items:baseline;gap:16px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #2a2a2a;">
          <div style="font-family:impact,sans-serif;font-size:22px;letter-spacing:1px;text-transform:uppercase;color:#fff;">Avis populaires</div>
          <div style="width:20px;height:2px;background:#e02020;flex-shrink:0;align-self:center;"></div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style="background:#2a2a2a;">
          <NuxtLink
            v-for="c in topLikedData.comments"
            :key="c.id"
            :to="`/comics/${c.review?.comic?.externalId}`"
            style="background:#0f0f0f;display:flex;flex-direction:column;padding:16px;text-decoration:none;transition:background 0.15s;"
            class="hover:bg-[#141414] group"
          >
            <div class="flex gap-3 mb-3">
              <div v-if="c.review?.comic" style="width:40px;height:56px;overflow:hidden;background:#1e1e1e;flex-shrink:0;">
                <img :src="getComicCover(c.review.comic)" :alt="c.review.comic.title" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0">
                <p style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#fff;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ c.review?.comic?.title }}</p>
                <p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:1px;color:#fff;margin-top:2px;">{{ c.user?.username }}</p>
              </div>
            </div>
            <p style="font-family:'Courier New',monospace;font-size:13px;line-height:1.6;color:#fff;flex:1;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">{{ c.content }}</p>
            <div style="display:flex;align-items:center;gap:6px;margin-top:12px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;color:#e02020;text-transform:uppercase;">
              <svg style="width:12px;height:12px;" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              {{ c.likeCount }}
            </div>
          </NuxtLink>
        </div>
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
