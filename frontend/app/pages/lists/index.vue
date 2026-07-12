<template>
  <div>

    <!-- Header -->
    <div style="border-bottom:1px solid #2a2a2a;">
      <div class="max-w-[860px] mx-auto px-6 pt-9 pb-0">
        <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:5px;color:#e02020;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:10px;">
          <div style="width:16px;height:2px;background:#e02020;flex-shrink:0;"></div>
          Collections thématiques
        </div>
        <div style="display:flex;align-items:flex-end;justify-content:space-between;padding-bottom:0;">
          <div style="font-family:impact,sans-serif;font-size:52px;letter-spacing:1px;color:#fff;text-transform:uppercase;line-height:1;">LISTES</div>
          <button v-if="activeTab === 'mine'" @click="showCreate = true" class="btn-primary" style="font-size:12px;padding:9px 20px;margin-bottom:8px;">
            + NOUVELLE LISTE
          </button>
        </div>

        <!-- Tabs -->
        <div style="display:flex;margin-top:20px;">
          <button
            @click="activeTab = 'mine'"
            style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:3px;text-transform:uppercase;padding:10px 24px;background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;transition:all 0.15s;"
            :style="activeTab === 'mine' ? 'color:#fff;border-bottom-color:#e02020;' : 'color:#fff;'"
            class="hover:text-[#aaa]"
          >Mes listes</button>
          <button
            @click="switchToPublic"
            style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:3px;text-transform:uppercase;padding:10px 24px;background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;transition:all 0.15s;"
            :style="activeTab === 'public' ? 'color:#fff;border-bottom-color:#e02020;' : 'color:#fff;'"
            class="hover:text-[#aaa]"
          >Publiques</button>
        </div>
      </div>
    </div>

    <div class="max-w-[860px] mx-auto px-6 py-8">

      <!-- ─── MODAL CRÉATION ─── -->
      <Teleport to="body">
        <div v-if="showCreate" style="position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:16px;">
          <div style="position:absolute;inset:0;background:rgba(0,0,0,0.75);" @click="showCreate = false" />
          <div style="position:relative;background:#111;border:1px solid #2a2a2a;border-top:2px solid #e02020;padding:28px;width:100%;max-width:420px;">
            <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#e02020;margin-bottom:8px;">Nouvelle liste</div>
            <div style="font-family:impact,sans-serif;font-size:20px;letter-spacing:1px;text-transform:uppercase;color:#fff;margin-bottom:20px;">Créer une collection</div>
            <input
              v-model="newName"
              type="text"
              placeholder="Nom de la liste…"
              class="input mb-3"
              @keydown.enter="createList"
              autofocus
            />
            <textarea
              v-model="newDescription"
              rows="3"
              placeholder="Description (optionnel)…"
              class="input mb-4 resize-none"
              style="font-size:13px;"
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
              <span style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#fff;">Rendre publique</span>
            </label>
            <div v-if="createError" style="font-family:'Courier New',monospace;font-size:12px;color:#e02020;margin-bottom:12px;">{{ createError }}</div>
            <div style="display:flex;gap:8px;">
              <button @click="createList" :disabled="!newName.trim() || creating" class="btn-primary flex-1 justify-center" style="font-size:12px;padding:10px;">
                {{ creating ? 'Création…' : 'Créer' }}
              </button>
              <button @click="showCreate = false" class="btn-ghost flex-1 justify-center">Annuler</button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- ─── MES LISTES ─── -->
      <template v-if="activeTab === 'mine'">

        <div v-if="pending" style="display:flex;align-items:center;gap:10px;font-family:'Courier New',monospace;font-size:12px;letter-spacing:2px;color:#fff;text-transform:uppercase;padding:80px 0;">
          <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Chargement…
        </div>

        <div v-else-if="!lists.length" style="text-align:center;padding:80px 0;">
          <p style="font-family:impact,sans-serif;font-size:18px;letter-spacing:2px;text-transform:uppercase;color:#fff;margin-bottom:8px;">Aucune liste</p>
          <p style="font-family:'Courier New',monospace;font-size:12px;letter-spacing:2px;color:#fff;text-transform:uppercase;margin-bottom:24px;">Crée ta première collection thématique.</p>
          <button @click="showCreate = true" class="btn-primary">Créer une liste</button>
        </div>

        <template v-else>
          <!-- Recherche -->
          <div style="position:relative;margin-bottom:20px;">
            <input
              v-model="mineSearch"
              type="text"
              placeholder="Filtrer mes listes…"
              class="input"
              style="padding-left:38px;"
            />
            <svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#fff;" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.742 10.344a6.5 6.5 0 10-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 001.415-1.414l-3.85-3.85a1.007 1.007 0 00-.115-.099zm-5.242 1.156a5.5 5.5 0 110-11 5.5 5.5 0 010 11z"/>
            </svg>
          </div>

          <div v-if="!filteredMyLists.length" style="font-family:'Courier New',monospace;font-size:12px;color:#fff;padding:40px 0;text-align:center;">
            Aucune liste ne correspond à "{{ mineSearch }}"
          </div>

          <div v-else style="display:flex;flex-direction:column;gap:1px;background:#2a2a2a;">
            <div
              v-for="list in filteredMyLists"
              :key="list.id"
              style="background:#111;padding:18px 20px;transition:background 0.15s;"
              class="hover:bg-[#141414]"
            >
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:6px;">
                <NuxtLink :to="`/lists/${list.id}`" style="flex:1;min-width:0;text-decoration:none;">
                  <span style="font-family:impact,sans-serif;font-size:17px;letter-spacing:0.5px;text-transform:uppercase;color:#fff;transition:color 0.15s;" class="hover:text-[#e02020]">
                    {{ list.name }}
                  </span>
                </NuxtLink>
                <button
                  @click="toggleVisibility(list)"
                  style="flex-shrink:0;font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;padding:4px 10px;border:1px solid;cursor:pointer;transition:all 0.15s;"
                  :style="list.isPublic
                    ? 'border-color:rgba(34,197,94,0.4);background:rgba(34,197,94,0.08);color:#86efac;'
                    : 'border-color:#3a3a3a;background:transparent;color:#fff;'"
                  :title="list.isPublic ? 'Rendre privée' : 'Rendre publique'"
                >{{ list.isPublic ? '🌐 PUBLIC' : '🔒 PRIVÉ' }}</button>
              </div>
              <p v-if="list.description" style="font-family:'Courier New',monospace;font-size:12px;line-height:1.6;color:#fff;margin-bottom:8px;">{{ list.description }}</p>
              <div style="display:flex;align-items:center;gap:16px;">
                <span style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#fff;">
                  {{ list._count.items }} comic{{ list._count.items !== 1 ? 's' : '' }}
                </span>
                <NuxtLink :to="`/lists/${list.id}`" style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#fff;text-decoration:none;transition:color 0.15s;" class="hover:text-[#e02020]">
                  Voir →
                </NuxtLink>
                <button
                  v-if="list.isPublic"
                  @click="copyLink(list.slug)"
                  style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#fff;background:none;border:none;cursor:pointer;transition:color 0.15s;"
                  class="hover:text-[#e02020]"
                >Copier le lien</button>
                <button
                  @click="deleteList(list)"
                  style="margin-left:auto;font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#fff;background:none;border:none;cursor:pointer;transition:color 0.15s;"
                  class="hover:text-[#e02020]"
                >Supprimer</button>
              </div>
            </div>
          </div>
        </template>
      </template>

      <!-- ─── LISTES PUBLIQUES ─── -->
      <template v-if="activeTab === 'public'">

        <!-- Recherche -->
        <div style="position:relative;margin-bottom:24px;max-width:480px;">
          <input
            v-model="publicSearch"
            type="text"
            placeholder="Rechercher une liste publique…"
            class="input"
            style="padding-left:38px;"
            @input="onPublicSearch"
          />
          <svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#fff;" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.742 10.344a6.5 6.5 0 10-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 001.415-1.414l-3.85-3.85a1.007 1.007 0 00-.115-.099zm-5.242 1.156a5.5 5.5 0 110-11 5.5 5.5 0 010 11z"/>
          </svg>
        </div>

        <div v-if="publicPending" style="display:flex;align-items:center;gap:10px;font-family:'Courier New',monospace;font-size:12px;letter-spacing:2px;color:#fff;text-transform:uppercase;padding:80px 0;">
          <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Chargement…
        </div>

        <div v-else-if="!publicLists.length" style="text-align:center;padding:80px 0;">
          <p style="font-family:'Courier New',monospace;font-size:12px;letter-spacing:2px;color:#fff;text-transform:uppercase;">
            {{ publicSearch ? 'Aucun résultat.' : 'Aucune liste publique pour l\'instant.' }}
          </p>
        </div>

        <template v-else>
          <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#fff;margin-bottom:16px;">
            {{ publicTotal }} liste{{ publicTotal !== 1 ? 's' : '' }}
          </div>
          <div style="display:flex;flex-direction:column;gap:1px;background:#2a2a2a;">
            <div
              v-for="list in publicLists"
              :key="list.id"
              style="background:#111;padding:18px 20px;transition:background 0.15s;"
              class="hover:bg-[#141414]"
            >
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:6px;">
                <NuxtLink :to="`/lists/public/${list.slug}`" style="flex:1;min-width:0;text-decoration:none;">
                  <span style="font-family:impact,sans-serif;font-size:17px;letter-spacing:0.5px;text-transform:uppercase;color:#fff;transition:color 0.15s;" class="hover:text-[#e02020]">
                    {{ list.name }}
                  </span>
                </NuxtLink>
                <span style="flex-shrink:0;font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;padding:4px 10px;border:1px solid;border-color:rgba(34,197,94,0.4);background:rgba(34,197,94,0.08);color:#86efac;">🌐 PUBLIC</span>
              </div>
              <p style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1px;color:#fff;margin-bottom:6px;">
                par <span style="color:#fff;">{{ list.user.username }}</span>
              </p>
              <p v-if="list.description" style="font-family:'Courier New',monospace;font-size:12px;line-height:1.6;color:#fff;margin-bottom:8px;">{{ list.description }}</p>
              <div style="display:flex;align-items:center;gap:16px;">
                <span style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#fff;">
                  {{ list._count.items }} comic{{ list._count.items !== 1 ? 's' : '' }}
                </span>
                <NuxtLink :to="`/lists/public/${list.slug}`" style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#fff;text-decoration:none;transition:color 0.15s;" class="hover:text-[#e02020]">
                  Voir →
                </NuxtLink>
              </div>
            </div>
          </div>
        </template>
      </template>

    </div>

    <!-- Toast copie -->
    <Teleport to="body">
      <div
        v-if="copied"
        style="position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 24px;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.3);color:#86efac;font-family:'Courier New',monospace;font-size:12px;letter-spacing:3px;text-transform:uppercase;z-index:100;"
      >
        Lien copié ✓
      </div>
    </Teleport>
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

