<template>
  <div>

    <!-- Loading -->
    <div v-if="pending" style="display:flex;align-items:center;gap:10px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;color:#888;text-transform:uppercase;padding:80px 24px;">
      <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      Chargement…
    </div>

    <div v-else-if="!guide" style="text-align:center;padding:96px 24px;">
      <div style="font-family:impact,sans-serif;font-size:48px;text-transform:uppercase;color:#1e1e1e;">INTROUVABLE</div>
    </div>

    <template v-else>

      <!-- ─── HERO ───────────────────────────────────────────────────────── -->
      <div style="position:relative;min-height:320px;overflow:hidden;background:#0a0a0a;border-bottom:2px solid #e02020;">
        <img
          v-if="guide.imageUrl"
          :src="guide.imageUrl"
          :alt="guide.character"
          style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.18;filter:blur(2px);"
        />
        <div style="position:absolute;inset:0;background:linear-gradient(to right,rgba(0,0,0,0.95) 40%,transparent 100%);"></div>
        <div class="max-w-[1100px] mx-auto px-6 py-12" style="position:relative;">
          <NuxtLink to="/recommendations" style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;color:#555;text-transform:uppercase;text-decoration:none;display:inline-flex;align-items:center;gap:8px;margin-bottom:20px;transition:color 0.15s;" class="hover:text-[#888]">
            <span>←</span> Tous les parcours
          </NuxtLink>
          <div style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:5px;color:#e02020;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:10px;">
            <div style="width:16px;height:2px;background:#e02020;flex-shrink:0;"></div>
            Guide de lecture
          </div>
          <h1 style="font-family:impact,sans-serif;font-size:64px;letter-spacing:2px;color:#fff;text-transform:uppercase;line-height:1;margin-bottom:20px;">{{ guide.character }}</h1>
          <p style="font-family:'Courier New',monospace;font-size:12px;line-height:1.8;color:#aaa;max-width:600px;">{{ guide.story }}</p>
        </div>
      </div>

      <div class="max-w-[1100px] mx-auto px-6">

        <!-- ─── LISTE DE LECTURE ──────────────────────────────────────────── -->
        <div style="padding:48px 0;border-bottom:1px solid #2a2a2a;">
          <div style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:5px;color:#e02020;text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:10px;">
            <div style="width:16px;height:2px;background:#e02020;flex-shrink:0;"></div>
            Liste de lecture
          </div>
          <div style="font-family:impact,sans-serif;font-size:28px;letter-spacing:1px;color:#fff;text-transform:uppercase;margin-bottom:28px;">
            {{ guide.comics.length }} comics essentiels
          </div>

          <div class="space-y-px" style="background:#2a2a2a;">
            <div
              v-for="(comic, index) in guide.comics"
              :key="comic.id"
              style="background:#111;display:flex;gap:16px;padding:20px;transition:background 0.15s;"
              class="hover:bg-[#141414]"
            >
              <div style="flex-shrink:0;width:32px;text-align:center;padding-top:4px;">
                <span style="font-family:impact,sans-serif;font-size:20px;letter-spacing:1px;color:#2a2a2a;">{{ String(index + 1).padStart(2, '0') }}</span>
              </div>
              <div v-if="comic.coverUrl" style="flex-shrink:0;width:52px;aspect-ratio:2/3;overflow:hidden;background:#1a1a1a;">
                <img :src="comic.coverUrl" :alt="comic.title" class="w-full h-full object-cover" loading="lazy" />
              </div>
              <div v-else style="flex-shrink:0;width:52px;aspect-ratio:2/3;background:#1a1a1a;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:20px;color:#2a2a2a;">📚</span>
              </div>
              <div style="flex:1;min-width:0;">
                <NuxtLink
                  v-if="comic.comicUrl"
                  :to="comic.comicUrl"
                  style="font-family:impact,sans-serif;font-size:16px;letter-spacing:0.5px;text-transform:uppercase;color:#fff;margin-bottom:8px;line-height:1.2;display:block;text-decoration:none;transition:color 0.15s;"
                  class="hover:text-[#e02020]"
                >{{ comic.title }} <span style="font-size:11px;opacity:0.5;">↗</span></NuxtLink>
                <div v-else style="font-family:impact,sans-serif;font-size:16px;letter-spacing:0.5px;text-transform:uppercase;color:#fff;margin-bottom:8px;line-height:1.2;">{{ comic.title }}</div>
                <p style="font-family:'Courier New',monospace;font-size:11px;line-height:1.7;color:#888;">{{ comic.note }}</p>
              </div>
            </div>
          </div>
        </div>

        <div style="padding:32px 0 0;">
          <AdSlot placement="GUIDE_DETAIL" />
        </div>

        <!-- ─── DISCUSSION ────────────────────────────────────────────────── -->
        <div style="padding:48px 0;border-bottom:1px solid #2a2a2a;">
          <div style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:5px;color:#e02020;text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:10px;">
            <div style="width:16px;height:2px;background:#e02020;flex-shrink:0;"></div>
            Communauté
          </div>

          <!-- Header discussion -->
          <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
            <div style="font-family:impact,sans-serif;font-size:28px;letter-spacing:1px;color:#fff;text-transform:uppercase;">
              Discussion
              <span style="font-family:'Courier New',monospace;font-size:12px;font-weight:normal;letter-spacing:1px;color:#555;margin-left:10px;text-transform:none;">{{ guide.topics.length }} sujet{{ guide.topics.length !== 1 ? 's' : '' }}</span>
            </div>
            <button
              v-if="isLoggedIn"
              @click="showNewTopic = !showNewTopic"
              style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;background:transparent;border:1px solid #e02020;color:#e02020;padding:8px 18px;cursor:pointer;transition:background 0.15s,color 0.15s;"
              class="hover:bg-[#e02020] hover:text-white"
            >+ Nouveau sujet</button>
            <NuxtLink v-else to="/auth/login" style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;border:1px solid #333;color:#666;padding:8px 18px;text-decoration:none;transition:border-color 0.15s;" class="hover:border-[#e02020] hover:text-[#e02020]">
              Connexion pour participer
            </NuxtLink>
          </div>

          <!-- Formulaire nouveau sujet -->
          <div v-if="showNewTopic" style="background:#1c1c1c;border:1px solid #333;border-left:2px solid #e02020;padding:20px;margin-bottom:16px;">
            <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#e02020;margin-bottom:14px;">Nouveau sujet</div>
            <input
              v-model="newTopic.title"
              type="text"
              placeholder="Titre du sujet"
              class="input mb-3"
              style="font-size:13px;background:#252525;border-color:#3a3a3a;color:#e8e8e8;"
            />
            <textarea
              v-model="newTopic.content"
              rows="4"
              placeholder="Développe ta question ou ton point de vue…"
              class="input resize-none mb-3"
              style="font-size:12px;background:#252525;border-color:#3a3a3a;color:#e8e8e8;"
            />

            <!-- GIF pour le post -->
            <div v-if="newTopicGifUrl" style="margin-bottom:12px;position:relative;display:inline-block;">
              <img :src="newTopicGifUrl" style="max-height:140px;max-width:260px;object-fit:contain;border:1px solid #2a2a2a;" />
              <button @click="newTopicGifUrl = null" style="position:absolute;top:-6px;right:-6px;width:18px;height:18px;background:#e02020;border:none;color:#fff;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">×</button>
            </div>

            <div v-if="topicError" style="font-family:'Courier New',monospace;font-size:11px;color:#e02020;margin-bottom:10px;">{{ topicError }}</div>
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <button @click="submitTopic" :disabled="topicSaving" class="btn-primary" style="font-size:11px;padding:8px 20px;">
                {{ topicSaving ? 'Publication…' : 'Publier' }}
              </button>
              <GifPicker @select="newTopicGifUrl = $event" />
              <button @click="cancelNewTopic" style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;background:none;border:none;color:#666;cursor:pointer;transition:color 0.15s;" class="hover:text-[#aaa]">
                Annuler
              </button>
            </div>
          </div>

          <!-- Zone forum (fond plus clair) -->
          <div style="background:#181818;border:1px solid #2e2e2e;border-radius:0;">

            <!-- Barre de recherche -->
            <div style="padding:14px 16px;border-bottom:1px solid #2e2e2e;display:flex;align-items:center;gap:10px;">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style="color:#666;flex-shrink:0;">
                <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/>
                <path d="M13.5 13.5L17 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <input
                v-model="topicSearch"
                type="text"
                placeholder="Rechercher dans les discussions…"
                style="flex:1;background:transparent;border:none;outline:none;font-family:'Courier New',monospace;font-size:12px;color:#d0d0d0;letter-spacing:0.5px;"
                :style="{ '::placeholder': 'color:#555' }"
              />
              <span v-if="topicSearch" style="font-family:'Courier New',monospace;font-size:10px;color:#555;">
                {{ filteredTopics.length }} résultat{{ filteredTopics.length !== 1 ? 's' : '' }}
              </span>
            </div>

            <!-- Liste des topics (liens vers pages dédiées) -->
            <div v-if="filteredTopics.length">
              <NuxtLink
                v-for="topic in filteredTopics"
                :key="topic.id"
                :to="`/guides/${guide.slug}/topics/${topic.id}`"
                style="display:flex;align-items:flex-start;gap:14px;padding:16px;border-bottom:1px solid #252525;text-decoration:none;transition:background 0.15s;cursor:pointer;"
                class="topic-row"
              >
                <!-- Avatar lettre -->
                <div style="flex-shrink:0;width:32px;height:32px;background:#252525;border:1px solid #333;display:flex;align-items:center;justify-content:center;margin-top:2px;">
                  <span style="font-family:impact,sans-serif;font-size:14px;color:#888;">{{ topic.author.username[0].toUpperCase() }}</span>
                </div>

                <!-- Contenu -->
                <div style="flex:1;min-width:0;">
                  <div style="font-family:impact,sans-serif;font-size:15px;letter-spacing:0.5px;text-transform:uppercase;color:#e8e8e8;margin-bottom:5px;line-height:1.2;" class="topic-title">
                    {{ topic.title }}
                  </div>
                  <p style="font-family:'Courier New',monospace;font-size:11px;line-height:1.6;color:#888;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:8px;">
                    {{ topic.content }}
                  </p>
                  <div style="display:flex;align-items:center;gap:12px;font-family:'Courier New',monospace;font-size:9px;letter-spacing:1px;color:#555;">
                    <span style="color:#777;">{{ topic.author.username }}</span>
                    <span>·</span>
                    <span>{{ fmtDate(topic.createdAt) }}</span>
                    <span>·</span>
                    <span style="display:flex;align-items:center;gap:4px;">
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6l-3 3V4z"/></svg>
                      {{ topic._count.replies }} réponse{{ topic._count.replies !== 1 ? 's' : '' }}
                    </span>
                  </div>
                </div>

                <!-- Flèche -->
                <div style="flex-shrink:0;color:#333;font-size:16px;margin-top:8px;transition:color 0.15s;" class="topic-arrow">→</div>
              </NuxtLink>
            </div>

            <!-- Aucun résultat de recherche -->
            <div v-else-if="topicSearch" style="padding:32px 16px;text-align:center;font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;color:#444;text-transform:uppercase;">
              Aucun sujet correspondant à « {{ topicSearch }} »
            </div>

            <!-- Aucune discussion du tout -->
            <div v-else style="padding:40px 16px;text-align:center;">
              <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;color:#444;text-transform:uppercase;margin-bottom:8px;">Aucune discussion pour l'instant.</div>
              <div v-if="isLoggedIn" style="font-family:'Courier New',monospace;font-size:10px;color:#555;">Sois le premier à lancer le débat ↑</div>
            </div>
          </div>
        </div>

        <!-- ─── DÉCOUVRE AUSSI ────────────────────────────────────────────── -->
        <div v-if="guide.related?.length" style="padding:48px 0;">
          <div style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:5px;color:#e02020;text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:10px;">
            <div style="width:16px;height:2px;background:#e02020;flex-shrink:0;"></div>
            Pour continuer
          </div>
          <div style="font-family:impact,sans-serif;font-size:28px;letter-spacing:1px;color:#fff;text-transform:uppercase;margin-bottom:24px;">Découvre aussi</div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px" style="background:#2a2a2a;">
            <NuxtLink
              v-for="rel in guide.related"
              :key="rel.slug"
              :to="`/guides/${rel.slug}`"
              style="background:#111;display:flex;gap:14px;padding:16px;text-decoration:none;transition:background 0.15s;"
              class="group hover:bg-[#141414]"
            >
              <div style="flex-shrink:0;width:48px;height:48px;overflow:hidden;background:#1a1a1a;">
                <img v-if="rel.imageUrl" :src="rel.imageUrl" :alt="rel.character" class="w-full h-full object-cover" loading="lazy" />
                <div v-else style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
                  <span style="font-family:impact,sans-serif;font-size:20px;color:#2a2a2a;">{{ rel.character[0] }}</span>
                </div>
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-family:impact,sans-serif;font-size:14px;letter-spacing:0.5px;text-transform:uppercase;color:#fff;margin-bottom:4px;line-height:1.2;" class="group-hover:text-[#e02020] transition-colors">{{ rel.character }}</div>
                <p style="font-family:'Courier New',monospace;font-size:10px;line-height:1.5;color:#666;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">{{ rel.teaser }}</p>
              </div>
            </NuxtLink>
          </div>
        </div>

      </div>
    </template>
  </div>
