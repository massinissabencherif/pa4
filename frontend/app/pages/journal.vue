<template>
  <div>

    <!-- Page header -->
    <div style="border-bottom:1px solid #2a2a2a;">
      <div class="max-w-[1100px] mx-auto px-6 pt-9 pb-0">
        <div style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:5px;color:#e02020;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:10px;">
          <div style="width:16px;height:2px;background:#e02020;flex-shrink:0;"></div>
          Suivi de lecture
        </div>
        <div style="font-family:impact,sans-serif;font-size:52px;letter-spacing:1px;color:#fff;text-transform:uppercase;line-height:1;padding-bottom:18px;">MON JOURNAL</div>
      </div>
    </div>

    <div class="max-w-[1100px] mx-auto px-6 py-8">

      <!-- Loading -->
      <div v-if="pending" style="display:flex;align-items:center;gap:10px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;color:#888;text-transform:uppercase;padding:80px 0;" role="status" aria-label="Chargement du journal">
        <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Chargement…
      </div>

      <template v-else>

        <!-- Filtres -->
        <div style="display:flex;flex-wrap:wrap;gap:1px;background:#2a2a2a;margin-bottom:32px;" role="group" aria-label="Filtrer par statut">
          <button
            v-for="f in filters"
            :key="f.value"
            @click="activeFilter = f.value"
            :aria-pressed="activeFilter === f.value"
            style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;padding:10px 20px;border:none;cursor:pointer;transition:background 0.15s,color 0.15s;"
            :style="activeFilter === f.value
              ? 'background:#e02020;color:#fff;'
              : 'background:#111;color:#aaa;'"
            class="hover:bg-[#1a1a1a]"
          >
            {{ f.label }}
            <span style="opacity:0.6;margin-left:6px;" :aria-label="`${countFor(f.value)} comics`">{{ countFor(f.value) }}</span>
          </button>
        </div>

        <!-- Liste vide -->
        <div v-if="!filtered.length" style="text-align:center;padding:80px 0;">
          <div style="font-family:impact,sans-serif;font-size:48px;letter-spacing:2px;text-transform:uppercase;color:#2a2a2a;margin-bottom:12px;">📖</div>
          <p style="font-family:impact,sans-serif;font-size:18px;letter-spacing:2px;text-transform:uppercase;color:#555;margin-bottom:8px;">
            {{ activeFilter === 'ALL' ? 'Journal vide' : 'Aucun comic dans cette catégorie' }}
          </p>
          <p v-if="activeFilter === 'ALL'" style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;color:#444;text-transform:uppercase;margin-bottom:24px;">
            Commence par explorer des comics.
          </p>
          <NuxtLink v-if="activeFilter === 'ALL'" to="/comics/search" class="btn-primary">
            Explorer les comics
          </NuxtLink>
        </div>

        <!-- Grille -->
        <ul v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style="background:#2a2a2a;" aria-label="Comics du journal">
          <li
            v-for="entry in filtered"
            :key="entry.id"
            style="background:#111;display:flex;gap:16px;padding:16px;transition:background 0.15s;"
            class="hover:bg-[#141414] group"
          >
            <!-- Cover -->
            <NuxtLink :to="`/comics/${entry.comic.externalId}`" class="shrink-0">
              <div style="width:52px;aspect-ratio:2/3;overflow:hidden;background:#1e1e1e;flex-shrink:0;">
                <img
                  :src="getComicCover(entry.comic)"
                  :alt="entry.comic.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
              </div>
            </NuxtLink>

            <!-- Infos -->
            <div class="flex-1 min-w-0">
              <NuxtLink :to="`/comics/${entry.comic.externalId}`">
                <p style="font-family:impact,sans-serif;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;color:#fff;line-height:1.2;margin-bottom:10px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;" class="group-hover:text-[#e02020] transition-colors">
                  {{ entry.comic.title }}
                </p>
              </NuxtLink>

              <!-- Statut -->
              <label :for="`status-${entry.id}`" class="sr-only">Statut de lecture pour {{ entry.comic.title }}</label>
              <select
                :id="`status-${entry.id}`"
                v-model="entry.status"
                @change="updateStatus(entry)"
                style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;padding:5px 8px;background:#1a1a1a;border:1px solid #2a2a2a;color:#d4d4d4;cursor:pointer;margin-bottom:8px;width:100%;outline:none;"
              >
                <option value="TO_READ" style="background:#111;">📌 À lire</option>
                <option value="IN_PROGRESS" style="background:#111;">📖 En cours</option>
                <option value="FINISHED" style="background:#111;">✅ Terminé</option>
              </select>

              <!-- Note existante -->
              <div v-if="reviewMap[entry.comicId]" style="display:flex;align-items:center;gap:2px;margin-bottom:6px;">
                <span style="font-family:'Courier New',monospace;font-size:10px;color:#fbbf24;">{{ reviewMap[entry.comicId].rating }} ★</span>
              </div>

              <!-- Dates -->
              <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:1px;color:#888;line-height:1.6;">
                <div v-if="entry.startedAt">Commencé {{ fmt(entry.startedAt) }}</div>
                <div v-if="entry.finishedAt">Terminé {{ fmt(entry.finishedAt) }}</div>
                <div v-if="entry.lastReadAt && entry.status === 'IN_PROGRESS'">Lu {{ fmt(entry.lastReadAt) }}</div>
              </div>
            </div>

            <!-- Supprimer -->
            <button
              @click="removeEntry(entry)"
              style="flex-shrink:0;align-self:flex-start;color:#555;background:none;border:none;cursor:pointer;padding:4px;transition:color 0.15s;"
              class="hover:text-[#e02020]"
              :aria-label="`Retirer ${entry.comic.title} du journal`"
            >
              <svg style="width:14px;height:14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>

