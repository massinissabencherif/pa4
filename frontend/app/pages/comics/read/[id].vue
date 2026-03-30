<template>
  <div class="min-h-screen bg-black flex flex-col">

    <!-- Barre de navigation du lecteur -->
    <div class="fixed top-0 inset-x-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/5 h-14 flex items-center px-4 gap-4">
      <NuxtLink
        :to="`/comics/${route.params.id}`"
        class="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition group"
      >
        <svg class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Retour
      </NuxtLink>

      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-200 truncate">{{ comic?.title ?? '…' }}</p>
      </div>

      <!-- Statut lecture -->
      <div v-if="entry" class="flex items-center gap-3">
        <span v-if="entry.status === 'FINISHED'" class="text-xs text-green-400 flex items-center gap-1">
          ✓ Terminé
        </span>
        <button
          v-else
          @click="markFinished"
          :disabled="finishing"
          class="text-xs px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition disabled:opacity-50"
        >
          {{ finishing ? '…' : "J'ai terminé" }}
        </button>
      </div>

      <a
        v-if="comic?.pdfUrl"
        :href="comic.pdfUrl"
        download
        class="text-xs text-gray-500 hover:text-gray-300 transition flex items-center gap-1.5"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        Télécharger
      </a>
    </div>

    <!-- Contenu -->
    <div class="flex-1 pt-14">
      <!-- Loading -->
      <div v-if="pending" class="flex items-center justify-center min-h-screen text-gray-500 gap-3">
        <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Chargement…
      </div>

      <!-- Pas de PDF -->
      <div v-else-if="!comic?.pdfUrl" class="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <div class="text-5xl mb-4">📄</div>
        <p class="text-gray-400 font-medium mb-2">Aucun fichier PDF disponible</p>
        <p class="text-gray-600 text-sm mb-6">Ce comic n'a pas encore de fichier de lecture associé.</p>
        <NuxtLink :to="`/comics/${route.params.id}`" class="btn-ghost !px-6">Retour au détail</NuxtLink>
      </div>

      <!-- Lecteur PDF -->
      <div v-else class="w-full h-[calc(100vh-3.5rem)]">
        <iframe
          :src="`${comic.pdfUrl}#toolbar=1&navpanes=0`"
          class="w-full h-full border-0"
          title="Lecteur PDF"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: false, middleware: 'auth' })

const route = useRoute()
const config = useRuntimeConfig()
const base = config.public.apiBase
const { token } = useAuth()

const { data: comic, pending } = await useFetch(`${base}/comics/${route.params.id}`)

const entry = ref(null)
const finishing = ref(false)

function authHeaders() {
  return { Authorization: `Bearer ${token.value}` }
}

async function loadEntry() {
  if (!comic.value) return
  try {
    const history = await $fetch(`${base}/history`, { headers: authHeaders() })
    entry.value = history.find(e => e.comicId === comic.value.id) ?? null
  } catch {}
}

async function setStatus(status) {
  if (!entry.value) {
    // Ajouter à la liste d'abord
    try {
      entry.value = await $fetch(`${base}/reading-list`, {
        method: 'POST',
        body: { comicId: comic.value.id },
        headers: authHeaders(),
      })
    } catch (e) {
      // Comic déjà dans la liste
      entry.value = e.data?.entry ?? null
    }
  }
  if (!entry.value?.id) return
  if (entry.value.status === status) return

  entry.value = await $fetch(`${base}/reading-list/${entry.value.id}/status`, {
    method: 'PATCH',
    body: { status },
    headers: authHeaders(),
  })
}

async function markFinished() {
  finishing.value = true
  try {
    await setStatus('FINISHED')
  } finally {
    finishing.value = false
  }
}

onMounted(async () => {
  await loadEntry()
  // Passer automatiquement en "En cours" à l'ouverture du lecteur
  if (comic.value && entry.value?.status !== 'FINISHED') {
    await setStatus('IN_PROGRESS')
  }
})
</script>
