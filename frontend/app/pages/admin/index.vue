<template>
  <div class="min-h-screen px-4 sm:px-6 py-12">
    <div class="max-w-6xl mx-auto">

      <!-- En-tête -->
      <div class="flex items-center justify-between mb-10">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs text-red-400 mb-3">
            🛡 Dashboard Admin
          </div>
          <h1 class="text-3xl font-bold">Gestion des comics</h1>
        </div>
        <button @click="showUpload = true" class="btn-primary flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Ajouter un comic
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div v-for="s in stats" :key="s.label" class="card px-5 py-4 text-center">
          <div class="text-2xl font-black text-white mb-0.5">{{ s.value ?? '—' }}</div>
          <div class="text-xs text-gray-600">{{ s.label }}</div>
        </div>
      </div>

      <!-- Modal upload -->
      <Teleport to="body">
        <div v-if="showUpload" class="fixed inset-0 z-50 flex items-start justify-center px-4 py-8 overflow-y-auto">
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="closeUpload" />
          <div class="relative w-full max-w-lg my-auto">
            <div class="card p-7">
              <h2 class="text-xl font-bold mb-6">{{ editing ? 'Modifier le comic' : 'Ajouter un comic' }}</h2>

              <form @submit.prevent="submitComic" class="space-y-4">

                <!-- Titre -->
                <div>
                  <label class="block text-xs font-medium text-gray-400 mb-1.5">Titre *</label>
                  <input v-model="form.title" type="text" required placeholder="Ex: The Amazing Spider-Man #1" class="input" />
                </div>

                <!-- Auteurs -->
                <div>
                  <label class="block text-xs font-medium text-gray-400 mb-1.5">Auteur(s) <span class="text-gray-600">(séparés par des virgules)</span></label>
                  <input v-model="form.authors" type="text" placeholder="Stan Lee, Steve Ditko" class="input" />
                </div>

                <!-- Éditeur -->
                <div>
                  <label class="block text-xs font-medium text-gray-400 mb-1.5">Éditeur</label>
                  <input v-model="form.publisher" type="text" placeholder="Marvel Comics, DC Comics…" class="input" />
                </div>

                <!-- Genres -->
                <div>
                  <label class="block text-xs font-medium text-gray-400 mb-1.5">Genres <span class="text-gray-600">(séparés par des virgules)</span></label>
                  <input v-model="form.genres" type="text" placeholder="Super-héros, Action, Science-fiction" class="input" />
                </div>

                <!-- Description -->
                <div>
                  <label class="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
                  <textarea v-model="form.description" rows="3" placeholder="Synopsis…" class="input resize-none" />
                </div>

                <!-- Date de publication -->
                <div>
                  <label class="block text-xs font-medium text-gray-400 mb-1.5">Date de publication</label>
                  <input v-model="form.publishedAt" type="date" class="input" />
                </div>

                <!-- Fichier PDF -->
                <div v-if="!editing">
                  <label class="block text-xs font-medium text-gray-400 mb-1.5">Fichier PDF *</label>
                  <div
                    class="relative border-2 border-dashed border-white/10 hover:border-red-500/40 rounded-xl p-6 text-center cursor-pointer transition-colors"
                    @click="$refs.pdfInput.click()"
                    @dragover.prevent
                    @drop.prevent="onPdfDrop"
                    :class="pdfFile ? 'border-green-500/40 bg-green-500/5' : ''"
                  >
                    <input ref="pdfInput" type="file" accept=".pdf,application/pdf" class="hidden" @change="onPdfChange" />
                    <div v-if="pdfFile" class="flex items-center justify-center gap-3 text-green-400">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span class="text-sm font-medium">{{ pdfFile.name }}</span>
                      <span class="text-xs text-gray-500">({{ (pdfFile.size / 1024 / 1024).toFixed(1) }} Mo)</span>
                    </div>
                    <div v-else class="text-gray-500">
                      <svg class="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                      </svg>
                      <p class="text-sm">Glisse le PDF ici ou <span class="text-red-400">clique pour choisir</span></p>
                      <p class="text-xs mt-1">100 Mo maximum</p>
                    </div>
                  </div>
                </div>

                <!-- Image de couverture -->
                <div>
                  <label class="block text-xs font-medium text-gray-400 mb-1.5">
                    Couverture <span class="text-gray-600">(JPG / PNG — optionnel)</span>
                  </label>
                  <div
                    class="relative border-2 border-dashed border-white/10 hover:border-red-500/40 rounded-xl p-4 text-center cursor-pointer transition-colors"
                    @click="$refs.coverInput.click()"
                    :class="coverFile ? 'border-green-500/40 bg-green-500/5' : ''"
                  >
                    <input ref="coverInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onCoverChange" />
                    <div v-if="coverFile" class="flex items-center justify-center gap-3">
                      <img :src="coverPreview" class="w-10 h-14 object-cover rounded" />
                      <span class="text-sm text-green-400">{{ coverFile.name }}</span>
                    </div>
                    <div v-else class="text-gray-500 text-sm">
                      Clique pour ajouter une couverture
                    </div>
                  </div>
                </div>

                <!-- Progression upload -->
                <div v-if="uploading" class="space-y-2">
                  <div class="flex justify-between text-xs text-gray-400">
                    <span>Upload en cours…</span>
                    <span>{{ uploadProgress }}%</span>
                  </div>
                  <div class="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div class="h-full bg-red-500 transition-all duration-300" :style="`width: ${uploadProgress}%`" />
                  </div>
                </div>

                <!-- Erreur -->
                <div v-if="uploadError" class="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                  ⚠ {{ uploadError }}
                </div>

                <!-- Actions -->
                <div class="flex gap-3 pt-2">
                  <button
                    type="submit"
                    :disabled="uploading || (!editing && !pdfFile)"
                    class="btn-primary flex-1 justify-center disabled:opacity-40"
                  >
                    {{ uploading ? 'Envoi…' : (editing ? 'Enregistrer' : 'Uploader') }}
                  </button>
                  <button type="button" @click="closeUpload" class="btn-ghost flex-1 justify-center">
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Liste des comics -->
      <div v-if="loadingComics" class="flex items-center gap-3 text-gray-500 py-16">
        <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Chargement…
      </div>

      <div v-else-if="!comics.length" class="text-center py-24">
        <div class="text-5xl mb-4">📚</div>
        <p class="text-gray-400">Aucun comic. Commence par en uploader un.</p>
      </div>

      <div v-else class="overflow-hidden rounded-2xl border border-white/8">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-white/8 text-left text-xs text-gray-500">
              <th class="px-5 py-3.5 font-medium">Comic</th>
              <th class="px-5 py-3.5 font-medium hidden sm:table-cell">Auteurs</th>
              <th class="px-5 py-3.5 font-medium hidden md:table-cell">Genres</th>
              <th class="px-5 py-3.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="comic in comics"
              :key="comic.id"
              class="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors"
            >
              <!-- Titre + cover -->
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-12 rounded-lg overflow-hidden bg-white/5 shrink-0">
                    <img v-if="comic.coverUrl" :src="comic.coverUrl" class="w-full h-full object-cover" />
                    <div v-else class="w-full h-full flex items-center justify-center text-gray-700 text-lg">📚</div>
                  </div>
                  <div>
                    <p class="font-medium text-gray-100 line-clamp-1">{{ comic.title }}</p>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span class="text-xs text-gray-600">{{ comic._count.readingEntries }} lectures</span>
                      <span class="text-xs text-gray-600">·</span>
                      <span class="text-xs text-gray-600">{{ comic._count.reviews }} avis</span>
                      <a v-if="comic.pdfUrl" :href="comic.pdfUrl" target="_blank" class="text-xs text-blue-400 hover:text-blue-300 transition">PDF ↗</a>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4 hidden sm:table-cell text-gray-400 text-xs">
                {{ comic.authors.join(', ') || '—' }}
              </td>
              <td class="px-5 py-4 hidden md:table-cell">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="g in comic.genres.slice(0, 3)"
                    :key="g"
                    class="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-500"
                  >{{ g }}</span>
                </div>
              </td>
              <td class="px-5 py-4 text-right">
                <div class="flex items-center justify-end gap-3">
                  <NuxtLink
                    :to="`/comics/${comic.externalId}`"
                    class="text-xs text-gray-500 hover:text-gray-300 transition"
                  >
                    Voir
                  </NuxtLink>
                  <button @click="startEdit(comic)" class="text-xs text-gray-500 hover:text-yellow-400 transition">
                    Modifier
                  </button>
                  <button @click="deleteComic(comic)" class="text-xs text-gray-500 hover:text-red-400 transition">
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'admin' })

