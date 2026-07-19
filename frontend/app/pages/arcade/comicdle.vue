<template>
  <div>

    <!-- Header -->
    <div style="border-bottom:1px solid #2a2a2a;">
      <div class="max-w-[760px] mx-auto px-6 pt-9 pb-0">
        <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:5px;color:#e02020;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:10px;">
          <div style="width:16px;height:2px;background:#e02020;flex-shrink:0;"></div>
          Arcade · Défi du {{ state?.date }}
        </div>
        <div style="font-family:impact,sans-serif;font-size:52px;letter-spacing:1px;color:#fff;text-transform:uppercase;line-height:1;padding-bottom:18px;">COMICDLE</div>
      </div>
    </div>

    <div class="max-w-[760px] mx-auto px-6 py-8">

      <div v-if="pending" style="text-align:center;padding:60px 0;font-family:'Courier New',monospace;font-size:12px;letter-spacing:3px;color:#fff;text-transform:uppercase;">Chargement…</div>
      <div v-else-if="loadError" style="text-align:center;padding:60px 0;font-family:'Courier New',monospace;font-size:12px;color:#e02020;">{{ loadError }}</div>

      <template v-else-if="state">

        <!-- Règles + compteur -->
        <div class="flex items-center justify-between flex-wrap gap-3" style="margin-bottom:20px;">
          <p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:1px;color:#999;">
            Devine le comic mystère du jour. Indices par attribut à chaque essai.
          </p>
          <span style="font-family:impact,sans-serif;font-size:16px;letter-spacing:2px;color:#fff;">
            {{ state.guesses.length }}/{{ state.maxGuesses }}
          </span>
        </div>

        <!-- Saisie -->
        <div v-if="!state.finished" style="position:relative;margin-bottom:24px;">
          <input
            v-model="search"
            @input="onSearchInput"
            type="text"
            placeholder="Propose un titre du catalogue…"
            style="width:100%;background:#111;border:1px solid #2a2a2a;color:#fff;font-family:'Courier New',monospace;font-size:14px;letter-spacing:1px;padding:14px 16px;outline:none;"
            :disabled="guessing"
          />
          <div v-if="options.length" style="position:absolute;top:100%;left:0;right:0;z-index:20;background:#111;border:1px solid #2a2a2a;border-top:none;">
            <button
              v-for="opt in options"
              :key="opt.id"
              @click="submitGuess(opt)"
              class="w-full text-left hover:bg-white/5 transition"
              style="display:block;padding:11px 16px;font-family:'Courier New',monospace;font-size:13px;color:#fff;border-bottom:1px solid #1e1e1e;background:transparent;border-left:none;border-right:none;border-top:none;cursor:pointer;"
            >{{ opt.title }}</button>
          </div>
          <p v-if="guessError" style="font-family:'Courier New',monospace;font-size:12px;color:#e02020;margin-top:8px;">{{ guessError }}</p>
        </div>

        <!-- Légende -->
        <div class="flex flex-wrap gap-4" style="margin-bottom:12px;font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;color:#666;text-transform:uppercase;">
          <span><span style="color:#22c55e;">■</span> Exact</span>
          <span><span style="color:#fbbf24;">■</span> Partiel</span>
          <span><span style="color:#444;">■</span> Aucun</span>
          <span>↑ plus récent · ↓ plus ancien</span>
        </div>

        <!-- Grille des essais -->
        <div v-if="state.guesses.length" class="space-y-px" style="background:#2a2a2a;margin-bottom:24px;">
          <div style="background:#0f0f0f;display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:1px;">
            <div v-for="h in ['Titre', 'Genres', 'Éditeur', 'Année', 'Auteurs']" :key="h"
              style="background:#111;padding:8px 10px;font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;color:#888;text-transform:uppercase;">{{ h }}</div>
          </div>
          <div
            v-for="(g, i) in state.guesses"
            :key="i"
            style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:1px;background:#2a2a2a;"
          >
            <div :style="cellStyle(g.correct ? 'exact' : 'none')" style="font-size:12px;">{{ g.title }}</div>
            <div :style="cellStyle(g.genres)">{{ relationLabel(g.genres) }}</div>
            <div :style="cellStyle(g.publisher === 'match' ? 'exact' : g.publisher)">{{ relationLabel(g.publisher === 'match' ? 'exact' : g.publisher) }}</div>
            <div :style="cellStyle(g.year === 'match' ? 'exact' : 'none')">
              {{ g.guessYear ?? '?' }}
              <span v-if="g.year === 'higher'"> ↑</span>
              <span v-else-if="g.year === 'lower'"> ↓</span>
            </div>
            <div :style="cellStyle(g.authors)">{{ relationLabel(g.authors) }}</div>
          </div>
        </div>

        <!-- Fin de partie -->
        <div v-if="state.finished" style="background:#111;border:1px solid #2a2a2a;padding:24px;" :style="`border-top:3px solid ${state.solved ? '#22c55e' : '#e02020'};`">
          <p style="font-family:impact,sans-serif;font-size:22px;letter-spacing:1px;text-transform:uppercase;" :style="`color:${state.solved ? '#22c55e' : '#e02020'};`">
            {{ state.solved ? `Trouvé en ${state.guesses.length} essai${state.guesses.length > 1 ? 's' : ''} ! +${state.score} XP` : 'Raté pour aujourd\'hui…' }}
          </p>

          <div v-if="state.target" class="flex gap-4 items-start" style="margin-top:16px;">
            <NuxtLink :to="`/comics/${state.target.externalId}`" style="flex-shrink:0;">
              <img v-if="state.target.coverUrl" :src="state.target.coverUrl" :alt="state.target.title" style="width:72px;height:100px;object-fit:cover;background:#1e1e1e;" />
            </NuxtLink>
            <div>
              <p style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;color:#888;text-transform:uppercase;margin-bottom:4px;">La réponse était</p>
              <NuxtLink :to="`/comics/${state.target.externalId}`" style="font-family:impact,sans-serif;font-size:20px;letter-spacing:1px;color:#fff;text-transform:uppercase;text-decoration:none;" class="hover:text-[#e02020] transition-colors">
                {{ state.target.title }}
              </NuxtLink>
              <div class="flex gap-3 flex-wrap" style="margin-top:12px;">
                <button v-if="!state.solved" @click="addToList" :disabled="addedToList" class="btn-primary" style="font-size:11px;padding:8px 16px;">
                  {{ addedToList ? '✓ Dans ta liste' : '+ Ajouter à ma liste' }}
                </button>
                <button @click="shareResult" class="btn-ghost" style="font-size:11px;padding:8px 16px;display:inline-flex;align-items:center;gap:6px;" aria-label="Partager mon résultat sur X">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93zm-1.29 19.5h2.04L6.49 3.24H4.3z"/>
                  </svg>
                  Partager mon résultat
                </button>
              </div>
            </div>
          </div>

          <p style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:#555;text-transform:uppercase;margin-top:18px;">
            Reviens demain pour un nouveau comic mystère.
          </p>
        </div>

      </template>

      <div style="margin-top:28px;">
        <NuxtLink to="/arcade" style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:3px;color:#888;text-transform:uppercase;text-decoration:none;" class="hover:text-white transition-colors">← Retour à l'arcade</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

