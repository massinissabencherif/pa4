<template>
  <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
    <!-- Glow bg -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-red-800/8 rounded-full blur-3xl"></div>
    </div>

    <div class="relative w-full max-w-sm">
      <!-- Header -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-flex items-center gap-2 mb-6 group">
          <div class="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/40">
            <span class="text-white font-black">C</span>
          </div>
        </NuxtLink>
        <h1 class="text-2xl font-bold mb-1">{{ step === '2fa' ? 'Vérification 2FA' : 'Connexion' }}</h1>
        <p class="text-gray-500 text-sm">{{ step === '2fa' ? 'Entre le code de ton application' : 'Bienvenue de retour' }}</p>
      </div>

      <!-- 2FA step -->
      <div v-if="step === '2fa'" class="card p-7">
        <form @submit.prevent="submit2FA" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-2">Code d'authentification</label>
            <input
              v-model="totpCode"
              type="text"
              inputmode="numeric"
              maxlength="6"
              required
              placeholder="000000"
              class="input text-center text-2xl tracking-widest font-mono"
              autofocus
            />
          </div>

          <div v-if="error" class="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
            <span>⚠</span>
            {{ error }}
          </div>

          <button type="submit" :disabled="loading" class="btn-primary w-full justify-center !py-3 text-base mt-2">
            <span v-if="loading">Vérification…</span>
            <span v-else>Vérifier</span>
          </button>
          <button type="button" @click="step = 'credentials'; error = ''" class="w-full text-sm text-gray-500 hover:text-gray-300 transition">
            ← Retour
          </button>
        </form>
      </div>

      <!-- Credentials step -->
      <div v-else class="card p-7">
        <form @submit.prevent="submit" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-2">Email</label>
            <input v-model="form.email" type="email" required placeholder="toi@example.com" class="input" />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-400 mb-2">Mot de passe</label>
            <input v-model="form.password" type="password" required placeholder="••••••••" class="input" />
          </div>

          <!-- Error -->
          <div v-if="error" class="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
            <span>⚠</span>
            {{ error }}
          </div>

          <button type="submit" :disabled="loading" class="btn-primary w-full justify-center !py-3 text-base mt-2">
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Connexion…
            </span>
            <span v-else>Se connecter</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="flex items-center gap-3 my-5">
          <div class="flex-1 h-px bg-white/8"></div>
          <span class="text-xs text-gray-600">ou continuer avec</span>
          <div class="flex-1 h-px bg-white/8"></div>
        </div>

        <!-- OAuth buttons -->
        <div class="grid grid-cols-2 gap-3">
          <a
            :href="`${apiBase}/auth/google`"
            class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm font-medium"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
              <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
              <path fill="#4A90D9" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
              <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/>
            </svg>
            Google
          </a>
          <a
            :href="`${apiBase}/auth/github`"
            class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm font-medium"
          >
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
            GitHub
          </a>
        </div>
      </div>

      <p class="text-center text-sm text-gray-600 mt-5">
        Pas encore de compte ?
        <NuxtLink to="/auth/register" class="text-red-400 hover:text-red-300 font-medium transition">
          S'inscrire
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup>
const config = useRuntimeConfig()
const apiBase = config.public.apiBase
const { login } = useAuth()
const route = useRoute()

const form = reactive({ email: '', password: '' })
const totpCode = ref('')
const error = ref('')
const loading = ref(false)
const step = ref('credentials') // 'credentials' | '2fa'

// Show OAuth error if redirected back with error
onMounted(() => {
  if (route.query.error === 'oauth') {
    error.value = 'Connexion OAuth échouée. Réessaie.'
  }
})

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const result = await login(form.email, form.password)
    if (result?.requires2FA) {
      step.value = '2fa'
      return
    }
    navigateTo('/')
  } catch (e) {
    error.value = e.data?.error || 'Erreur de connexion'
  } finally {
    loading.value = false
  }
}

async function submit2FA() {
  error.value = ''
  loading.value = true
  try {
    await login(form.email, form.password, totpCode.value)
    navigateTo('/')
  } catch (e) {
    error.value = e.data?.error || 'Code invalide'
  } finally {
    loading.value = false
  }
}
</script>