const activeTab = ref('mine')

// ─── Mes listes ───────────────────────────────────────────────────────────────
const pending = ref(true)
const lists = ref([])
const mineSearch = ref('')

const filteredMyLists = computed(() => {
  const q = mineSearch.value.toLowerCase().trim()
  if (!q) return lists.value
  return lists.value.filter(l =>
    l.name.toLowerCase().includes(q) ||
    (l.description && l.description.toLowerCase().includes(q))
  )
})

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
const newDescription = ref('')
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
      body: { name: newName.value.trim(), description: newDescription.value.trim() || null, isPublic: newPublic.value },
      headers: authHeaders(),
    })
    lists.value.unshift({ ...list, _count: { items: 0 } })
    showCreate.value = false
    newName.value = ''
    newDescription.value = ''
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
  } catch (e) {
    alert(e.data?.error || 'Erreur lors de la suppression')
  }
}

const copied = ref(false)
function copyLink(slug) {
  const url = `${window.location.origin}/lists/public/${slug}`
  navigator.clipboard.writeText(url)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

// ─── Listes publiques ─────────────────────────────────────────────────────────
const publicPending = ref(false)
const publicLoaded = ref(false)
const publicLists = ref([])
const publicTotal = ref(0)
const publicSearch = ref('')
let publicSearchTimer = null

function switchToPublic() {
  activeTab.value = 'public'
  if (!publicLoaded.value) loadPublic()
}

async function loadPublic(q = '') {
  publicPending.value = true
  try {
    const res = await $fetch(`${base}/lists/discover?q=${encodeURIComponent(q)}&limit=50`)
    publicLists.value = res.lists
    publicTotal.value = res.total
    publicLoaded.value = true
  } catch {}
  publicPending.value = false
}

function onPublicSearch() {
  clearTimeout(publicSearchTimer)
  publicSearchTimer = setTimeout(() => loadPublic(publicSearch.value), 350)
}
</script>