const config = useRuntimeConfig()
const base = config.public.apiBase
const { token } = useAuth()

const authHeaders = computed(() => ({ Authorization: `Bearer ${token.value}` }))

const state = ref(null)
const pending = ref(true)
const loadError = ref('')
const search = ref('')
const options = ref([])
const guessing = ref(false)
const guessError = ref('')
const addedToList = ref(false)

onMounted(loadDaily)

async function loadDaily() {
  pending.value = true
  try {
    state.value = await $fetch(`${base}/arcade/comicdle/daily`, { headers: authHeaders.value })
  } catch (e) {
    loadError.value = e.data?.error || 'Impossible de charger le défi du jour'
  } finally {
    pending.value = false
  }
}

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  guessError.value = ''
  if (search.value.trim().length < 2) { options.value = []; return }
  searchTimer = setTimeout(async () => {
    try {
      options.value = await $fetch(`${base}/arcade/comicdle/options`, {
        params: { q: search.value.trim() },
        headers: authHeaders.value,
      })
    } catch { options.value = [] }
  }, 250)
}

async function submitGuess(opt) {
  guessing.value = true
  guessError.value = ''
  options.value = []
  search.value = ''
  try {
    state.value = await $fetch(`${base}/arcade/comicdle/guess`, {
      method: 'POST',
      headers: authHeaders.value,
      body: { comicId: opt.id },
    })
  } catch (e) {
    guessError.value = e.data?.error || 'Erreur'
  } finally {
    guessing.value = false
  }
}

async function addToList() {
  if (!state.value?.target) return
  try {
    await $fetch(`${base}/reading-list`, {
      method: 'POST',
      headers: authHeaders.value,
      body: { comicId: state.value.target.id },
    })
    addedToList.value = true
  } catch (e) {
    // 409 = déjà dans la liste
    if (e.status === 409) addedToList.value = true
  }
}

function relationLabel(rel) {
  switch (rel) {
    case 'exact': return '●'
    case 'partial': return '◐'
    case 'none': return '○'
    default: return '?'
  }
}

function cellStyle(rel) {
  const colors = { exact: '#22c55e', partial: '#fbbf24', none: '#444', unknown: '#444' }
  return `background:#0f0f0f;padding:12px 10px;font-family:'Courier New',monospace;font-size:13px;text-align:center;color:${colors[rel] ?? '#444'};`
}

// Partage du résultat : ouvre X avec un tweet déjà rédigé, l'utilisateur n'a
// plus qu'à cliquer sur « Poster ». Simple lien "intent" — aucune API ni clé.
function shareResult() {
  const site = config.public.siteUrl || 'https://sitedetestdemassinissabencherif.com'
  const n = state.value.guesses.length
  const text = state.value.solved
    ? `J'ai trouvé le comic du jour en ${n} essai${n > 1 ? 's' : ''}, essaye de le trouver toi aussi sur ${site}`
    : `Je n'ai pas trouvé le comic du jour… Essaye de faire mieux que moi sur ${site}`
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
    '_blank',
    'noopener,noreferrer'
  )
}
</script>
