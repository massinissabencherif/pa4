<template>
  <div style="display:inline-block;">
    <button
      type="button"
      @click="open = true"
      style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;background:none;border:1px solid #333;color:#fff;padding:6px 12px;cursor:pointer;display:flex;align-items:center;gap:6px;transition:border-color 0.15s,color 0.15s;"
      class="hover:border-[#888] hover:text-[#ccc]"
    >
      <span style="font-size:13px;line-height:1;">GIF</span>
      <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
    </button>
  </div>

  <Teleport to="body">
    <div
      v-if="open"
      style="position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;"
      @click.self="close"
    >
      <div style="background:#1e1e1e;border:1px solid #333;border-top:2px solid #e02020;width:100%;max-width:540px;max-height:82vh;display:flex;flex-direction:column;overflow:hidden;">

        <!-- Header -->
        <div style="padding:12px 16px;border-bottom:1px solid #2a2a2a;display:flex;align-items:center;gap:10px;">
          <span style="font-family:impact,sans-serif;font-size:15px;letter-spacing:1px;color:#fff;text-transform:uppercase;flex-shrink:0;">GIF</span>
          <div style="flex:1;position:relative;">
            <input
              ref="searchInput"
              v-model="query"
              @input="debouncedSearch"
              type="text"
              :placeholder="configured ? 'Rechercher un GIF…' : 'Coller l\'URL d\'un GIF (Giphy, Tenor…)'"
              style="width:100%;background:#252525;border:1px solid #333;color:#fff;font-family:'Courier New',monospace;font-size:13px;padding:7px 30px 7px 10px;outline:none;transition:border-color 0.15s;"
              class="focus:border-[#e02020]"
            />
            <button
              v-if="query"
              @click="query = ''; if (configured) loadTrending()"
              style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;color:#fff;cursor:pointer;font-size:14px;line-height:1;"
            >×</button>
          </div>
          <button @click="close" style="background:none;border:none;color:#fff;cursor:pointer;font-size:20px;line-height:1;flex-shrink:0;" class="hover:text-[#fff]">×</button>
        </div>

        <!-- Mode : clé API configurée = search Giphy -->
        <template v-if="configured">
          <div style="padding:5px 16px;background:#171717;border-bottom:1px solid #222;display:flex;align-items:center;gap:6px;">
            <span style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;color:#fff;text-transform:uppercase;">Powered by</span>
            <span style="font-family:impact,sans-serif;font-size:12px;color:#fff;letter-spacing:1px;">GIPHY</span>
          </div>

          <div style="flex:1;overflow-y:auto;padding:8px;" class="gif-scroll">
            <div v-if="loading" style="display:flex;justify-content:center;padding:32px;font-family:'Courier New',monospace;font-size:12px;color:#fff;">Recherche…</div>
            <div v-else-if="results.length" style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px;">
              <button
                v-for="gif in results"
                :key="gif.id"
                type="button"
                @click="selectGif(gif)"
                style="aspect-ratio:1;overflow:hidden;background:#111;border:2px solid transparent;padding:0;cursor:pointer;transition:border-color 0.15s;"
                :style="selected?.id === gif.id ? 'border-color:#e02020;' : ''"
                class="hover:border-[#666]"
              >
                <img
                  :src="gif.images.fixed_height_small?.url || gif.images.fixed_height?.url"
                  :alt="gif.title"
                  style="width:100%;height:100%;object-fit:cover;display:block;"
                  loading="lazy"
                />
              </button>
            </div>
            <div v-else-if="!loading" style="text-align:center;padding:32px;font-family:'Courier New',monospace;font-size:12px;color:#fff;">
              {{ query ? `Aucun résultat pour « ${query} »` : 'Tape pour chercher…' }}
            </div>
          </div>

          <div style="padding:10px 16px;border-top:1px solid #2a2a2a;display:flex;align-items:center;gap:12px;">
            <div v-if="selected" style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;">
              <img :src="selected.images.fixed_height_small?.url || selected.images.fixed_height?.url" style="height:36px;object-fit:cover;border:1px solid #333;" />
              <span style="font-family:'Courier New',monospace;font-size:11px;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ selected.title }}</span>
            </div>
            <div v-else style="flex:1;font-family:'Courier New',monospace;font-size:11px;color:#fff;">Sélectionne un GIF</div>
            <button @click="confirmGiphy" :disabled="!selected" class="btn-primary" style="font-size:11px;padding:7px 16px;flex-shrink:0;">Insérer</button>
          </div>
        </template>

        <!-- Mode : pas de clé = coller une URL -->
        <template v-else>
          <div style="padding:14px 16px;background:#171717;border-bottom:1px solid #222;">
            <p style="font-family:'Courier New',monospace;font-size:11px;line-height:1.7;color:#fff;margin-bottom:8px;">
              Recherche un GIF sur
              <a href="https://giphy.com" target="_blank" rel="noopener" style="color:#e02020;text-decoration:none;">giphy.com</a>
              ou
              <a href="https://tenor.com" target="_blank" rel="noopener" style="color:#e02020;text-decoration:none;">tenor.com</a>,
              puis colle son URL directe (.gif) ci-dessus.
            </p>
            <p style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1px;color:#fff;">Sur Giphy : clic droit sur le GIF → « Copier l'adresse de l'image »</p>
          </div>

          <div style="flex:1;padding:16px;display:flex;flex-direction:column;gap:12px;">
            <!-- Aperçu URL collée -->
            <div v-if="urlPreviewOk" style="background:#111;border:1px solid #2a2a2a;padding:8px;display:flex;justify-content:center;">
              <img :src="query" style="max-height:200px;max-width:100%;object-fit:contain;" />
            </div>
            <div v-else-if="query && !urlPreviewOk" style="font-family:'Courier New',monospace;font-size:11px;color:#fff;text-align:center;padding:16px;">
              URL non reconnue comme image. Assure-toi de copier l'URL directe du GIF (.gif, .webp…)
            </div>
            <div v-else style="font-family:'Courier New',monospace;font-size:11px;color:#fff;text-align:center;padding:24px;">
              Colle une URL dans le champ ci-dessus
            </div>
          </div>

          <div style="padding:10px 16px;border-top:1px solid #2a2a2a;display:flex;justify-content:flex-end;">
            <button @click="confirmUrl" :disabled="!urlPreviewOk" class="btn-primary" style="font-size:11px;padding:7px 16px;">Insérer</button>
          </div>
        </template>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
