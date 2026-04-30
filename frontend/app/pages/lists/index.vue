<template>
  <div>

    <!-- Page header -->
    <div style="border-bottom:1px solid #2a2a2a;">
      <div class="max-w-[1100px] mx-auto px-6 pt-9 pb-0">
        <div style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:5px;color:#e02020;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:10px;">
          <div style="width:16px;height:2px;background:#e02020;flex-shrink:0;"></div>
          Collections thématiques
        </div>
        <div style="display:flex;align-items:flex-end;justify-content:space-between;padding-bottom:18px;">
          <div style="font-family:impact,sans-serif;font-size:52px;letter-spacing:1px;color:#fff;text-transform:uppercase;line-height:1;">MES LISTES</div>
          <button @click="showCreate = true" class="btn-primary" style="font-size:11px;padding:9px 20px;margin-bottom:4px;">
            + NOUVELLE LISTE
          </button>
        </div>
      </div>
    </div>

    <div class="max-w-[1100px] mx-auto px-6 py-8">

      <!-- Modal création -->
      <div v-if="showCreate" style="position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:16px;">
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.75);" @click="showCreate = false" />
        <div style="position:relative;background:#111;border:1px solid #2a2a2a;border-top:2px solid #e02020;padding:28px;width:100%;max-width:400px;">
          <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#e02020;margin-bottom:8px;">Nouvelle liste</div>
          <div style="font-family:impact,sans-serif;font-size:20px;letter-spacing:1px;text-transform:uppercase;color:#fff;margin-bottom:20px;">Créer une collection</div>
          <input
            v-model="newName"
            type="text"
            placeholder="Nom de la liste…"
            class="input mb-4"
            @keydown.enter="createList"
            autofocus
          />
          <label style="display:flex;align-items:center;gap:12px;margin-bottom:20px;cursor:pointer;">
            <div
              @click="newPublic = !newPublic"
              style="width:36px;height:20px;border-radius:10px;position:relative;transition:background 0.15s;flex-shrink:0;"
              :style="newPublic ? 'background:#e02020;' : 'background:#2a2a2a;'"
            >
              <div style="position:absolute;top:2px;width:16px;height:16px;background:#fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.5);transition:transform 0.15s;"
                :style="newPublic ? 'transform:translateX(18px);' : 'transform:translateX(2px);'" />
            </div>
            <span style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#aaa;">Rendre publique</span>
          </label>
          <div v-if="createError" style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:1px;color:#e02020;margin-bottom:12px;">{{ createError }}</div>
          <div class="flex gap-2">
            <button @click="createList" :disabled="!newName.trim() || creating" class="btn-primary flex-1 justify-center" style="font-size:11px;padding:10px;">
              Créer
            </button>
            <button @click="showCreate = false" class="btn-ghost flex-1 justify-center">Annuler</button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="pending" style="display:flex;align-items:center;gap:10px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;color:#888;text-transform:uppercase;padding:80px 0;">
        <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Chargement…
      </div>

      <!-- Vide -->
      <div v-else-if="!lists.length" style="text-align:center;padding:80px 0;">
        <div style="font-family:impact,sans-serif;font-size:48px;letter-spacing:2px;text-transform:uppercase;color:#2a2a2a;margin-bottom:12px;">🗂️</div>
        <p style="font-family:impact,sans-serif;font-size:18px;letter-spacing:2px;text-transform:uppercase;color:#555;margin-bottom:8px;">Aucune liste pour l'instant</p>
        <p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;color:#444;text-transform:uppercase;margin-bottom:24px;">Crée ta première collection thématique.</p>
        <button @click="showCreate = true" class="btn-primary">Créer une liste</button>
      </div>

      <!-- Grille -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-px" style="background:#2a2a2a;">
        <div
          v-for="list in lists"
          :key="list.id"
          style="background:#111;padding:20px;transition:background 0.15s;"
          class="hover:bg-[#141414] group"
        >
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;">
            <NuxtLink :to="`/lists/${list.id}`" style="flex:1;min-width:0;text-decoration:none;">
              <h3 style="font-family:impact,sans-serif;font-size:16px;letter-spacing:0.5px;text-transform:uppercase;color:#fff;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color 0.15s;" class="group-hover:text-[#e02020]">
                {{ list.name }}
              </h3>
            </NuxtLink>
            <!-- Badge visibilité -->
            <button
              @click="toggleVisibility(list)"
              style="flex-shrink:0;font-family:'Courier New',monospace;font-size:8px;letter-spacing:2px;text-transform:uppercase;padding:4px 10px;border:1px solid;cursor:pointer;transition:all 0.15s;"
              :style="list.isPublic
                ? 'border-color:rgba(34,197,94,0.4);background:rgba(34,197,94,0.08);color:#86efac;'
                : 'border-color:#3a3a3a;background:transparent;color:#888;'"
              :title="list.isPublic ? 'Rendre privée' : 'Rendre publique'"
            >
              {{ list.isPublic ? '🌐 PUBLIC' : '🔒 PRIVÉ' }}
            </button>
          </div>

          <p style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#888;margin-bottom:16px;">
            {{ list._count.items }} comic{{ list._count.items !== 1 ? 's' : '' }}
          </p>

          <div style="display:flex;align-items:center;gap:16px;">
            <NuxtLink
              :to="`/lists/${list.id}`"
              style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#aaa;text-decoration:none;transition:color 0.15s;"
              class="hover:text-[#e02020]"
            >
              Voir →
            </NuxtLink>
            <button
              v-if="list.isPublic"
              @click="copyLink(list.slug)"
              style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#aaa;background:none;border:none;cursor:pointer;transition:color 0.15s;"
              class="hover:text-[#e02020]"
            >
              Copier le lien
            </button>
            <button
              @click="deleteList(list)"
              style="margin-left:auto;font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#555;background:none;border:none;cursor:pointer;transition:color 0.15s;"
              class="hover:text-[#e02020]"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>

      <!-- Toast copie -->
      <div
        v-if="copied"
        style="position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 24px;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.3);color:#86efac;font-family:'Courier New',monospace;font-size:11px;letter-spacing:3px;text-transform:uppercase;z-index:50;"
      >
        Lien copié ✓
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

