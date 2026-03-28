<template>
  <div class="min-h-screen px-4 sm:px-6 py-12">
    <div class="max-w-5xl mx-auto">

      <!-- Loading -->
      <div v-if="pending" class="flex items-center gap-3 text-gray-500 py-16">
        <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Chargement…
      </div>

      <div v-else-if="fetchError" class="text-center py-24">
        <div class="text-5xl mb-4">🔒</div>
        <p class="text-gray-400 font-medium">{{ fetchError }}</p>
        <NuxtLink to="/" class="btn-ghost !px-6 mt-6 inline-block">Retour à l'accueil</NuxtLink>
      </div>

      <template v-else-if="list">
        <!-- Badge public -->
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-green-400 mb-8">
          <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          Liste publique
        </div>

        <!-- En-tête -->
        <div class="mb-10">
          <h1 class="text-3xl font-bold mb-2">{{ list.name }}</h1>
          <p class="text-gray-500 text-sm">
            Par <span class="text-gray-300 font-medium">{{ list.user.username }}</span>
            · {{ list.items.length }} comic{{ list.items.length !== 1 ? 's' : '' }}
          </p>
        </div>

        <!-- Vide -->
        <div v-if="!list.items.length" class="text-center py-20">
          <div class="text-5xl mb-4">📭</div>
          <p class="text-gray-500">Cette liste est vide pour l'instant.</p>
        </div>

        <!-- Grille -->
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <NuxtLink
            v-for="item in list.items"
            :key="item.comicId"
            :to="`/comics/${item.comic.externalId}`"
            class="group flex flex-col"
          >
            <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 mb-3 ring-1 ring-white/8 group-hover:ring-red-500/50 transition-all duration-200">
              <img
                v-if="item.comic.coverUrl"
                :src="item.comic.coverUrl"
                :alt="item.comic.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-3xl text-gray-700">📚</div>
            </div>
            <p class="text-sm font-medium text-gray-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">
              {{ item.comic.title }}
            </p>
          </NuxtLink>
        </div>

        <!-- CTA si non connecté -->
        <div v-if="!isLoggedIn" class="mt-16 card p-6 flex flex-col sm:flex-row items-center gap-5">
          <div class="flex-1">
            <p class="font-semibold mb-1">Tu aimes ces comics ?</p>
            <p class="text-sm text-gray-500">Crée ton compte pour suivre tes lectures et créer tes propres listes.</p>
          </div>
          <div class="flex gap-3 shrink-0">
            <NuxtLink to="/auth/register" class="btn-primary !py-2 !px-5 text-sm">S'inscrire</NuxtLink>
            <NuxtLink to="/auth/login" class="btn-ghost !py-2 !px-5 text-sm">Connexion</NuxtLink>
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
const { isLoggedIn } = useAuth()

const pending = ref(true)
const list = ref(null)
const fetchError = ref('')

onMounted(async () => {
  try {
    list.value = await $fetch(`${base}/lists/public/${route.params.slug}`)
  } catch (e) {
    fetchError.value = e.data?.error || 'Liste introuvable ou privée'
  }
  pending.value = false
})
</script>
