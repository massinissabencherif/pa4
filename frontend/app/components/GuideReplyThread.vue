<template>
  <div
    :style="{
      borderLeft: depth > 0 ? '2px solid #2a2a2a' : 'none',
      marginLeft: depth > 0 ? '20px' : '0',
    }"
  >
    <div style="background:#1c1c1c;padding:14px 16px;transition:background 0.15s;" class="hover:bg-[#1f1f1f]">

      <!-- Meta -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <div style="width:26px;height:26px;background:#252525;border:1px solid #2e2e2e;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span style="font-family:impact,sans-serif;font-size:13px;color:#fff;">{{ reply.author.username[0].toUpperCase() }}</span>
        </div>
        <span style="font-family:'Courier New',monospace;font-size:12px;color:#fff;">{{ reply.author.username }}</span>
        <span style="font-family:'Courier New',monospace;font-size:11px;color:#fff;">{{ fmtRelative(reply.createdAt) }}</span>
        <span v-if="isFirst && depth === 0 && !inModal" style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#e02020;background:rgba(224,32,32,0.1);border:1px solid rgba(224,32,32,0.2);padding:1px 5px;">1er</span>
      </div>

      <!-- Contenu -->
      <p v-if="reply.content" style="font-family:'Courier New',monospace;font-size:13px;line-height:1.8;color:#fff;white-space:pre-wrap;margin-bottom:10px;">{{ reply.content }}</p>

      <!-- GIF -->
      <div v-if="reply.imageUrl" style="margin-bottom:10px;">
        <img
          :src="reply.imageUrl"
          alt="GIF"
          style="max-width:360px;max-height:240px;object-fit:contain;display:block;cursor:pointer;border:1px solid #2a2a2a;"
          @click="lightboxSrc = reply.imageUrl"
          loading="lazy"
        />
      </div>

      <!-- Actions -->
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">

        <!-- Répondre -->
        <button
          v-if="isLoggedIn && !inModal"
          @click="showReply = !showReply"
          style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;background:none;border:none;color:#fff;cursor:pointer;display:flex;align-items:center;gap:5px;padding:0;transition:color 0.15s;"
          class="hover:text-[#e02020]"
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6l-3 3V4z"/></svg>
          Répondre
        </button>

        <!-- Voir le thread -->
        <button
          v-if="reply.children?.length && !inModal"
          @click="threadModal = true"
          style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;background:none;border:none;color:#fff;cursor:pointer;display:flex;align-items:center;gap:5px;padding:0;transition:color 0.15s;"
          class="hover:text-[#888]"
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6l-3 3V4z"/></svg>
          {{ reply.children.length }} réponse{{ reply.children.length !== 1 ? 's' : '' }} · voir le thread
        </button>
        <span v-else-if="reply.children?.length && inModal" style="font-family:'Courier New',monospace;font-size:11px;color:#fff;">
          {{ reply.children.length }} réponse{{ reply.children.length !== 1 ? 's' : '' }}
        </span>

        <!-- Supprimer (propre commentaire) -->
        <button
          v-if="currentUsername && currentUsername === reply.author.username"
          @click="handleDelete"
          :disabled="deleting"
          style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;background:none;border:none;color:#fff;cursor:pointer;display:flex;align-items:center;gap:4px;padding:0;transition:color 0.15s;margin-left:auto;"
          class="hover:text-[#e02020]"
        >
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M6 2a1 1 0 00-.894.553L4.382 4H2a1 1 0 000 2v7a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-2.382l-.724-1.447A1 1 0 0010 2H6zm0 5a1 1 0 112 0v3a1 1 0 11-2 0V7zm4 0a1 1 0 112 0v3a1 1 0 11-2 0V7z"/></svg>
          {{ deleting ? '…' : 'Supprimer' }}
        </button>
      </div>

      <!-- Formulaire de réponse inline -->
      <div v-if="showReply" style="margin-top:12px;background:#222;border:1px solid #2e2e2e;border-left:2px solid #e02020;padding:12px;">
        <textarea
          v-model="replyText"
          rows="3"
          :placeholder="`Répondre à ${reply.author.username}…`"
          style="width:100%;background:#1a1a1a;border:1px solid #333;color:#fff;font-family:'Courier New',monospace;font-size:13px;line-height:1.6;padding:8px 10px;resize:vertical;outline:none;transition:border-color 0.15s;margin-bottom:8px;"
          class="focus:border-[#e02020]"
        />
        <div v-if="selectedGifUrl" style="margin-bottom:8px;position:relative;display:inline-block;">
          <img :src="selectedGifUrl" style="max-height:120px;max-width:240px;object-fit:contain;border:1px solid #333;display:block;" />
          <button @click="selectedGifUrl = null" style="position:absolute;top:-6px;right:-6px;width:18px;height:18px;background:#e02020;border:none;color:#fff;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">×</button>
        </div>
        <div v-if="replyError" style="font-family:'Courier New',monospace;font-size:12px;color:#e02020;margin-bottom:8px;">{{ replyError }}</div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <button @click="submitReply" :disabled="replySaving || (!replyText.trim() && !selectedGifUrl)" class="btn-primary" style="font-size:11px;padding:6px 16px;">
            {{ replySaving ? '…' : 'Publier' }}
          </button>
          <GifPicker @select="selectedGifUrl = $event" />
          <button @click="cancelReply" style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;background:none;border:none;color:#fff;cursor:pointer;transition:color 0.15s;" class="hover:text-[#888]">Annuler</button>
        </div>
      </div>
    </div>

    <!-- Enfants récursifs -->
    <div v-if="reply.children?.length">
      <GuideReplyThread
        v-for="(child, i) in reply.children"
        :key="child.id"
        :reply="child"
        :depth="Math.min(depth + 1, 4)"
        :is-first="false"
        :in-modal="inModal"
        :is-logged-in="isLoggedIn"
        :current-username="currentUsername"
        :topic-context="topicContext"
        :topic-id="topicId"
        :guide-slug="guideSlug"
        :token="token"
        :base="base"
        @reply-added="$emit('reply-added', $event)"
        @reply-deleted="$emit('reply-deleted', $event)"
      />
    </div>

    <!-- ─── Modal thread ───────────────────────────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="threadModal"
        style="position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;"
        @click.self="threadModal = false"
      >
        <div style="background:#171717;border:1px solid #2e2e2e;border-top:2px solid #e02020;width:100%;max-width:700px;height:88vh;display:flex;flex-direction:column;overflow:hidden;">

          <!-- Header modal -->
          <div style="padding:12px 16px;border-bottom:1px solid #2a2a2a;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:#111;">
            <div style="display:flex;align-items:center;gap:8px;">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style="color:#e02020;"><path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6l-3 3V4z"/></svg>
              <span style="font-family:impact,sans-serif;font-size:14px;letter-spacing:1px;text-transform:uppercase;color:#fff;">Thread</span>
              <span style="font-family:'Courier New',monospace;font-size:11px;color:#fff;">{{ countAll([reply]) }} commentaire{{ countAll([reply]) !== 1 ? 's' : '' }}</span>
            </div>
            <button @click="threadModal = false" style="background:none;border:none;color:#fff;cursor:pointer;font-size:20px;line-height:1;" class="hover:text-[#fff]">×</button>
          </div>

          <!-- Contenu scrollable -->
          <div style="flex:1;overflow-y:auto;" class="modal-scroll">

            <!-- Post original (topic) si disponible -->
            <div v-if="topicContext" style="background:#131313;border-bottom:1px solid #2a2a2a;padding:14px 20px;">
              <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#e02020;margin-bottom:8px;">Post original</div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <div style="width:24px;height:24px;background:#222;border:1px solid #2e2e2e;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <span style="font-family:impact,sans-serif;font-size:12px;color:#fff;">{{ topicContext.author.username[0].toUpperCase() }}</span>
                </div>
                <span style="font-family:'Courier New',monospace;font-size:11px;color:#fff;">{{ topicContext.author.username }}</span>
              </div>
              <p style="font-family:impact,sans-serif;font-size:15px;letter-spacing:0.5px;text-transform:uppercase;color:#fff;line-height:1.2;margin-bottom:6px;">{{ topicContext.title }}</p>
              <p v-if="topicContext.content" style="font-family:'Courier New',monospace;font-size:12px;line-height:1.7;color:#fff;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">{{ topicContext.content }}</p>
            </div>

            <!-- Commentaire racine du thread (le cliqué) -->
            <div style="background:#1f1f1f;border-bottom:2px solid #252525;border-left:3px solid #e02020;padding:16px 20px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                <div style="width:30px;height:30px;background:#2a2a2a;border:1px solid #333;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <span style="font-family:impact,sans-serif;font-size:13px;color:#fff;">{{ reply.author.username[0].toUpperCase() }}</span>
                </div>
                <span style="font-family:'Courier New',monospace;font-size:13px;color:#fff;font-weight:600;">{{ reply.author.username }}</span>
                <span style="font-family:'Courier New',monospace;font-size:11px;color:#fff;">{{ fmtRelative(reply.createdAt) }}</span>
              </div>
              <p v-if="reply.content" style="font-family:'Courier New',monospace;font-size:13px;line-height:1.8;color:#fff;white-space:pre-wrap;margin-bottom:10px;">{{ reply.content }}</p>
              <div v-if="reply.imageUrl">
                <img :src="reply.imageUrl" alt="GIF" style="max-width:100%;max-height:280px;object-fit:contain;display:block;border:1px solid #2a2a2a;" />
              </div>
            </div>

            <!-- Tous les commentaires du thread, récursifs -->
            <div style="background:#1a1a1a;display:flex;flex-direction:column;gap:1px;">
              <GuideReplyThread
                v-for="child in reply.children"
                :key="child.id"
                :reply="child"
                :depth="0"
                :is-first="false"
                :in-modal="true"
                :is-logged-in="isLoggedIn"
                :current-username="currentUsername"
                :topic-context="topicContext"
                :topic-id="topicId"
                :guide-slug="guideSlug"
                :token="token"
                :base="base"
                @reply-added="$emit('reply-added', $event)"
                @reply-deleted="$emit('reply-deleted', $event)"
              />
            </div>
          </div>
        </div>
      </div>
    </Teleport>

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
const props = defineProps({
  reply: { type: Object, required: true },
  depth: { type: Number, default: 0 },
  isFirst: { type: Boolean, default: false },
  inModal: { type: Boolean, default: false },
  isLoggedIn: { type: Boolean, default: false },
  currentUsername: { type: String, default: null },
  topicContext: { type: Object, default: null },
  topicId: { type: String, required: true },
  guideSlug: { type: String, required: true },
  token: { type: String, default: null },
  base: { type: String, required: true },
})
const emit = defineEmits(['reply-added', 'reply-deleted'])

