<template>
  <div style="min-height:100vh;background:#171717;">

    <div v-if="pending" style="display:flex;align-items:center;gap:10px;font-family:'Courier New',monospace;font-size:12px;letter-spacing:2px;color:#fff;text-transform:uppercase;padding:80px 24px;">
      <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      Chargement…
    </div>

    <template v-else-if="topic">

      <!-- Nav sticky -->
      <div style="background:#111;border-bottom:1px solid #2a2a2a;position:sticky;top:0;z-index:10;">
        <div class="max-w-[860px] mx-auto px-5" style="display:flex;align-items:center;height:44px;gap:8px;">
          <NuxtLink
            :to="`/guides/${route.params.slug}`"
            style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#fff;text-decoration:none;display:flex;align-items:center;gap:6px;transition:color 0.15s;white-space:nowrap;"
            class="hover:text-[#e02020]"
          >← r/{{ route.params.slug }}</NuxtLink>
          <span style="color:#fff;">·</span>
          <span style="font-family:'Courier New',monospace;font-size:10px;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ topic.title }}</span>
        </div>
      </div>

      <div class="max-w-[860px] mx-auto px-5 py-8">

        <!-- Post principal -->
        <div style="background:#1f1f1f;border:1px solid #2e2e2e;border-top:2px solid #e02020;margin-bottom:16px;">
          <div style="padding:16px 20px 0;display:flex;align-items:center;gap:10px;">
            <div style="width:34px;height:34px;background:#2a2a2a;border:1px solid #333;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <span style="font-family:impact,sans-serif;font-size:15px;color:#fff;">{{ topic.author.username[0].toUpperCase() }}</span>
            </div>
            <div>
              <span style="font-family:'Courier New',monospace;font-size:13px;color:#fff;">{{ topic.author.username }}</span>
              <span style="font-family:'Courier New',monospace;font-size:11px;color:#fff;margin-left:10px;">{{ fmtFull(topic.createdAt) }}</span>
            </div>
          </div>
          <div style="padding:14px 20px 0;">
            <h1 style="font-family:impact,sans-serif;font-size:26px;letter-spacing:1px;text-transform:uppercase;color:#fff;line-height:1.2;">{{ topic.title }}</h1>
          </div>
          <div style="padding:12px 20px;">
            <p style="font-family:'Courier New',monospace;font-size:13px;line-height:1.85;color:#fff;white-space:pre-wrap;">{{ topic.content }}</p>
          </div>
          <div v-if="topic.imageUrl" style="padding:0 20px 16px;">
            <img
              :src="topic.imageUrl"
              alt="GIF"
              style="max-width:100%;max-height:400px;object-fit:contain;display:block;cursor:pointer;border:1px solid #2a2a2a;"
              @click="lightboxSrc = topic.imageUrl"
              loading="lazy"
            />
          </div>
          <div style="padding:12px 20px;border-top:1px solid #252525;display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <span style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:1px;color:#fff;display:flex;align-items:center;gap:6px;">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6l-3 3V4z"/></svg>
              {{ totalReplies }} commentaire{{ totalReplies !== 1 ? 's' : '' }}
            </span>
            <button
              v-if="user?.username === topic.author.username"
              @click="deleteTopic"
              :disabled="deletingTopic"
              style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1px;text-transform:uppercase;background:none;border:none;color:#fff;cursor:pointer;display:flex;align-items:center;gap:4px;padding:0;transition:color 0.15s;"
              class="hover:text-[#e02020]"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M6 2a1 1 0 00-.894.553L4.382 4H2a1 1 0 000 2v7a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-2.382l-.724-1.447A1 1 0 0010 2H6zm0 5a1 1 0 112 0v3a1 1 0 11-2 0V7zm4 0a1 1 0 112 0v3a1 1 0 11-2 0V7z"/></svg>
              {{ deletingTopic ? '…' : 'Supprimer le sujet' }}
            </button>
          </div>
        </div>

        <!-- Formulaire commentaire top-level -->
        <div v-if="isLoggedIn" style="background:#1f1f1f;border:1px solid #2e2e2e;padding:18px 20px;margin-bottom:20px;">
          <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#fff;margin-bottom:12px;">Laisser un commentaire</div>
          <textarea
            v-model="replyDraft"
            rows="4"
            placeholder="Ton commentaire…"
            style="width:100%;background:#252525;border:1px solid #333;color:#fff;font-family:'Courier New',monospace;font-size:13px;line-height:1.7;padding:10px 12px;resize:vertical;outline:none;transition:border-color 0.15s;margin-bottom:10px;"
            class="focus:border-[#e02020]"
          />

          <!-- GIF sélectionné -->
          <div v-if="selectedGifUrl" style="margin-bottom:10px;position:relative;display:inline-block;">
            <img :src="selectedGifUrl" style="max-height:150px;max-width:300px;object-fit:contain;border:1px solid #333;display:block;" />
            <button @click="selectedGifUrl = null" style="position:absolute;top:-6px;right:-6px;width:18px;height:18px;background:#e02020;border:none;color:#fff;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">×</button>
          </div>

          <div v-if="topLevelError" style="font-family:'Courier New',monospace;font-size:12px;color:#e02020;margin-bottom:8px;">{{ topLevelError }}</div>

          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <button
              @click="submitTopLevel"
              :disabled="topLevelSaving || (!replyDraft.trim() && !selectedGifUrl)"
              class="btn-primary"
              style="font-size:12px;padding:8px 20px;"
            >{{ topLevelSaving ? 'Publication…' : 'Commenter' }}</button>

            <GifPicker @select="selectedGifUrl = $event" />
          </div>
        </div>

        <div v-else style="background:#1f1f1f;border:1px solid #2e2e2e;padding:16px 20px;margin-bottom:20px;font-family:'Courier New',monospace;font-size:12px;color:#fff;text-align:center;">
          <NuxtLink to="/auth/login" style="color:#e02020;text-decoration:none;">Connectez-vous</NuxtLink> pour laisser un commentaire.
        </div>

        <!-- Commentaires -->
        <div v-if="replyTree.length">
          <div style="margin-bottom:12px;padding:0 2px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#fff;">
            <span style="font-family:impact,sans-serif;font-size:16px;letter-spacing:1px;color:#fff;">{{ totalReplies }}</span>
            commentaire{{ totalReplies !== 1 ? 's' : '' }}
          </div>

          <div style="background:#252525;display:flex;flex-direction:column;gap:1px;">
            <GuideReplyThread
              v-for="(reply, i) in replyTree"
              :key="reply.id"
              :reply="reply"
              :depth="0"
              :is-first="i === 0"
              :in-modal="false"
              :is-logged-in="isLoggedIn"
              :current-username="user?.username || null"
              :topic-context="topic"
              :topic-id="route.params.topicId"
              :guide-slug="route.params.slug"
              :token="token"
              :base="base"
              @reply-added="handleReplyAdded"
              @reply-deleted="handleReplyDeleted"
            />
          </div>
        </div>

        <div v-else style="background:#1c1c1c;border:1px solid #2a2a2a;padding:40px 20px;text-align:center;">
          <div style="font-family:'Courier New',monospace;font-size:12px;letter-spacing:2px;color:#fff;text-transform:uppercase;margin-bottom:6px;">Aucun commentaire</div>
          <div style="font-family:'Courier New',monospace;font-size:11px;color:#fff;">Sois le premier à répondre à ce sujet.</div>
        </div>

      </div>
    </template>

    <div v-else style="text-align:center;padding:96px 24px;">
      <div style="font-family:impact,sans-serif;font-size:48px;text-transform:uppercase;color:#1e1e1e;">INTROUVABLE</div>
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <div
        v-if="lightboxSrc"
        style="position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:300;display:flex;align-items:center;justify-content:center;cursor:zoom-out;"
        @click="lightboxSrc = null"
      >
        <img :src="lightboxSrc" style="max-width:90vw;max-height:90vh;object-fit:contain;" @click.stop />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
