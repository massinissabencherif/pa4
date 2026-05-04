<template>
  <div>

    <!-- Header -->
    <div style="border-bottom:1px solid #1e1e1e;">
      <div class="max-w-[1100px] mx-auto px-6 pt-9 pb-0">
        <div style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:5px;color:#e02020;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:10px;">
          <div style="width:16px;height:2px;background:#e02020;flex-shrink:0;"></div>
          Sélection personnalisée
        </div>
        <div style="font-family:impact,sans-serif;font-size:52px;letter-spacing:1px;color:#fff;text-transform:uppercase;line-height:1;padding-bottom:18px;">POUR TOI</div>
      </div>
    </div>

    <!-- Basis strip -->
    <div style="border-bottom:1px solid #1e1e1e;">
      <div class="max-w-[1100px] mx-auto px-6" style="display:flex;align-items:center;height:44px;gap:20px;">
        <span style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:4px;color:#555;text-transform:uppercase;">BASE</span>
        <span v-if="basis === 'taste'" style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;color:#e02020;text-transform:uppercase;">
          Tes goûts · {{ topGenres?.slice(0,3).join(', ') }}
        </span>
        <span v-else-if="basis === 'popular'" style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;color:#888;text-transform:uppercase;">
          Populaire — commence à lire pour des recos personnalisées
        </span>
        <span v-else style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;color:#555;text-transform:uppercase;">
          Chargement…
        </span>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="max-w-[1100px] mx-auto px-6 mt-6">
      <div style="display:flex;align-items:center;gap:8px;background:rgba(224,32,32,0.08);border:1px solid rgba(224,32,32,0.2);padding:12px 16px;font-family:'Courier New',monospace;font-size:12px;color:#e02020;">
        ⚠ {{ error }}
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="max-w-[1100px] mx-auto px-6 py-16" style="text-align:center;">
      <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:4px;color:#555;text-transform:uppercase;">Analyse de tes goûts…</div>
    </div>

    <!-- Grid -->
    <template v-else-if="recommendations.length">
      <div class="max-w-[1100px] mx-auto px-6 py-5">
        <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:#888;text-transform:uppercase;">
          <span style="font-family:impact,sans-serif;font-size:14px;letter-spacing:1px;color:#e02020;">{{ recommendations.length }}</span>
          &nbsp;suggestion{{ recommendations.length > 1 ? 's' : '' }}
        </div>
      </div>

      <div class="max-w-[1100px] mx-auto px-6 pb-12" style="display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:#1a1a1a;">
        <div
          v-for="item in recommendations"
          :key="item.id"
          class="group"
          style="background:#0f0f0f;display:flex;flex-direction:column;overflow:hidden;"
        >
          <!-- Cover -->
          <NuxtLink :to="`/comics/${item.externalId}`" style="text-decoration:none;">
            <div style="aspect-ratio:2/3;position:relative;overflow:hidden;background:#1a1a1a;">
              <img
                :src="getComicCover(item)"
                :alt="item.title"
                class="w-full h-full object-cover block group-hover:scale-[1.03]"
                style="transition:transform 0.2s;"
                loading="lazy"
              />
              <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.85) 0%,transparent 50%);display:flex;align-items:flex-end;padding:10px;opacity:0;transition:opacity 0.2s;" class="group-hover:opacity-100">
                <span style="font-family:impact,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#e02020;">VOIR →</span>
              </div>
            </div>
          </NuxtLink>

          <!-- Info strip -->
          <div style="padding:10px 12px 8px;border-top:1px solid #1a1a1a;flex:1;display:flex;flex-direction:column;gap:6px;">
            <NuxtLink :to="`/comics/${item.externalId}`" style="text-decoration:none;">
              <div style="font-family:impact,sans-serif;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;color:#fff;line-height:1.15;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">{{ item.title }}</div>
            </NuxtLink>
            <div v-if="item.authors?.length" style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1px;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ item.authors.join(', ') }}</div>

            <!-- Raison -->
            <div v-if="item.matchedGenres?.length || item.matchedAuthors?.length" style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:1px;color:#555;text-transform:uppercase;margin-top:2px;">
              <span v-if="item.matchedGenres?.length">{{ item.matchedGenres[0] }}</span>
              <span v-if="item.matchedGenres?.length && item.matchedAuthors?.length"> · </span>
              <span v-if="item.matchedAuthors?.length">{{ item.matchedAuthors[0] }}</span>
            </div>

            <!-- Ajouter au journal -->
            <button
              v-if="isLoggedIn && !addedIds.has(item.id)"
              @click="addToJournal(item)"
              :disabled="addingId === item.id"
              style="margin-top:auto;width:100%;background:transparent;border:1px solid #2a2a2a;color:#888;font-family:'Courier New',monospace;font-size:8px;letter-spacing:2px;text-transform:uppercase;padding:5px 0;cursor:pointer;transition:border-color 0.15s,color 0.15s;"
              :style="addingId === item.id ? 'opacity:0.4;' : ''"
              @mouseover="e => { e.target.style.borderColor='#e02020'; e.target.style.color='#e02020' }"
              @mouseleave="e => { e.target.style.borderColor='#2a2a2a'; e.target.style.color='#888' }"
            >{{ addingId === item.id ? '…' : '+ JOURNAL' }}</button>
            <div v-else-if="isLoggedIn && addedIds.has(item.id)" style="margin-top:auto;font-family:'Courier New',monospace;font-size:8px;letter-spacing:2px;color:#22c55e;text-transform:uppercase;text-align:center;padding:5px 0;">✓ AJOUTÉ</div>
          </div>
        </div>
      </div>
    </template>

    <!-- Empty -->
    <div v-else-if="!loading" style="text-align:center;padding:96px 24px;">
      <div style="font-family:impact,sans-serif;font-size:48px;letter-spacing:2px;text-transform:uppercase;color:#1e1e1e;margin-bottom:14px;">AUCUNE RECO</div>
      <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:3px;color:#888;text-transform:uppercase;margin-bottom:24px;">Ajoute des comics à ton journal pour des suggestions personnalisées.</div>
      <NuxtLink to="/comics/search" class="btn-primary" style="font-size:11px;padding:10px 24px;">EXPLORER ▶</NuxtLink>
    </div>

  </div>
</template>

<script setup>
import { getComicCover } from '~/utils/comicCover.js'

definePageMeta({ middleware: 'auth' })

const config = useRuntimeConfig()
const base = config.public.apiBase
const { token, isLoggedIn } = useAuth()

const recommendations = ref([])
const basis = ref('')
const topGenres = ref([])
const loading = ref(true)
const error = ref('')
const addingId = ref(null)
const addedIds = ref(new Set())

function authHeaders() {
  return token.value ? { Authorization: `Bearer ${token.value}` } : {}
}

onMounted(async () => {
  try {
    const data = await $fetch(`${base}/recommendations`, {
      headers: authHeaders(),
    })
    recommendations.value = data.recommendations || []
    basis.value = data.basis || ''
    topGenres.value = data.topGenres || []
  } catch (e) {
    error.value = e.data?.error || 'Erreur lors du chargement'
  } finally {
    loading.value = false
  }
})

async function addToJournal(comic) {
  addingId.value = comic.id
  try {
    await $fetch(`${base}/reading-list`, {
      method: 'POST',
      body: { comicId: comic.id },
      headers: authHeaders(),
    })
    addedIds.value = new Set([...addedIds.value, comic.id])
  } catch (e) {
    if (e.status === 409) addedIds.value = new Set([...addedIds.value, comic.id])
  } finally {
    addingId.value = null
  }
}
</script>