<script setup>
import { getComicCover } from '~/utils/comicCover.js'
definePageMeta({ middleware: 'auth' })

const config = useRuntimeConfig()
const base = config.public.apiBase
const { token } = useAuth()

function authHeaders() {
  return token.value ? { Authorization: `Bearer ${token.value}` } : {}
}

const pending = ref(true)
const entries = ref([])
const reviewMap = ref({})

async function load() {
  pending.value = true
  try {
    const history = await $fetch(`${base}/history`, { headers: authHeaders() })
    entries.value = history

    const { user } = useAuth()
    const rMap = {}
    await Promise.all(
      history.map(async (e) => {
        try {
          const comicReviews = await $fetch(`${base}/reviews/comic/${e.comicId}`)
          const mine = comicReviews.find(r => r.userId === user.value?.id)
          if (mine) rMap[e.comicId] = mine
        } catch {}
      })
    )
    reviewMap.value = rMap
  } catch {}
  pending.value = false
}

onMounted(load)

const activeFilter = ref('ALL')
const filters = [
  { value: 'ALL', label: 'Tout' },
  { value: 'TO_READ', label: 'À lire' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'FINISHED', label: 'Terminé' },
]

const filtered = computed(() =>
  activeFilter.value === 'ALL'
    ? entries.value
    : entries.value.filter(e => e.status === activeFilter.value)
)

function countFor(val) {
  if (val === 'ALL') return entries.value.length
  return entries.value.filter(e => e.status === val).length
}

async function updateStatus(entry) {
  try {
    const updated = await $fetch(`${base}/reading-list/${entry.id}/status`, {
      method: 'PATCH',
      body: { status: entry.status },
      headers: authHeaders(),
    })
    const idx = entries.value.findIndex(e => e.id === entry.id)
    if (idx !== -1) entries.value[idx] = { ...entries.value[idx], ...updated }
  } catch {}
}

async function removeEntry(entry) {
  try {
    await $fetch(`${base}/reading-list/${entry.id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    entries.value = entries.value.filter(e => e.id !== entry.id)
  } catch {}
}

function fmt(date) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>
