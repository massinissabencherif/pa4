<template>
  <div>

    <!-- Header -->
    <div style="border-bottom:1px solid #1e1e1e;">
      <div class="max-w-[1100px] mx-auto px-6 pt-9 pb-0">
        <div style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:5px;color:#e02020;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:10px;">
          <div style="width:16px;height:2px;background:#e02020;flex-shrink:0;"></div>
          Conseiller de lecture IA
        </div>
        <div style="font-family:impact,sans-serif;font-size:52px;letter-spacing:1px;color:#fff;text-transform:uppercase;line-height:1;padding-bottom:18px;">POUR TOI</div>
      </div>
    </div>

    <!-- ─── Assistant IA ─────────────────────────────────────────────────── -->
    <div style="border-bottom:1px solid #1e1e1e;background:#0c0c0c;">
      <div class="max-w-[1100px] mx-auto px-6 py-8">
        <form @submit.prevent="askAssistant()" style="display:flex;gap:10px;margin-bottom:12px;">
          <input
            v-model="aiQuery"
            type="text"
            placeholder="Décris ce que tu cherches… (ex : un comic sombre, SF, peu violent, à lire en une soirée)"
            maxlength="500"
            style="flex:1;background:#111;border:1px solid #2a2a2a;color:#fff;font-family:'Courier New',monospace;font-size:12px;padding:12px 14px;"
          />
          <button
            type="submit"
            :disabled="aiLoading || !aiQuery.trim()"
            class="btn-primary"
            style="font-size:11px;padding:0 22px;white-space:nowrap;"
            :style="(aiLoading || !aiQuery.trim()) ? 'opacity:0.4;cursor:default;' : ''"
          >{{ aiLoading ? '…' : 'DEMANDER' }}</button>
        </form>

        <!-- Exemples pré-remplis -->
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;">
          <button
            v-for="example in examples"
            :key="example"
            type="button"
            @click="askAssistant(example)"
            :disabled="aiLoading"
            style="background:transparent;border:1px solid #2a2a2a;color:#888;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.5px;padding:6px 12px;cursor:pointer;transition:border-color 0.15s,color 0.15s;"
            @mouseover="e => { e.target.style.borderColor='#e02020'; e.target.style.color='#e02020' }"
            @mouseleave="e => { e.target.style.borderColor='#2a2a2a'; e.target.style.color='#888' }"
          >{{ example }}</button>
        </div>

        <!-- Erreur -->
        <div v-if="aiError" style="display:flex;align-items:center;gap:8px;background:rgba(224,32,32,0.08);border:1px solid rgba(224,32,32,0.2);padding:12px 16px;font-family:'Courier New',monospace;font-size:12px;color:#e02020;margin-bottom:16px;">
          ⚠ {{ aiError }}
        </div>

        <!-- Loading -->
        <div v-if="aiLoading" style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:4px;color:#555;text-transform:uppercase;padding:24px 0;">Réflexion en cours…</div>

        <!-- Message de fallback (IA indisponible) -->
        <div v-if="aiMessage" style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:1px;color:#e0a020;margin-bottom:14px;">{{ aiMessage }}</div>

        <!-- Intro générée -->
        <p v-if="aiIntro" style="font-family:'Courier New',monospace;font-size:13px;line-height:1.7;color:#fff;margin-bottom:16px;">{{ aiIntro }}</p>

        <!-- Résultats IA -->
        <template v-if="aiResults.length">
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1px;background:#1a1a1a;margin-bottom:16px;">
            <div v-for="r in aiResults" :key="r.comic.id" style="background:#0f0f0f;display:flex;flex-direction:column;overflow:hidden;">
              <NuxtLink :to="`/comics/${r.comic.externalId}`" style="text-decoration:none;display:flex;gap:12px;padding:12px;">
                <img
                  :src="getComicCover(r.comic)"
                  :alt="r.comic.title"
                  style="width:56px;aspect-ratio:2/3;object-fit:cover;flex-shrink:0;"
                  loading="lazy"
                />
                <div style="display:flex;flex-direction:column;gap:6px;min-width:0;">
                  <div style="font-family:impact,sans-serif;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;color:#fff;line-height:1.15;">{{ r.comic.title }}</div>
                  <p v-if="r.justification" style="font-family:'Courier New',monospace;font-size:10px;line-height:1.6;color:#888;">{{ r.justification }}</p>
                </div>
              </NuxtLink>
            </div>
          </div>

          <button
            @click="saveCurrentQuery"
            :disabled="savingQuery || justSaved"
            style="background:transparent;border:1px solid #2a2a2a;color:#888;font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:8px 16px;cursor:pointer;transition:border-color 0.15s,color 0.15s;"
            :style="justSaved ? 'border-color:#22c55e;color:#22c55e;' : ''"
          >{{ justSaved ? '✓ ENREGISTRÉ' : (savingQuery ? '…' : '☆ ENREGISTRER CETTE RECHERCHE') }}</button>
        </template>
      </div>
    </div>

    <!-- ─── Recherches enregistrées ──────────────────────────────────────── -->
    <div v-if="savedQueries.length" style="border-bottom:1px solid #1e1e1e;">
      <div class="max-w-[1100px] mx-auto px-6 py-8">
        <div style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:5px;color:#e02020;text-transform:uppercase;margin-bottom:20px;display:flex;align-items:center;gap:10px;">
          <div style="width:16px;height:2px;background:#e02020;flex-shrink:0;"></div>
          Mes recherches enregistrées
        </div>

        <div v-for="saved in savedQueries" :key="saved.id" style="border:1px solid #1e1e1e;padding:16px;margin-bottom:12px;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;">
            <p style="font-family:'Courier New',monospace;font-size:12px;color:#fff;line-height:1.5;">« {{ saved.query }} »</p>
            <button
              @click="deleteSavedQuery(saved.id)"
              :disabled="deletingId === saved.id"
              style="flex-shrink:0;background:transparent;border:1px solid #2a2a2a;color:#888;font-family:'Courier New',monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase;padding:5px 10px;cursor:pointer;transition:border-color 0.15s,color 0.15s;"
              @mouseover="e => { e.target.style.borderColor='#e02020'; e.target.style.color='#e02020' }"
              @mouseleave="e => { e.target.style.borderColor='#2a2a2a'; e.target.style.color='#888' }"
            >{{ deletingId === saved.id ? '…' : 'Supprimer' }}</button>
          </div>
          <p v-if="saved.intro" style="font-family:'Courier New',monospace;font-size:11px;color:#888;line-height:1.6;margin-bottom:12px;">{{ saved.intro }}</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1px;background:#1a1a1a;">
            <div v-for="(r, i) in saved.results" :key="`${saved.id}-${i}`" style="background:#0f0f0f;display:flex;flex-direction:column;overflow:hidden;">
              <NuxtLink :to="`/comics/${r.externalId}`" style="text-decoration:none;display:flex;gap:10px;padding:10px;">
                <img
                  :src="getComicCover(r)"
                  :alt="r.title"
                  style="width:44px;aspect-ratio:2/3;object-fit:cover;flex-shrink:0;"
                  loading="lazy"
                />
                <div style="display:flex;flex-direction:column;gap:4px;min-width:0;">
                  <div style="font-family:impact,sans-serif;font-size:11px;letter-spacing:0.5px;text-transform:uppercase;color:#fff;line-height:1.15;">{{ r.title }}</div>
                  <p v-if="r.justification" style="font-family:'Courier New',monospace;font-size:9px;line-height:1.5;color:#888;">{{ r.justification }}</p>
                </div>
              </NuxtLink>
            </div>
          </div>
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

