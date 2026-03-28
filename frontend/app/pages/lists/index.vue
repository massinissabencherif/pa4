<template>
  <div class="min-h-screen px-4 sm:px-6 py-12">
    <div class="max-w-4xl mx-auto">

      <!-- En-tête -->
      <div class="flex items-center justify-between mb-10">
        <div>
          <h1 class="text-3xl font-bold mb-1">Mes listes</h1>
          <p class="text-gray-500 text-sm">Organise tes comics en collections thématiques.</p>
        </div>
        <button @click="showCreate = true" class="btn-primary flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nouvelle liste
        </button>
      </div>

      <!-- Modal création -->
      <div v-if="showCreate" class="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showCreate = false" />
        <div class="relative card p-6 w-full max-w-sm">
          <h2 class="font-bold mb-4">Créer une liste</h2>
          <input
            v-model="newName"
            type="text"
            placeholder="Nom de la liste…"
            class="input mb-3"
            @keydown.enter="createList"
            autofocus
          />
          <label class="flex items-center gap-3 mb-4 cursor-pointer">
            <div
              @click="newPublic = !newPublic"
              class="w-9 h-5 rounded-full transition-colors relative"
              :class="newPublic ? 'bg-red-600' : 'bg-white/10'"
            >
              <div class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                :class="newPublic ? 'translate-x-4' : 'translate-x-0.5'" />
            </div>
            <span class="text-sm text-gray-400">Rendre publique</span>
          </label>
          <div v-if="createError" class="text-xs text-red-400 mb-3">{{ createError }}</div>
          <div class="flex gap-3">
            <button @click="createList" :disabled="!newName.trim() || creating" class="btn-primary flex-1 justify-center disabled:opacity-40">
              Créer
            </button>
            <button @click="showCreate = false" class="btn-ghost flex-1 justify-center">Annuler</button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="flex items-center gap-3 text-gray-500 py-16">
        <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Chargement…
      </div>

      <!-- Vide -->
      <div v-else-if="!lists.length" class="text-center py-24">
        <div class="text-5xl mb-4">🗂️</div>
        <p class="text-gray-400 font-medium mb-1">Aucune liste pour l'instant</p>
        <p class="text-gray-600 text-sm mb-6">Crée ta première collection thématique.</p>
        <button @click="showCreate = true" class="btn-primary !px-6">Créer une liste</button>
      </div>

      <!-- Grille -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          v-for="list in lists"
          :key="list.id"
          class="card p-5 hover:border-white/15 transition-all group"
        >
          <div class="flex items-start justify-between gap-3 mb-3">
            <NuxtLink :to="`/lists/${list.id}`" class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-100 group-hover:text-white transition-colors truncate">
                {{ list.name }}
              </h3>
            </NuxtLink>
            <!-- Badge visibilité -->
            <button
              @click="toggleVisibility(list)"
              class="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all border"
              :class="list.isPublic
                ? 'border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                : 'border-white/10 bg-white/5 text-gray-500 hover:border-white/20'"
              :title="list.isPublic ? 'Rendre privée' : 'Rendre publique'"
            >
              <span>{{ list.isPublic ? '🌐' : '🔒' }}</span>
              {{ list.isPublic ? 'Publique' : 'Privée' }}
            </button>
          </div>

          <p class="text-xs text-gray-600 mb-4">
            {{ list._count.items }} comic{{ list._count.items !== 1 ? 's' : '' }}
          </p>

          <div class="flex items-center gap-3">
            <NuxtLink :to="`/lists/${list.id}`" class="text-xs text-gray-500 hover:text-gray-300 transition">
              Voir →
            </NuxtLink>
            <button
              v-if="list.isPublic"
              @click="copyLink(list.slug)"
              class="text-xs text-gray-500 hover:text-red-400 transition"
            >
              Copier le lien
            </button>
            <button
              @click="deleteList(list)"
              class="ml-auto text-xs text-gray-700 hover:text-red-400 transition"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>

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

const config = useRuntimeConfig()
const base = config.public.apiBase
const { token } = useAuth()

function authHeaders() {
  return token.value ? { Authorization: `Bearer ${token.value}` } : {}
}

const pending = ref(true)
const lists = ref([])

async function load() {
  pending.value = true
  try {
    lists.value = await $fetch(`${base}/lists`, { headers: authHeaders() })
  } catch {}
  pending.value = false
}

onMounted(load)

// Création
const showCreate = ref(false)
const newName = ref('')
const newPublic = ref(false)
const creating = ref(false)
const createError = ref('')

async function createList() {
  if (!newName.value.trim()) return
  creating.value = true
  createError.value = ''
  try {
    const list = await $fetch(`${base}/lists`, {
      method: 'POST',
      body: { name: newName.value.trim(), isPublic: newPublic.value },
      headers: authHeaders(),
    })
    lists.value.unshift({ ...list, _count: { items: 0 } })
    showCreate.value = false
    newName.value = ''
    newPublic.value = false
  } catch (e) {
    createError.value = e.data?.error || 'Erreur'
  } finally {
    creating.value = false
  }
}

// Visibilité
async function toggleVisibility(list) {
  try {
    const updated = await $fetch(`${base}/lists/${list.id}/visibility`, {
      method: 'PATCH',
      body: { isPublic: !list.isPublic },
      headers: authHeaders(),
    })
    const idx = lists.value.findIndex(l => l.id === list.id)
    if (idx !== -1) lists.value[idx] = { ...lists.value[idx], ...updated }
  } catch {}
}

// Suppression
async function deleteList(list) {
  if (!confirm(`Supprimer "${list.name}" ?`)) return
  try {
    await $fetch(`${base}/lists/${list.id}`, { method: 'DELETE', headers: authHeaders() })
    lists.value = lists.value.filter(l => l.id !== list.id)
  } catch {}
}

// Copie du lien
const copied = ref(false)
function copyLink(slug) {
  const url = `${window.location.origin}/lists/public/${slug}`
  navigator.clipboard.writeText(url)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>
