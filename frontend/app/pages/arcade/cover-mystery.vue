<template>
  <div>

    <!-- Header -->
    <div style="border-bottom:1px solid #2a2a2a;">
      <div class="max-w-[760px] mx-auto px-6 pt-9 pb-0">
        <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:5px;color:#e02020;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:10px;">
          <div style="width:16px;height:2px;background:#e02020;flex-shrink:0;"></div>
          Arcade · Devine la couverture
        </div>
        <div style="font-family:impact,sans-serif;font-size:52px;letter-spacing:1px;color:#fff;text-transform:uppercase;line-height:1;padding-bottom:18px;">COVER MYSTÈRE</div>
      </div>
    </div>

    <div class="max-w-[760px] mx-auto px-6 py-8">

      <!-- Choix du mode -->
      <div v-if="!round && !summary" class="grid grid-cols-1 sm:grid-cols-2 gap-px" style="background:#2a2a2a;">
        <button @click="start('daily')" :disabled="starting" class="group text-left" style="background:#111;padding:26px 24px;border:none;cursor:pointer;">
          <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;color:#e02020;text-transform:uppercase;margin-bottom:10px;">5 covers · XP</div>
          <div style="font-family:impact,sans-serif;font-size:24px;letter-spacing:1px;color:#fff;text-transform:uppercase;" class="group-hover:text-[#e02020] transition-colors">Défi du jour</div>
          <p style="font-family:'Courier New',monospace;font-size:11px;color:#999;margin-top:8px;">Le même tirage pour tout le monde. Une seule tentative par jour.</p>
        </button>
        <button @click="start('infinite')" :disabled="starting" class="group text-left" style="background:#111;padding:26px 24px;border:none;cursor:pointer;">
          <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;color:#888;text-transform:uppercase;margin-bottom:10px;">5 covers · Entraînement</div>
          <div style="font-family:impact,sans-serif;font-size:24px;letter-spacing:1px;color:#fff;text-transform:uppercase;" class="group-hover:text-[#e02020] transition-colors">Mode infini</div>
          <p style="font-family:'Courier New',monospace;font-size:11px;color:#999;margin-top:8px;">Tirage aléatoire, rejouable à volonté. Sans XP.</p>
        </button>
      </div>
      <p v-if="startError" style="font-family:'Courier New',monospace;font-size:12px;color:#e02020;margin-top:12px;">{{ startError }}</p>

      <!-- Round en cours -->
      <template v-if="round && !summary">
        <div class="flex items-center justify-between" style="margin-bottom:16px;">
          <span style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;color:#888;text-transform:uppercase;">
            Cover {{ round.roundIndex + 1 }}/{{ round.totalRounds }} · {{ round.mode === 'daily' ? 'Défi du jour' : 'Infini' }}
          </span>
          <span style="font-family:impact,sans-serif;font-size:18px;letter-spacing:1px;color:#fff;">{{ round.score }} pts</span>
        </div>

        <!-- Canvas pixelisé -->
        <div style="display:flex;justify-content:center;background:#111;border:1px solid #2a2a2a;padding:20px;">
          <canvas ref="canvasEl" width="320" height="440" style="max-width:100%;image-rendering:pixelated;background:#1e1e1e;"></canvas>
        </div>
        <div style="height:3px;background:#2a2a2a;margin-top:1px;">
          <div :style="`height:100%;background:#e02020;width:${timerPct}%;transition:width 0.2s linear;`"></div>
        </div>
        <p style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;color:#666;text-transform:uppercase;margin-top:8px;text-align:center;">
          L'image se révèle — réponds vite pour marquer plus : 100 / 70 / 40 / 20 pts
        </p>

        <!-- Choix -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-px" style="background:#2a2a2a;margin-top:16px;">
          <button
            v-for="c in round.choices"
            :key="c.id"
            @click="guess(c.id)"
            :disabled="guessing || !!roundResult"
            class="text-left hover:bg-white/5 transition"
            :style="choiceStyle(c.id)"
          >{{ c.title }}</button>
        </div>

        <!-- Résultat du round -->
        <div v-if="roundResult" style="background:#111;border:1px solid #2a2a2a;padding:18px 20px;margin-top:16px;" :style="`border-left:4px solid ${roundResult.correct ? '#22c55e' : '#e02020'};`">
          <div class="flex items-center justify-between flex-wrap gap-3">
            <div class="flex items-center gap-4">
              <img v-if="roundResult.answer.coverUrl" :src="roundResult.answer.coverUrl" :alt="roundResult.answer.title" style="width:44px;height:60px;object-fit:cover;" />
              <div>
                <p style="font-family:impact,sans-serif;font-size:16px;letter-spacing:1px;text-transform:uppercase;" :style="`color:${roundResult.correct ? '#22c55e' : '#e02020'};`">
                  {{ roundResult.correct ? `+${roundResult.points} pts` : 'Raté !' }}
                </p>
                <NuxtLink :to="`/comics/${roundResult.answer.externalId}`" style="font-family:'Courier New',monospace;font-size:12px;color:#fff;text-decoration:none;" class="hover:text-[#e02020] transition-colors">
                  {{ roundResult.answer.title }}
                </NuxtLink>
              </div>
            </div>
            <button @click="nextRound" class="btn-primary" style="font-size:11px;padding:8px 18px;">
              {{ pendingSummary ? 'Voir le score →' : 'Cover suivante →' }}
            </button>
          </div>
        </div>
      </template>

      <!-- Fin de partie -->
      <div v-if="summary" style="background:#111;border:1px solid #2a2a2a;border-top:3px solid #e02020;padding:28px;">
        <p style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:4px;color:#e02020;text-transform:uppercase;margin-bottom:8px;">
          {{ summary.mode === 'daily' ? 'Défi du jour terminé' : 'Partie terminée' }}
        </p>
        <p style="font-family:impact,sans-serif;font-size:40px;letter-spacing:1px;color:#fff;line-height:1;">
          {{ summary.score }} pts
          <span v-if="summary.xpAwarded" style="font-size:20px;color:#22c55e;"> +{{ summary.xpAwarded }} XP</span>
        </p>
        <div class="flex gap-1" style="margin-top:16px;">
          <span
            v-for="(r, i) in summary.rounds"
            :key="i"
            :style="`width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:${r.correct ? 'rgba(34,197,94,0.15)' : 'rgba(224,32,32,0.15)'};border:1px solid ${r.correct ? '#22c55e' : '#e02020'};font-family:'Courier New',monospace;font-size:11px;color:${r.correct ? '#22c55e' : '#e02020'};`"
          >{{ r.correct ? '✓' : '✗' }}</span>
        </div>
        <div class="flex gap-3 flex-wrap" style="margin-top:22px;">
          <button v-if="summary.mode === 'infinite'" @click="start('infinite')" class="btn-primary" style="font-size:11px;padding:8px 18px;">Rejouer</button>
          <button v-else @click="start('infinite')" class="btn-ghost" style="font-size:11px;padding:8px 18px;">Continuer en mode infini</button>
          <NuxtLink to="/arcade" class="btn-ghost" style="font-size:11px;padding:8px 18px;text-decoration:none;">Retour à l'arcade</NuxtLink>
        </div>
      </div>

      <div v-if="!summary" style="margin-top:28px;">
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

