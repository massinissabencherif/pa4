<template>
  <div class="min-h-screen px-4 sm:px-6 py-12">
    <div class="max-w-5xl mx-auto">

      <BackButton to="/authors" label="Tous les auteurs" />

      <div v-if="pending" class="flex justify-center py-20 text-gray-500">Chargement…</div>

      <div v-else-if="error || !author" class="text-center py-20">
        <div class="text-4xl mb-3">🔍</div>
        <p class="text-gray-400">Auteur introuvable.</p>
      </div>

      <template v-else>
        <!-- En-tête auteur -->
        <div class="flex items-start gap-6 mb-12">
          <div class="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-4xl shrink-0">
            ✍️
          </div>
          <div>
            <h1 class="text-3xl font-bold mb-2">{{ author.name }}</h1>
            <p class="text-gray-400 text-sm leading-relaxed max-w-2xl">{{ author.bio }}</p>
            <p class="text-xs text-gray-600 mt-3">{{ author.comics.length }} comic{{ author.comics.length > 1 ? 's' : '' }} associé{{ author.comics.length > 1 ? 's' : '' }}</p>
          </div>
        </div>

        <!-- Comics de l'auteur -->
        <div>
          <h2 class="text-lg font-semibold mb-5">Comics</h2>

          <div v-if="author.comics.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <NuxtLink
              v-for="comic in author.comics"
              :key="comic.id"
              :to="`/comics/${comic.externalId}`"
              class="group flex flex-col"
            >
              <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 mb-3 ring-1 ring-white/8 group-hover:ring-red-500/50 transition-all duration-200">
                <img
                  :src="getComicCover(comic)"
                  :alt="comic.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span class="text-xs text-white font-medium">Voir →</span>
                </div>
                <!-- Note -->
                <div v-if="comic.avgRating" class="absolute top-2 right-2 bg-black/70 rounded-md px-1.5 py-0.5 text-xs font-semibold text-yellow-400">
                  ★ {{ comic.avgRating }}
                </div>
              </div>
              <p class="text-sm font-medium text-gray-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">
                {{ comic.title }}
              </p>
              <p class="text-xs text-gray-600 mt-0.5">{{ comic.reviewCount }} avis</p>
            </NuxtLink>
          </div>

          <div v-else class="text-gray-600 text-sm py-8">Aucun comic associé pour l'instant.</div>
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

const { data: author, pending, error } = await useFetch(`${base}/authors/${route.params.slug}`)
</script>