const route = useRoute()
const config = useRuntimeConfig()
const base = config.public.apiBase
const { token, isLoggedIn, user } = useAuth()

function authHeaders() {
  return token.value ? { Authorization: `Bearer ${token.value}` } : {}
}

const { data: topic, pending } = await useFetch(
  `${base}/guides/${route.params.slug}/topics/${route.params.topicId}`
)

const replyTree = ref([])
watch(topic, (t) => { if (t) replyTree.value = t.replies || [] }, { immediate: true })

const totalReplies = computed(() => countAll(replyTree.value))
function countAll(nodes) {
  return nodes.reduce((n, r) => n + 1 + countAll(r.children || []), 0)
}

function handleReplyAdded({ reply, parentId }) {
  insertInTree(replyTree.value, parentId, reply)
}
function insertInTree(nodes, parentId, reply) {
  for (const node of nodes) {
    if (node.id === parentId) {
      if (!node.children) node.children = []
      node.children.push(reply)
      return true
    }
    if (node.children?.length && insertInTree(node.children, parentId, reply)) return true
  }
  return false
}

function handleReplyDeleted(replyId) {
  removeFromTree(replyTree.value, replyId)
}
function removeFromTree(nodes, id) {
  const idx = nodes.findIndex(n => n.id === id)
  if (idx !== -1) { nodes.splice(idx, 1); return true }
  for (const node of nodes) {
    if (node.children?.length && removeFromTree(node.children, id)) return true
  }
  return false
}

const deletingTopic = ref(false)
async function deleteTopic() {
  if (!confirm('Supprimer ce sujet et tous ses commentaires ?')) return
  deletingTopic.value = true
  try {
    await $fetch(`${base}/guides/${route.params.slug}/topics/${route.params.topicId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    navigateTo(`/guides/${route.params.slug}`)
  } catch (e) {
    alert(e.data?.error || 'Erreur lors de la suppression')
    deletingTopic.value = false
  }
}

const replyDraft = ref('')
const topLevelSaving = ref(false)
const topLevelError = ref('')
const selectedGifUrl = ref(null)
const lightboxSrc = ref(null)

async function submitTopLevel() {
  if (!replyDraft.value.trim() && !selectedGifUrl.value) return
  topLevelSaving.value = true
  topLevelError.value = ''
  try {
    const reply = await $fetch(
      `${base}/guides/${route.params.slug}/topics/${route.params.topicId}/replies`,
      {
        method: 'POST',
        body: { content: replyDraft.value.trim(), imageUrl: selectedGifUrl.value || null },
        headers: authHeaders(),
      }
    )
    replyTree.value.push(reply)
    replyDraft.value = ''
    selectedGifUrl.value = null
  } catch (e) {
    topLevelError.value = e.data?.error || 'Erreur lors de la publication'
  } finally {
    topLevelSaving.value = false
  }
}

function fmtFull(date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>