const round = ref(null)
const roundResult = ref(null)
const pendingNext = ref(null)
const pendingSummary = ref(null)
const summary = ref(null)
const starting = ref(false)
const guessing = ref(false)
const startError = ref('')
const canvasEl = ref(null)
const timerPct = ref(100)

// ─── Pixelisation canvas ──────────────────────────────────────────────────────
// L'image est dessinée en tout petit puis agrandie sans lissage → gros pixels.
// La taille des blocs diminue avec le temps (REVEAL_MS), purement cosmétique :
// le score réel est calculé côté serveur à partir du temps de réponse.
const REVEAL_MS = 25_000
let rafId = null
let img = null
let revealStart = 0
let frozen = false

function drawPixelated() {
  const canvas = canvasEl.value
  if (!canvas || !img) return
  const ctx = canvas.getContext('2d')
  const elapsed = frozen ? REVEAL_MS : Date.now() - revealStart
  const progress = Math.min(elapsed / REVEAL_MS, 1)
  // Résolution de départ : 8px de large → pleine résolution à la fin
  const minW = 8
  const maxW = canvas.width
  const w = Math.max(minW, Math.round(minW + (maxW - minW) * progress * progress))
  const h = Math.round(w * (canvas.height / canvas.width))

  const off = document.createElement('canvas')
  off.width = w
  off.height = h
  const offCtx = off.getContext('2d')
  offCtx.drawImage(img, 0, 0, w, h)

  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(off, 0, 0, canvas.width, canvas.height)

  timerPct.value = Math.max(0, 100 - progress * 100)
  if (progress < 1 && !frozen) rafId = requestAnimationFrame(drawPixelated)
}

function startReveal(coverUrl) {
  cancelAnimationFrame(rafId)
  frozen = false
  img = new Image()
  img.onload = () => {
    revealStart = Date.now()
    drawPixelated()
  }
  img.src = coverUrl
}

onBeforeUnmount(() => cancelAnimationFrame(rafId))

// ─── Flux de jeu ──────────────────────────────────────────────────────────────

async function start(mode) {
  starting.value = true
  startError.value = ''
  summary.value = null
  roundResult.value = null
  try {
    const data = await $fetch(`${base}/arcade/cover-mystery/start`, {
      method: 'POST',
      headers: authHeaders.value,
      body: { mode },
    })
    if (data.finished) {
      summary.value = data
    } else {
      round.value = data
      await nextTick()
      startReveal(data.cover)
    }
  } catch (e) {
    startError.value = e.data?.error || 'Impossible de démarrer la partie'
  } finally {
    starting.value = false
  }
}

async function guess(comicId) {
  guessing.value = true
  try {
    const data = await $fetch(`${base}/arcade/cover-mystery/guess`, {
      method: 'POST',
      headers: authHeaders.value,
      body: { runId: round.value.runId, comicId },
    })
    roundResult.value = { ...data.roundResult, guessedId: comicId }
    frozen = true
    drawPixelated() // révèle l'image en entier
    if (data.finished) {
      pendingSummary.value = data
      pendingNext.value = null
    } else {
      pendingNext.value = data.next
      pendingSummary.value = null
    }
    if (round.value) round.value.score = (data.next?.score ?? data.score)
  } catch (e) {
    startError.value = e.data?.error || 'Erreur'
  } finally {
    guessing.value = false
  }
}

async function nextRound() {
  roundResult.value = null
  if (pendingSummary.value) {
    summary.value = pendingSummary.value
    round.value = null
    pendingSummary.value = null
    return
  }
  round.value = pendingNext.value
  pendingNext.value = null
  await nextTick()
  startReveal(round.value.cover)
}

function choiceStyle(id) {
  let border = '#2a2a2a'
  let color = '#fff'
  if (roundResult.value) {
    if (id === roundResult.value.answer.id) { border = '#22c55e'; color = '#22c55e' }
    else if (id === roundResult.value.guessedId) { border = '#e02020'; color = '#e02020' }
  }
  return `background:#111;padding:16px 18px;font-family:'Courier New',monospace;font-size:13px;letter-spacing:1px;color:${color};border:1px solid ${border};cursor:pointer;`
}
</script>