const emit = defineEmits(['select'])

const open = ref(false)
const query = ref('')
const results = ref([])
const loading = ref(false)
const selected = ref(null)
const configured = ref(false)
const urlPreviewOk = ref(false)
const searchInput = ref(null)

const config = useRuntimeConfig()
const base = config.public.apiBase

let debounceTimer = null

// Vérifie si l'URL collée pointe bien vers une image
watch(query, (val) => {
  if (!configured.value) {
    urlPreviewOk.value = /\.(gif|webp|png|jpg|jpeg)(\?.*)?$/i.test(val.trim()) && val.startsWith('http')
  }
})

function debouncedSearch() {
  if (!configured.value) return
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    if (query.value.trim()) search()
    else loadTrending()
  }, 350)
}

async function search() {
  loading.value = true
  selected.value = null
  try {
    const data = await $fetch(`${base}/guides/giphy?q=${encodeURIComponent(query.value)}`)
    results.value = data.data || []
  } catch {
    results.value = []
  } finally {
    loading.value = false
  }
}

async function loadTrending() {
  loading.value = true
  try {
    const data = await $fetch(`${base}/guides/giphy?q=`)
    configured.value = data.configured !== false
    results.value = data.data || []
  } catch {
    results.value = []
  } finally {
    loading.value = false
  }
}

function selectGif(gif) { selected.value = gif }

function confirmGiphy() {
  if (!selected.value) return
  emit('select', selected.value.images.original?.url || selected.value.images.fixed_height?.url)
  close()
}

function confirmUrl() {
  if (!urlPreviewOk.value) return
  emit('select', query.value.trim())
  close()
}

function close() {
  open.value = false
  selected.value = null
  urlPreviewOk.value = false
}

watch(open, async (v) => {
  if (v) {
    nextTick(() => searchInput.value?.focus())
    // Vérifie si la clé est configurée
    const data = await $fetch(`${base}/guides/giphy?q=`).catch(() => ({ configured: false, data: [] }))
    configured.value = data.configured !== false
    if (configured.value) results.value = data.data || []
  } else {
    results.value = []
    query.value = ''
  }
})
</script>

<style scoped>
.gif-scroll::-webkit-scrollbar { width: 4px; }
.gif-scroll::-webkit-scrollbar-track { background: #111; }
.gif-scroll::-webkit-scrollbar-thumb { background: #333; }
</style>