const showReply = ref(false)
const replyText = ref('')
const replySaving = ref(false)
const replyError = ref('')
const selectedGifUrl = ref(null)
const lightboxSrc = ref(null)
const threadModal = ref(false)
const deleting = ref(false)

function countAll(nodes) {
  return nodes.reduce((n, r) => n + 1 + countAll(r.children || []), 0)
}

function cancelReply() {
  showReply.value = false
  replyText.value = ''
  replyError.value = ''
  selectedGifUrl.value = null
}

async function submitReply() {
  if (!replyText.value.trim() && !selectedGifUrl.value) return
  replySaving.value = true
  replyError.value = ''
  try {
    const reply = await $fetch(
      `${props.base}/guides/${props.guideSlug}/topics/${props.topicId}/replies`,
      {
        method: 'POST',
        body: { content: replyText.value.trim(), imageUrl: selectedGifUrl.value || null, parentId: props.reply.id },
        headers: props.token ? { Authorization: `Bearer ${props.token}` } : {},
      }
    )
    emit('reply-added', { reply, parentId: props.reply.id })
    cancelReply()
  } catch (e) {
    replyError.value = e.data?.error || 'Erreur'
  } finally {
    replySaving.value = false
  }
}

async function handleDelete() {
  if (!confirm('Supprimer ce commentaire et toutes ses réponses ?')) return
  deleting.value = true
  try {
    await $fetch(
      `${props.base}/guides/${props.guideSlug}/topics/${props.topicId}/replies/${props.reply.id}`,
      {
        method: 'DELETE',
        headers: props.token ? { Authorization: `Bearer ${props.token}` } : {},
      }
    )
    emit('reply-deleted', props.reply.id)
  } catch (e) {
    alert(e.data?.error || 'Erreur lors de la suppression')
  } finally {
    deleting.value = false
  }
}

function fmtRelative(date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `il y a ${days}j`
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
</script>

<style scoped>
.modal-scroll::-webkit-scrollbar { width: 4px; }
.modal-scroll::-webkit-scrollbar-track { background: #111; }
.modal-scroll::-webkit-scrollbar-thumb { background: #333; }
</style>