const config = useRuntimeConfig()
const base = config.public.apiBase
const { token } = useAuth()

function authHeaders() {
  return token.value ? { Authorization: `Bearer ${token.value}` } : {}
}

// Stats
const statsData = ref(null)
const stats = computed(() => [
  { label: 'Utilisateurs', value: statsData.value?.users },
  { label: 'Comics', value: statsData.value?.comics },
  { label: 'Avis', value: statsData.value?.reviews },
  { label: 'Lectures', value: statsData.value?.readingEntries },
])

// Comics
const comics = ref([])
const loadingComics = ref(true)

async function loadAll() {
  loadingComics.value = true
  try {
    const [s, c] = await Promise.all([
      $fetch(`${base}/admin/stats`, { headers: authHeaders() }),
      $fetch(`${base}/admin/comics`, { headers: authHeaders() }),
    ])
    statsData.value = s
    comics.value = c
  } catch {}
  loadingComics.value = false
}

onMounted(loadAll)

// Formulaire upload
const showUpload = ref(false)
const editing = ref(null) // comic en cours d'édition
const form = reactive({ title: '', authors: '', publisher: '', genres: '', description: '', publishedAt: '' })
const pdfFile = ref(null)
const coverFile = ref(null)
const coverPreview = ref('')
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadError = ref('')

