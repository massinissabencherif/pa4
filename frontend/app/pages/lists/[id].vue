<template>
  <div class="min-h-screen px-4 sm:px-6 py-12">
    <div class="max-w-5xl mx-auto">

      <!-- Back -->
      <NuxtLink
        to="/lists"
        class="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-300 transition mb-10 group"
      >
        <svg class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Mes listes
      </NuxtLink>

      <!-- Loading -->
      <div v-if="pending" class="flex items-center gap-3 text-gray-500">
        <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Chargement…
      </div>

      <template v-else-if="list">
        <!-- En-tête liste -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <!-- Nom éditable -->
          <div class="flex-1">
            <div v-if="!editingName" class="flex items-center gap-3">
              <h1 class="text-3xl font-bold">{{ list.name }}</h1>
              <button @click="startEditName" class="text-gray-600 hover:text-gray-300 transition p-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
            </div>
            <div v-else class="flex items-center gap-2">
              <input v-model="editName" class="input text-2xl font-bold !bg-transparent flex-1" @keydown.enter="saveName" @keydown.escape="editingName = false" autofocus />
              <button @click="saveName" class="btn-primary !py-1.5 !px-4 text-sm">OK</button>
              <button @click="editingName = false" class="btn-ghost !py-1.5 !px-4 text-sm">✕</button>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3 shrink-0">
            <button
              @click="toggleVisibility"
              class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all border"
              :class="list.isPublic
                ? 'border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                : 'border-white/10 bg-white/5 text-gray-500 hover:border-white/20'"
            >
              {{ list.isPublic ? '🌐 Publique' : '🔒 Privée' }}
            </button>
            <button
              v-if="list.isPublic"
              @click="copyLink"
              class="btn-ghost !py-2 !px-3 text-sm"
            >
              Copier le lien
            </button>
          </div>
        </div>

        <!-- Info count -->
        <p class="text-sm text-gray-600 mb-8">
          {{ list.items.length }} comic{{ list.items.length !== 1 ? 's' : '' }} dans cette liste
        </p>

        <!-- Vide -->
        <div v-if="!list.items.length" class="text-center py-20">
          <div class="text-5xl mb-4">📭</div>
          <p class="text-gray-400 mb-2">Cette liste est vide</p>
          <p class="text-gray-600 text-sm">Ajoute des comics depuis la page de recherche ou les pages détail.</p>
          <NuxtLink to="/comics/search" class="btn-ghost !px-6 mt-6 inline-block">Explorer les comics</NuxtLink>
        </div>

        <!-- Grille comics -->
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div
            v-for="item in list.items"
            :key="item.comicId"
            class="group flex flex-col relative"
          >
            <!-- Bouton retirer -->
            <button
              @click="removeComic(item.comicId)"
              class="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/60 text-gray-400 hover:text-red-400 hover:bg-black/80 transition flex items-center justify-center opacity-0 group-hover:opacity-100"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <NuxtLink :to="`/comics/${item.comic.externalId}`" class="flex flex-col flex-1">
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
        </div>
      </template>

      <!-- Toast copie -->
      <div
        v-if="copied"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-green-500/20 border border-green-500/30 text-green-400 text-sm rounded-xl backdrop-blur-sm z-50"
      >
        Lien copié ✓
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const config = useRuntimeConfig()
const base = config.public.apiBase
const { token } = useAuth()

function authHeaders() {
  return token.value ? { Authorization: `Bearer ${token.value}` } : {}
}

const pending = ref(true)
const list = ref(null)

async function load() {
  pending.value = true
  try {
    list.value = await $fetch(`${base}/lists/${route.params.id}`, { headers: authHeaders() })
  } catch {}
  pending.value = false
}

onMounted(load)

// Édition du nom
const editingName = ref(false)
const editName = ref('')

function startEditName() {
  editName.value = list.value.name
  editingName.value = true
}

async function saveName() {
  if (!editName.value.trim()) return
  try {
    const updated = await $fetch(`${base}/lists/${list.value.id}`, {
      method: 'PATCH',
      body: { name: editName.value.trim() },
      headers: authHeaders(),
    })
    list.value = { ...list.value, ...updated }
    editingName.value = false
  } catch {}
}

// Visibilité
async function toggleVisibility() {
  try {
    const updated = await $fetch(`${base}/lists/${list.value.id}/visibility`, {
      method: 'PATCH',
      body: { isPublic: !list.value.isPublic },
      headers: authHeaders(),
    })
    list.value = { ...list.value, ...updated }
  } catch {}
}

// Retirer un comic
async function removeComic(comicId) {
  try {
    await $fetch(`${base}/lists/${list.value.id}/comics/${comicId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    list.value.items = list.value.items.filter(i => i.comicId !== comicId)
  } catch {}
}

// Copie du lien
const copied = ref(false)
function copyLink() {
  const url = `${window.location.origin}/lists/public/${list.value.slug}`
  navigator.clipboard.writeText(url)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>