function authHeaders() {
  return token.value ? { Authorization: `Bearer ${token.value}` } : {}
}

// ─── Assistant IA ───────────────────────────────────────────────────────────
const examples = [
  "un comic sombre, SF, peu violent, à lire en une soirée",
  "quelque chose de léger et drôle pour décompresser",
  "une histoire de super-héros classique, pas trop longue",
]
const aiQuery = ref('')
const aiLoading = ref(false)
const aiError = ref('')
const aiResults = ref([])
const aiIntro = ref('')
const aiMessage = ref('')

async function askAssistant(customQuery) {
  const q = (customQuery ?? aiQuery.value).trim()
  if (!q) return
  aiQuery.value = q
  aiLoading.value = true
  aiError.value = ''
  aiResults.value = []
  aiIntro.value = ''
  aiMessage.value = ''
  justSaved.value = false
  try {
    const data = await $fetch(`${base}/assistant/recommend`, {
      method: 'POST',
      body: { query: q },
      headers: authHeaders(),
    })
    aiResults.value = data.results || []
    aiIntro.value = data.intro || ''
    aiMessage.value = data.message || ''
  } catch (e) {
    aiError.value = e.data?.error || 'Erreur lors de la recherche'
  } finally {
    aiLoading.value = false
  }
}

// ─── Recherches enregistrées ─────────────────────────────────────────────────
const savedQueries = ref([])
const savingQuery = ref(false)
const justSaved = ref(false)
const deletingId = ref(null)

async function loadSavedQueries() {
  try {
    savedQueries.value = await $fetch(`${base}/assistant/saved`, { headers: authHeaders() })
  } catch {}
}

async function saveCurrentQuery() {
  savingQuery.value = true
  try {
    const saved = await $fetch(`${base}/assistant/saved`, {
      method: 'POST',
      body: {
        query: aiQuery.value,
        intro: aiIntro.value,
        results: aiResults.value.map(r => ({ comicId: r.comic.id, justification: r.justification })),
      },
      headers: authHeaders(),
    })
    savedQueries.value = [saved, ...savedQueries.value]
    justSaved.value = true
  } catch (e) {
    aiError.value = e.data?.error || "Erreur lors de l'enregistrement"
  } finally {
    savingQuery.value = false
  }
}

async function deleteSavedQuery(id) {
  deletingId.value = id
  try {
    await $fetch(`${base}/assistant/saved/${id}`, { method: 'DELETE', headers: authHeaders() })
    savedQueries.value = savedQueries.value.filter(s => s.id !== id)
  } catch {} finally {
    deletingId.value = null
  }
}

onMounted(() => {
  loadSavedQueries()
})
</script>