</template>

<script setup>
const route = useRoute()
const config = useRuntimeConfig()
const base = config.public.apiBase
const { token, isLoggedIn } = useAuth()

function authHeaders() {
  return token.value ? { Authorization: `Bearer ${token.value}` } : {}
}

const { data: guide, pending, refresh } = await useFetch(`${base}/guides/${route.params.slug}`)

// Recherche dans les topics
const topicSearch = ref('')
const filteredTopics = computed(() => {
  const list = guide.value?.topics || []
  if (!topicSearch.value.trim()) return list
  const q = topicSearch.value.toLowerCase()
  return list.filter(t =>
    t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q)
  )
})

// Nouveau topic
const showNewTopic = ref(false)
const newTopic = ref({ title: '', content: '' })
const topicSaving = ref(false)
const topicError = ref('')

const newTopicGifUrl = ref(null)

function cancelNewTopic() {
  showNewTopic.value = false
  newTopic.value = { title: '', content: '' }
  topicError.value = ''
  newTopicGifUrl.value = null
}

async function submitTopic() {
  topicSaving.value = true
  topicError.value = ''
  try {
    await $fetch(`${base}/guides/${route.params.slug}/topics`, {
      method: 'POST',
      body: {
        title: newTopic.value.title,
        content: newTopic.value.content,
        imageUrl: newTopicGifUrl.value || null,
      },
      headers: authHeaders(),
    })
    newTopic.value = { title: '', content: '' }
    showNewTopic.value = false
    newTopicGifUrl.value = null
    await refresh()
  } catch (e) {
    topicError.value = e.data?.error || 'Erreur lors de la publication'
  } finally {
    topicSaving.value = false
  }
}

function fmtDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<style scoped>
.topic-row:hover { background: #202020 !important; }
.topic-row:hover .topic-title { color: #e02020 !important; }
.topic-row:hover .topic-arrow { color: #e02020 !important; }
</style>