function closeUpload() {
  showUpload.value = false
  editing.value = null
  Object.assign(form, { title: '', authors: '', publisher: '', genres: '', description: '', publishedAt: '' })
  pdfFile.value = null
  coverFile.value = null
  coverPreview.value = ''
  uploadError.value = ''
  uploadProgress.value = 0
}

function startEdit(comic) {
  editing.value = comic
  Object.assign(form, {
    title: comic.title,
    authors: comic.authors.join(', '),
    publisher: comic.publisher || '',
    genres: comic.genres.join(', '),
    description: comic.description || '',
    publishedAt: comic.publishedAt ? comic.publishedAt.split('T')[0] : '',
  })
  showUpload.value = true
}

function onPdfChange(e) {
  pdfFile.value = e.target.files[0] || null
}
function onPdfDrop(e) {
  const f = e.dataTransfer.files[0]
  if (f?.type === 'application/pdf') pdfFile.value = f
}
function onCoverChange(e) {
  const f = e.target.files[0]
  if (!f) return
  coverFile.value = f
  coverPreview.value = URL.createObjectURL(f)
}

async function submitComic() {
  uploadError.value = ''

  if (editing.value) {
    // Patch métadonnées seulement
    try {
      const updated = await $fetch(`${base}/admin/comics/${editing.value.id}`, {
        method: 'PATCH',
        body: {
          title: form.title,
          authors: form.authors,
          publisher: form.publisher,
          genres: form.genres,
          description: form.description,
          publishedAt: form.publishedAt || undefined,
        },
        headers: authHeaders(),
      })
      const idx = comics.value.findIndex(c => c.id === editing.value.id)
      if (idx !== -1) comics.value[idx] = { ...comics.value[idx], ...updated }
      closeUpload()
    } catch (e) {
      uploadError.value = e.data?.error || 'Erreur lors de la modification'
    }
    return
  }

  // Upload nouveau comic via XMLHttpRequest pour la progression
  uploading.value = true
  uploadProgress.value = 0

  const fd = new FormData()
  fd.append('title', form.title)
  fd.append('authors', form.authors)
  fd.append('genres', form.genres)
  fd.append('description', form.description)
  if (form.publishedAt) fd.append('publishedAt', form.publishedAt)
  fd.append('pdf', pdfFile.value)
  if (coverFile.value) fd.append('cover', coverFile.value)

  const xhr = new XMLHttpRequest()
  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) uploadProgress.value = Math.round((e.loaded / e.total) * 100)
  })
  xhr.addEventListener('load', () => {
    uploading.value = false
    if (xhr.status === 201) {
      const comic = JSON.parse(xhr.responseText)
      comics.value.unshift({ ...comic, _count: { readingEntries: 0, reviews: 0 } })
      statsData.value = { ...statsData.value, comics: (statsData.value?.comics ?? 0) + 1 }
      closeUpload()
    } else {
      uploadError.value = JSON.parse(xhr.responseText)?.error || 'Erreur upload'
    }
  })
  xhr.addEventListener('error', () => {
    uploading.value = false
    uploadError.value = 'Erreur réseau'
  })
  xhr.open('POST', `${base}/admin/comics`)
  xhr.setRequestHeader('Authorization', `Bearer ${token.value}`)
  xhr.send(fd)
}

async function deleteComic(comic) {
  if (!confirm(`Supprimer "${comic.title}" ? Cette action supprimera aussi le fichier PDF.`)) return
  try {
    await $fetch(`${base}/admin/comics/${comic.id}`, { method: 'DELETE', headers: authHeaders() })
    comics.value = comics.value.filter(c => c.id !== comic.id)
    if (statsData.value) statsData.value.comics = Math.max(0, statsData.value.comics - 1)
  } catch {}
}
</script>
