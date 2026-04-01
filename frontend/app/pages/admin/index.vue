<template>
  <div class="min-h-screen px-4 sm:px-6 py-12">
    <div class="max-w-6xl mx-auto">

      <!-- En-tête -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs text-red-400 mb-3">
            🛡 Dashboard Admin
          </div>
          <h1 class="text-3xl font-bold">Administration</h1>
        </div>
        <button v-if="activeTab === 'comics'" @click="showUpload = true" class="btn-primary flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Ajouter un comic
        </button>
        <button v-else @click="showAuthorForm = true" class="btn-primary flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Créer un auteur
        </button>
      </div>

      <!-- Onglets -->
      <div class="flex gap-1 mb-8 border-b border-white/8">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          class="px-5 py-2.5 text-sm font-medium transition border-b-2 -mb-px"
          :class="activeTab === tab.key ? 'text-white border-red-500' : 'text-gray-500 border-transparent hover:text-gray-300'"
        >
          {{ tab.label }}
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

                <!-- Auteurs (dropdown avec recherche) -->
                <div>
                  <label class="block text-xs font-medium text-gray-400 mb-1.5">Auteur(s)</label>
                  <!-- Tags sélectionnés -->
                  <div v-if="form.authorIds.length" class="flex flex-wrap gap-1.5 mb-2">
                    <span
                      v-for="id in form.authorIds"
                      :key="id"
                      class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs text-red-400"
                    >
                      {{ allAuthors.find(a => a.id === id)?.name }}
                      <button type="button" @click="form.authorIds = form.authorIds.filter(x => x !== id)" class="hover:text-white transition leading-none">×</button>
                    </span>
                  </div>
                  <div class="relative" ref="authorDropdownRef">
                    <input
                      v-model="authorSearch"
                      @focus="authorDropdownOpen = true"
                      type="text"
                      placeholder="Rechercher un auteur…"
                      class="input text-sm"
                      autocomplete="off"
                    />
                    <div
                      v-if="authorDropdownOpen && filteredAuthors.length"
                      class="absolute z-20 w-full mt-1 bg-[#13131a] border border-white/10 rounded-xl shadow-xl overflow-hidden"
                    >
                      <button
                        v-for="author in filteredAuthors"
                        :key="author.id"
                        type="button"
                        @click="toggleAuthorId(author.id); authorSearch = ''"
                        class="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition flex items-center justify-between"
                        :class="form.authorIds.includes(author.id) ? 'text-red-400' : 'text-gray-300'"
                      >
                        {{ author.name }}
                        <span v-if="form.authorIds.includes(author.id)" class="text-xs">✓</span>
                      </button>
                    </div>
                  </div>
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

      <!-- ─── ONGLET COMICS ─── -->
      <template v-if="activeTab === 'comics'">

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
              <th class="px-5 py-3.5 font-medium hidden sm:table-cell">Auteur / Éditeur</th>
              <th class="px-5 py-3.5 font-medium hidden md:table-cell">Genres</th>
              <th class="px-5 py-3.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="comic in comics" :key="comic.id" class="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-12 rounded-lg overflow-hidden bg-white/5 shrink-0">
                    <img v-if="comic.coverUrl" :src="comic.coverUrl" class="w-full h-full object-cover" />
                    <div v-else class="w-full h-full flex items-center justify-center text-gray-700 text-lg">📚</div>
                  </div>
                  <div>
                    <p class="font-medium text-gray-100 line-clamp-1">{{ comic.title }}</p>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span class="text-xs text-gray-600">{{ comic._count.readingEntries }} lectures · {{ comic._count.reviews }} avis</span>
                      <a v-if="comic.pdfUrl" :href="comic.pdfUrl" target="_blank" class="text-xs text-blue-400 hover:text-blue-300 transition">PDF ↗</a>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4 hidden sm:table-cell text-gray-400 text-xs">
                <span v-if="comic.authors?.length">{{ comic.authors.join(', ') }}</span>
                <span v-if="comic.publisher" class="text-gray-600 ml-1">{{ comic.authors?.length ? '·' : '' }} {{ comic.publisher }}</span>
                <span v-if="!comic.authors?.length && !comic.publisher">—</span>
              </td>
              <td class="px-5 py-4 hidden md:table-cell">
                <div class="flex flex-wrap gap-1">
                  <span v-for="g in comic.genres.slice(0, 3)" :key="g" class="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-500">{{ g }}</span>
                </div>
              </td>
              <td class="px-5 py-4 text-right">
                <div class="flex items-center justify-end gap-3">
                  <NuxtLink :to="`/comics/${comic.externalId}`" class="text-xs text-gray-500 hover:text-gray-300 transition">Voir</NuxtLink>
                  <button @click="startEdit(comic)" class="text-xs text-gray-500 hover:text-yellow-400 transition">Modifier</button>
                  <button @click="deleteComic(comic)" class="text-xs text-gray-500 hover:text-red-400 transition">Supprimer</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      </template>

      <!-- ─── ONGLET AUTEURS ─── -->
      <template v-if="activeTab === 'authors'">

        <!-- Modal créer/modifier auteur -->
        <Teleport to="body">
          <div v-if="showAuthorForm" class="fixed inset-0 z-50 flex items-start justify-center px-4 py-8 overflow-y-auto">
            <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="closeAuthorForm" />
            <div class="relative w-full max-w-md my-auto">
              <div class="card p-7">
                <h2 class="text-xl font-bold mb-6">{{ editingAuthor ? 'Modifier l\'auteur' : 'Créer un auteur' }}</h2>
                <form @submit.prevent="submitAuthor" class="space-y-4">
                  <div>
                    <label class="block text-xs font-medium text-gray-400 mb-1.5">Nom complet *</label>
                    <input v-model="authorForm.name" type="text" required placeholder="Ex: Frank Miller" class="input" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-400 mb-1.5">Date de naissance</label>
                    <input v-model="authorForm.birthDate" type="date" class="input" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-400 mb-1.5">Biographie</label>
                    <textarea v-model="authorForm.bio" rows="4" placeholder="Présentation de l'auteur…" class="input resize-none" />
                  </div>
                  <!-- Photo -->
                  <div>
                    <label class="block text-xs font-medium text-gray-400 mb-1.5">Photo <span class="text-gray-600">(JPG / PNG — optionnel)</span></label>
                    <div class="flex items-center gap-4">
                      <div class="w-14 h-14 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center text-2xl shrink-0">
                        <img v-if="authorPhotoPreview" :src="authorPhotoPreview" class="w-full h-full object-cover" />
                        <img v-else-if="editingAuthor?.photoUrl" :src="editingAuthor.photoUrl" class="w-full h-full object-cover" />
                        <span v-else>✍️</span>
                      </div>
                      <button type="button" @click="$refs.authorPhotoInput.click()" class="btn-ghost !py-1.5 !px-4 text-xs">
                        {{ authorPhotoFile ? authorPhotoFile.name : 'Choisir une photo' }}
                      </button>
                      <input ref="authorPhotoInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onAuthorPhotoChange" />
                    </div>
                  </div>
                  <div v-if="authorError" class="text-sm text-red-400">{{ authorError }}</div>
                  <div class="flex gap-3 pt-2">
                    <button type="submit" :disabled="authorSaving" class="btn-primary flex-1 justify-center disabled:opacity-40">
                      {{ authorSaving ? '…' : (editingAuthor ? 'Enregistrer' : 'Créer') }}
                    </button>
                    <button type="button" @click="closeAuthorForm" class="btn-ghost flex-1 justify-center">Annuler</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Teleport>

        <!-- Liste des auteurs -->
        <div v-if="!allAuthors.length" class="text-center py-24">
          <div class="text-5xl mb-4">✍️</div>
          <p class="text-gray-400">Aucun auteur. Crée le premier.</p>
        </div>
        <div v-else class="overflow-hidden rounded-2xl border border-white/8">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-white/8 text-left text-xs text-gray-500">
                <th class="px-5 py-3.5 font-medium">Auteur</th>
                <th class="px-5 py-3.5 font-medium hidden sm:table-cell">Naissance</th>
                <th class="px-5 py-3.5 font-medium hidden md:table-cell">Comics liés</th>
                <th class="px-5 py-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="author in allAuthors" :key="author.id" class="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center text-lg shrink-0">
                      <img v-if="author.photoUrl" :src="author.photoUrl" class="w-full h-full object-cover" />
                      <span v-else>✍️</span>
                    </div>
                    <div>
                      <p class="font-medium text-gray-100">{{ author.name }}</p>
                      <p v-if="author.bio" class="text-xs text-gray-600 line-clamp-1 mt-0.5">{{ author.bio }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-4 hidden sm:table-cell text-gray-400 text-xs">
                  {{ author.birthDate ? new Date(author.birthDate).toLocaleDateString('fr-FR') : '—' }}
                </td>
                <td class="px-5 py-4 hidden md:table-cell text-gray-400 text-xs">
                  {{ author._count?.comics ?? 0 }} comic{{ (author._count?.comics ?? 0) > 1 ? 's' : '' }}
                </td>
                <td class="px-5 py-4 text-right">
                  <div class="flex items-center justify-end gap-3">
                    <NuxtLink :to="`/authors/${author.slug}`" class="text-xs text-gray-500 hover:text-gray-300 transition">Voir</NuxtLink>
                    <button @click="startEditAuthor(author)" class="text-xs text-gray-500 hover:text-yellow-400 transition">Modifier</button>
                    <button @click="deleteAuthor(author)" class="text-xs text-gray-500 hover:text-red-400 transition">Supprimer</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </template>

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

onMounted(() => {
  loadAll()
  loadAuthors()
  document.addEventListener('click', (e) => {
    if (authorDropdownRef.value && !authorDropdownRef.value.contains(e.target)) {
      authorDropdownOpen.value = false
    }
  })
})

// Formulaire upload
const showUpload = ref(false)
const editing = ref(null) // comic en cours d'édition
const tabs = [{ key: 'comics', label: 'Comics' }, { key: 'authors', label: 'Auteurs' }]
const activeTab = ref('comics')

// Auteurs disponibles (pour le sélecteur dans le formulaire comic)
const allAuthors = ref([])

async function loadAuthors() {
  try {
    allAuthors.value = await $fetch(`${base}/admin/authors`, { headers: authHeaders() })
  } catch {}
}

const form = reactive({ title: '', publisher: '', genres: '', description: '', publishedAt: '', authorIds: [] })

// Dropdown auteurs
const authorSearch = ref('')
const authorDropdownOpen = ref(false)
const authorDropdownRef = ref(null)

const filteredAuthors = computed(() =>
  allAuthors.value.filter(a => a.name.toLowerCase().includes(authorSearch.value.toLowerCase()))
)

function toggleAuthorId(id) {
  if (form.authorIds.includes(id)) {
    form.authorIds = form.authorIds.filter(x => x !== id)
  } else {
    form.authorIds = [...form.authorIds, id]
  }
}

const pdfFile = ref(null)
const coverFile = ref(null)
const coverPreview = ref('')
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadError = ref('')

function closeUpload() {
  showUpload.value = false
  editing.value = null
  Object.assign(form, { title: '', publisher: '', genres: '', description: '', publishedAt: '', authorIds: [] })
  authorSearch.value = ''
  authorDropdownOpen.value = false
  pdfFile.value = null
  coverFile.value = null
  coverPreview.value = ''
  uploadError.value = ''
  uploadProgress.value = 0
}

async function startEdit(comic) {
  editing.value = comic
  // Charger les auteurs liés au comic
  let linkedIds = []
  try {
    const linked = await $fetch(`${base}/authors/for-comic/${comic.id}`)
    linkedIds = linked.map(a => a.id)
  } catch {}

  Object.assign(form, {
    title: comic.title,
    authors: comic.authors.join(', '),
    publisher: comic.publisher || '',
    genres: comic.genres.join(', '),
    description: comic.description || '',
    publishedAt: comic.publishedAt ? comic.publishedAt.split('T')[0] : '',
    authorIds: linkedIds,
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
          publisher: form.publisher,
          genres: form.genres,
          description: form.description,
          publishedAt: form.publishedAt || undefined,
          authorIds: form.authorIds,
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
  fd.append('publisher', form.publisher)
  fd.append('genres', form.genres)
  fd.append('description', form.description)
  if (form.publishedAt) fd.append('publishedAt', form.publishedAt)
  fd.append('pdf', pdfFile.value)
  if (coverFile.value) fd.append('cover', coverFile.value)

  const xhr = new XMLHttpRequest()
  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) uploadProgress.value = Math.round((e.loaded / e.total) * 100)
  })
  xhr.addEventListener('load', async () => {
    uploading.value = false
    if (xhr.status === 201) {
      const comic = JSON.parse(xhr.responseText)
      // Lier les auteurs si sélectionnés
      if (form.authorIds.length > 0) {
        try {
          await $fetch(`${base}/admin/comics/${comic.id}/authors`, {
            method: 'PATCH',
            body: { authorIds: form.authorIds },
            headers: authHeaders(),
          })
        } catch {}
      }
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

// ─── Gestion des auteurs ──────────────────────────────────────────────────────
const showAuthorForm = ref(false)
const editingAuthor = ref(null)
const authorForm = reactive({ name: '', birthDate: '', bio: '' })
const authorSaving = ref(false)
const authorError = ref('')
const authorPhotoFile = ref(null)
const authorPhotoPreview = ref('')

function onAuthorPhotoChange(e) {
  const f = e.target.files[0]
  if (!f) return
  authorPhotoFile.value = f
  authorPhotoPreview.value = URL.createObjectURL(f)
}

function closeAuthorForm() {
  showAuthorForm.value = false
  editingAuthor.value = null
  Object.assign(authorForm, { name: '', birthDate: '', bio: '' })
  authorError.value = ''
  authorPhotoFile.value = null
  authorPhotoPreview.value = ''
}

function startEditAuthor(author) {
  editingAuthor.value = author
  Object.assign(authorForm, {
    name: author.name,
    birthDate: author.birthDate ? author.birthDate.split('T')[0] : '',
    bio: author.bio || '',
  })
  authorPhotoFile.value = null
  authorPhotoPreview.value = ''
  showAuthorForm.value = true
}

async function submitAuthor() {
  authorSaving.value = true
  authorError.value = ''
  try {
    let result
    if (editingAuthor.value) {
      result = await $fetch(`${base}/admin/authors/${editingAuthor.value.id}`, {
        method: 'PATCH',
        body: { name: authorForm.name, bio: authorForm.bio, birthDate: authorForm.birthDate || undefined },
        headers: authHeaders(),
      })
      const idx = allAuthors.value.findIndex(a => a.id === editingAuthor.value.id)
      if (idx !== -1) allAuthors.value[idx] = { ...allAuthors.value[idx], ...result }
    } else {
      result = await $fetch(`${base}/admin/authors`, {
        method: 'POST',
        body: { name: authorForm.name, bio: authorForm.bio, birthDate: authorForm.birthDate || undefined },
        headers: authHeaders(),
      })
      allAuthors.value.push({ ...result, _count: { comics: 0 } })
    }
    // Upload photo si présente
    if (authorPhotoFile.value) {
      const fd = new FormData()
      fd.append('photo', authorPhotoFile.value)
      const withPhoto = await $fetch(`${base}/admin/authors/${result.id}/photo`, {
        method: 'PATCH',
        body: fd,
        headers: authHeaders(),
      })
      const idx = allAuthors.value.findIndex(a => a.id === result.id)
      if (idx !== -1) allAuthors.value[idx] = { ...allAuthors.value[idx], photoUrl: withPhoto.photoUrl }
    }
    closeAuthorForm()
  } catch (e) {
    authorError.value = e.data?.error || 'Erreur'
  } finally {
    authorSaving.value = false
  }
}

async function deleteAuthor(author) {
  if (!confirm(`Supprimer "${author.name}" ?`)) return
  try {
    await $fetch(`${base}/admin/authors/${author.id}`, { method: 'DELETE', headers: authHeaders() })
    allAuthors.value = allAuthors.value.filter(a => a.id !== author.id)
  } catch {}
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
