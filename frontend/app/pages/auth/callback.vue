<template>
  <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center">
    <div class="text-center space-y-4">
      <div class="w-12 h-12 mx-auto border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
      <p class="text-gray-400 text-sm">Connexion en cours…</p>
      <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const { exchangeOAuthCode } = useAuth()
const error = ref('')

onMounted(async () => {
  const { code, error: oauthError } = route.query

  if (oauthError || !code) {
    error.value = 'Authentification OAuth échouée. Veuillez réessayer.'
    setTimeout(() => navigateTo('/auth/login'), 3000)
    return
  }

  try {
    // Échange le code one-time contre des tokens — pas de token dans l'URL
    await exchangeOAuthCode(code)
    navigateTo('/')
  } catch {
    error.value = 'Erreur lors de la connexion OAuth.'
    setTimeout(() => navigateTo('/auth/login'), 3000)
  }
})
</script>
