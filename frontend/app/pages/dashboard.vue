<template>
  <div class="min-h-screen px-4 sm:px-6 py-12">
    <div class="max-w-5xl mx-auto">

      <div class="mb-10">
        <h1 class="text-3xl font-bold mb-1">Mon tableau de bord</h1>
        <p class="text-gray-500 text-sm">Tes statistiques de lecture</p>
      </div>

      <div v-if="pending" class="flex justify-center py-20 text-gray-500">Chargement…</div>

      <div v-else-if="!stats" class="flex justify-center py-20 text-gray-600 text-sm">
        Impossible de charger les statistiques.
      </div>

      <template v-else>

        <!-- Compteurs principaux -->
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

          <!-- Activité mensuelle -->
          <div class="card p-6">
            <h2 class="text-sm font-semibold text-gray-300 mb-4">Activité des 12 derniers mois</h2>
            <div class="flex items-end gap-1 h-24">
              <div
                v-for="m in stats.monthlyActivity"
                :key="m.label"
                class="flex-1 flex flex-col items-center gap-1"
              >
                <div
                  class="w-full rounded-sm bg-red-500/70 transition-all"
                  :style="{ height: maxMonthly > 0 ? `${(m.count / maxMonthly) * 80}px` : '2px' }"
                  :title="`${m.count} comic(s) terminé(s)`"
                />
                <span class="text-[9px] text-gray-600 rotate-45 origin-left">{{ m.label }}</span>
              </div>
            </div>
          </div>

          <!-- Note moyenne -->
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

          <!-- Top genres -->
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
                    <div
                      class="h-full rounded-full bg-red-500/70"
                      :style="{ width: `${(g.count / stats.topGenres[0].count) * 100}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="text-gray-600 text-sm">Lis des comics pour voir tes genres préférés.</p>
          </div>

          <!-- Top auteurs -->
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
                    <div
                      class="h-full rounded-full bg-blue-500/70"
                      :style="{ width: `${(a.count / stats.topAuthors[0].count) * 100}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="text-gray-600 text-sm">Lis des comics pour voir tes auteurs préférés.</p>
          </div>
        </div>

        <!-- Badges -->
        <div class="card p-6">
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
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

const config = useRuntimeConfig()
const base = config.public.apiBase
const { token } = useAuth()

const { data: stats, pending } = await useFetch(`${base}/stats/me`, {
  headers: { Authorization: `Bearer ${token.value}` },
})

const maxMonthly = computed(() =>
  stats.value ? Math.max(...stats.value.monthlyActivity.map((m) => m.count), 1) : 1
)
</script>
