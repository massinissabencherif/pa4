<template>
  <div v-if="status !== 'hidden'" style="border:1px solid #2a2a2a;border-top:2px solid #e02020;">
    <div v-if="currentAd" style="padding:6px 16px;border-bottom:1px solid #1e1e1e;">
      <span style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;color:#fff;text-transform:uppercase;">Publicité</span>
    </div>

    <component
      :is="currentLink ? 'a' : 'div'"
      :href="currentLink || undefined"
      :target="currentLink ? '_blank' : undefined"
      :rel="currentLink ? 'sponsored noopener noreferrer' : undefined"
      ref="stage"
      class="ad-stage"
      :class="{ 'ad-stage--turning': turning }"
      @mouseenter="paused = true"
      @mouseleave="paused = false"
      @focusin="paused = true"
      @focusout="paused = false"
    >
      <!-- Page suivante, posée dessous : elle se découvre à mesure que la page
           du dessus pivote. Sans elle, la rotation révélerait le vide. -->
      <img
        v-if="nextAd && nextAd !== currentAd"
        :src="imageOf(nextAd)"
        :alt="''"
        aria-hidden="true"
        class="ad-img ad-under"
      />

      <!-- La page qui se tourne : recto = visuel courant, verso = dos de papier -->
      <div class="ad-page" :class="{ 'ad-page--turning': turning }" @animationend="onAnimationEnd">
        <div class="ad-face ad-face--front">
          <img :src="imageOf(currentAd)" :alt="altOf(currentAd)" class="ad-img" />
          <span class="ad-shade" aria-hidden="true"></span>
        </div>
        <div class="ad-face ad-face--back" aria-hidden="true"></div>
      </div>
    </component>
  </div>
</template>

<script setup>
const props = defineProps({
  placement: { type: String, required: true },
})

const config = useRuntimeConfig()
const base = config.public.apiBase

const DEFAULT_BANNER = '/ads/default-banner.png'
const ROTATE_MS = 7500   // durée d'affichage d'un visuel
const TURN_MS = 700      // durée de la rotation — doit rester alignée sur le CSS

// "generic" tant que la réponse n'est pas arrivée — évite un flash "hidden"
const status = ref('generic')
const ads = ref([])
const index = ref(0)
const turning = ref(false)
const paused = ref(false)
const visible = ref(true)
const stage = ref(null)

let timer = null
let safety = null
let observer = null

const currentAd = computed(() => ads.value[index.value] ?? null)
const nextIndex = computed(() => (ads.value.length ? (index.value + 1) % ads.value.length : 0))
const nextAd = computed(() => ads.value[nextIndex.value] ?? null)

// Pendant la rotation, le clic est neutralisé (voir .ad-stage--turning) : on ne
// veut pas qu'un visuel à demi tourné envoie vers le lien de l'autre. Le href
// n'est donc jamais désynchronisé de ce qui est réellement cliquable.
const currentLink = computed(() => currentAd.value?.linkUrl || null)

function imageOf(ad) {
  return ad?.imageUrl || DEFAULT_BANNER
}
function altOf(ad) {
  return ad?.altText || 'Comicster'
}

function prefersReducedMotion() {
  return import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function startTurn() {
  if (ads.value.length < 2 || turning.value || paused.value || !visible.value) return

  // Mouvement réduit : on remplace le visuel sans le faire pivoter.
  if (prefersReducedMotion()) {
    index.value = nextIndex.value
    return
  }

  turning.value = true
  // Filet : si l'onglet passe en arrière-plan, animationend peut ne jamais
  // arriver et la page resterait figée sur la tranche.
  safety = setTimeout(commitTurn, TURN_MS + 300)
}

function commitTurn() {
  if (!turning.value) return
  clearTimeout(safety)
  safety = null
  index.value = nextIndex.value
  turning.value = false // retire la classe → la page revient à plat sans animation
}

// animationend remonte aussi depuis l'ombre, qui a la même durée : sans filtrer
// sur le nom, la rotation serait validée deux fois.
function onAnimationEnd(event) {
  if (event.animationName?.includes('ad-turn')) commitTurn()
}

onMounted(async () => {
  try {
    const res = await $fetch(`${base}/ads`, { query: { placement: props.placement } })
    status.value = res?.status || 'generic'
    // `ads` est le nouveau format ; on retombe sur `ad` si l'API est plus ancienne.
    ads.value = res?.ads?.length ? res.ads : res?.ad ? [res.ad] : []
  } catch {
    status.value = 'generic'
    ads.value = []
  }

  if (ads.value.length < 2) return // un seul visuel : ni minuteur, ni animation

  timer = setInterval(startTurn, ROTATE_MS)

  // Un encart hors de l'écran n'a aucune raison de continuer à tourner.
  // `stage` est peuplé au rendu suivant, une fois `ads` arrivé.
  await nextTick()
  if (typeof IntersectionObserver !== 'undefined' && stage.value instanceof Element) {
    observer = new IntersectionObserver(
      ([entry]) => { visible.value = entry.isIntersecting },
      { threshold: 0.25 }
    )
    observer.observe(stage.value)
  }
})

onBeforeUnmount(() => {
  clearInterval(timer)
  clearTimeout(safety)
  observer?.disconnect()
})
</script>

<style scoped>
.ad-stage {
  display: block;
  position: relative;
  height: 160px;
  overflow: hidden;
  background: #0a0a0a;
  perspective: 1400px;
}

/* Le temps de la rotation, l'encart n'est pas cliquable : impossible de viser un
   visuel et d'atterrir sur le lien du suivant. */
.ad-stage--turning {
  pointer-events: none;
}

.ad-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
}

.ad-under {
  position: absolute;
  inset: 0;
  /* Ombre portée près de la reliure : donne de la profondeur au dessous. */
  box-shadow: inset 14px 0 22px -12px rgba(0, 0, 0, 0.85);
}

/* Pas de backface-visibility ici : conjuguée à preserve-3d sur le même élément,
   elle aplatit la scène 3D dans plusieurs navigateurs. Ce sont les deux faces
   qui la portent. */
.ad-page {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform-origin: left center;
}

.ad-page--turning {
  animation: ad-turn 700ms cubic-bezier(0.4, 0.02, 0.3, 1) forwards;
}

/* La page pivote autour de son bord gauche jusqu'à se présenter sur la tranche :
   à 90° elle n'occupe plus aucune largeur et découvre entièrement le visuel du
   dessous. S'arrêter à 90° évite tout débordement hors du cadre. */
@keyframes ad-turn {
  from { transform: rotateY(0deg); }
  to   { transform: rotateY(-90deg); }
}

.ad-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  background: #0a0a0a;
}

.ad-face--back {
  transform: rotateY(180deg);
  /* Dos de page imprimée : on ne voit pas au travers du papier. */
  background: linear-gradient(90deg, #171717 0%, #0d0d0d 55%, #000 100%);
}

/* Ombre qui balaie le recto pendant la rotation — sans elle, la page a l'air
   découpée dans du carton plat. */
.ad-shade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.68) 0%, rgba(0, 0, 0, 0.12) 45%, rgba(0, 0, 0, 0) 100%);
}

.ad-page--turning .ad-shade {
  animation: ad-shade 700ms cubic-bezier(0.4, 0.02, 0.3, 1) forwards;
}

@keyframes ad-shade {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .ad-page--turning,
  .ad-page--turning .ad-shade {
    animation: none;
  }
}
</style>
