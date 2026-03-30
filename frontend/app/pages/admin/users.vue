<template>
  <div class="min-h-screen px-4 sm:px-6 py-12">
    <div class="max-w-4xl mx-auto">

      <div class="flex items-center justify-between mb-10">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs text-red-400 mb-3">
            🛡 Super Admin
          </div>
          <h1 class="text-3xl font-bold">Gestion des utilisateurs</h1>
          <p class="text-gray-500 text-sm mt-1">Promouvoir ou rétrograder des comptes en administrateur.</p>
        </div>
        <NuxtLink to="/admin" class="btn-secondary text-sm">← Dashboard</NuxtLink>
      </div>

      <div v-if="error" class="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 mb-6">
        ⚠ {{ error }}
      </div>

      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-white/5 text-xs text-gray-500 uppercase tracking-wider">
              <th class="text-left px-5 py-3">Utilisateur</th>
              <th class="text-left px-5 py-3">Email</th>
              <th class="text-left px-5 py-3">Rôle</th>
              <th class="text-left px-5 py-3">2FA</th>
              <th class="text-right px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="u in users"
              :key="u.id"
              class="border-b border-white/5 last:border-0 hover:bg-white/2 transition"
            >
              <td class="px-5 py-3 font-medium">{{ u.username }}</td>
              <td class="px-5 py-3 text-gray-400">{{ u.email }}</td>
              <td class="px-5 py-3">
                <span
                  :class="{
                    'bg-red-500/15 text-red-400 border-red-500/20': u.role === 'SUPER_ADMIN',
                    'bg-amber-500/15 text-amber-400 border-amber-500/20': u.role === 'ADMIN',
                    'bg-gray-500/15 text-gray-400 border-gray-500/20': u.role === 'USER',
                  }"
                  class="text-xs font-medium px-2 py-0.5 rounded-full border"
                >
                  {{ u.role }}
                </span>
              </td>
              <td class="px-5 py-3">
                <span
                  :class="u.totpEnabled ? 'text-green-400' : 'text-gray-600'"
                  class="text-xs"
                >
                  {{ u.totpEnabled ? '✓ Activée' : '✗ Désactivée' }}
                </span>
              </td>
              <td class="px-5 py-3 text-right">
                <button
                  v-if="u.role === 'USER'"
                  @click="setRole(u, 'ADMIN')"
                  :disabled="loadingId === u.id"
                  class="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition disabled:opacity-50"
                >
                  Promouvoir admin
                </button>
                <button
                  v-else-if="u.role === 'ADMIN'"
                  @click="setRole(u, 'USER')"
                  :disabled="loadingId === u.id"
                  class="text-xs px-3 py-1.5 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 border border-gray-500/20 transition disabled:opacity-50"
                >
                  Rétrograder
                </button>
                <span v-else class="text-xs text-gray-600">—</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="loading && users.length === 0" class="py-16 text-center text-gray-600 text-sm">
          Chargement…
        </div>
        <div v-else-if="!loading && users.length === 0" class="py-16 text-center text-gray-600 text-sm">
          Aucun utilisateur trouvé.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'admin' })

const config = useRuntimeConfig()
const base = config.public.apiBase
const { token } = useAuth()

const users = ref([])
const loading = ref(true)
const loadingId = ref(null)
const error = ref('')

async function fetchUsers() {
  loading.value = true
  error.value = ''
  try {
    users.value = await $fetch(`${base}/admin/users`, {
      headers: { Authorization: `Bearer ${token.value}` },
    })
  } catch (e) {
    error.value = e.data?.error || 'Erreur lors du chargement des utilisateurs'
  } finally {
    loading.value = false
  }
}

async function setRole(u, role) {
  loadingId.value = u.id
  error.value = ''
  try {
    const updated = await $fetch(`${base}/admin/users/${u.id}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token.value}` },
      body: { role },
    })
    const idx = users.value.findIndex(x => x.id === u.id)
    if (idx !== -1) users.value[idx] = { ...users.value[idx], ...updated }
  } catch (e) {
    error.value = e.data?.error || 'Erreur lors de la mise à jour du rôle'
  } finally {
    loadingId.value = null
  }
}

onMounted(fetchUsers)
</script>