const config = useRuntimeConfig()
const base = config.public.apiBase
const { token } = useAuth()

function authHeaders() {
  return token.value ? { Authorization: `Bearer ${token.value}` } : {}
}

const pending = ref(true)
const lists = ref([])

async function load() {
  pending.value = true
  try {
    lists.value = await $fetch(`${base}/lists`, { headers: authHeaders() })
  } catch {}
  pending.value = false
}

onMounted(load)

const showCreate = ref(false)
const newName = ref('')
const newPublic = ref(false)
const creating = ref(false)
const createError = ref('')

async function createList() {
  if (!newName.value.trim()) return
  creating.value = true
  createError.value = ''
  try {
    const list = await $fetch(`${base}/lists`, {
      method: 'POST',
      body: { name: newName.value.trim(), isPublic: newPublic.value },
      headers: authHeaders(),
    })
    lists.value.unshift({ ...list, _count: { items: 0 } })
    showCreate.value = false
    newName.value = ''
    newPublic.value = false
  } catch (e) {
    createError.value = e.data?.error || 'Erreur'
  } finally {
    creating.value = false
  }
}

async function toggleVisibility(list) {
  try {
    const updated = await $fetch(`${base}/lists/${list.id}/visibility`, {
      method: 'PATCH',
      body: { isPublic: !list.isPublic },
      headers: authHeaders(),
    })
    const idx = lists.value.findIndex(l => l.id === list.id)
    if (idx !== -1) lists.value[idx] = { ...lists.value[idx], ...updated }
  } catch {}
}

async function deleteList(list) {
  if (!confirm(`Supprimer "${list.name}" ?`)) return
  try {
    await $fetch(`${base}/lists/${list.id}`, { method: 'DELETE', headers: authHeaders() })
    lists.value = lists.value.filter(l => l.id !== list.id)
  } catch {}
}

const copied = ref(false)
function copyLink(slug) {
  const url = `${window.location.origin}/lists/public/${slug}`
  navigator.clipboard.writeText(url)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>
