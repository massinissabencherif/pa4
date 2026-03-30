<template>
  <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
    <div class="relative w-full max-w-sm">

      <div class="text-center mb-8">
        <div class="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-900/40">
          <span class="text-white text-xl">🛡</span>
        </div>
        <h1 class="text-2xl font-bold mb-1">Setup Super Admin</h1>
        <p class="text-gray-500 text-sm">Promouvoir ton compte en super administrateur.<br>Nécessite qu'aucun admin n'existe encore.</p>
      </div>

      <div class="card p-7">
        <div v-if="!isLoggedIn" class="text-center text-sm text-gray-400">
          <p class="mb-4">Tu dois être connecté pour effectuer cette action.</p>
          <NuxtLink to="/auth/login" class="btn-primary w-full justify-center block text-center">Se connecter</NuxtLink>
        </div>

        <div v-else-if="done" class="text-center">
          <div class="text-4xl mb-3">✅</div>
          <p class="font-semibold text-green-400 mb-1">Compte promu super administrateur</p>
          <p class="text-sm text-gray-500 mb-5">Configure maintenant ta 2FA pour accéder au dashboard.</p>
          <NuxtLink to="/settings/security" class="btn-primary w-full justify-center block text-center">Configurer la 2FA</NuxtLink>
        </div>

        <div v-else>
          <p class="text-sm text-gray-400 mb-5">
            Connecté en tant que <span class="text-white font-medium">{{ user?.username }}</span>.<br>
            Clique pour promouvoir ce compte en super administrateur.
          </p>

          <div v-if="error" class="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 mb-4">
            ⚠ {{ error }}
          </div>

          <button
            @click="setup"
            :disabled="loading"
            class="btn-primary w-full justify-center disabled:opacity-50"
          >
            {{ loading ? 'En cours…' : 'Devenir administrateur' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const config = useRuntimeConfig()
const base = config.public.apiBase
const { isLoggedIn, user, token } = useAuth()

const loading = ref(false)
const done = ref(false)
const error = ref('')

async function setup() {
  loading.value = true
  error.value = ''
  try {
    await $fetch(`${base}/admin/setup`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
    })
    done.value = true
  } catch (e) {
    error.value = e.data?.error || 'Erreur'
  } finally {
    loading.value = false
  }
}
</script>
