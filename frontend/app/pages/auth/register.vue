<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-16 bg-[#0a0a0f]">
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-red-800/8 rounded-full blur-3xl"></div>
    </div>

    <div class="relative w-full max-w-4xl flex flex-col lg:flex-row gap-12 items-center">

      <!-- ── Contenu marketing ────────────────────────────────────────── -->
      <div class="flex-1 hidden lg:block">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-red-400 font-medium mb-6">
          <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
          Ton espace comics personnel
        </div>
        <h1 class="text-4xl font-extrabold tracking-tight leading-[1.15] mb-4">
          Suis, note et<br />
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400">
            partage tes comics
          </span>
        </h1>
        <p class="text-gray-400 leading-relaxed mb-8">
          Journal de lecture, avis, listes personnalisées et recommandations.
          Tout ce qu'il te faut pour ne jamais perdre le fil.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div v-for="f in features" :key="f.title" class="card p-4 flex gap-3">
            <span class="text-2xl">{{ f.icon }}</span>
            <div>
              <p class="font-semibold text-sm mb-0.5">{{ f.title }}</p>
              <p class="text-gray-500 text-xs leading-relaxed">{{ f.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Formulaire ───────────────────────────────────────────────── -->
      <div class="w-full max-w-sm" id="form">
        <div class="text-center mb-8">
          <NuxtLink to="/" class="inline-flex items-center gap-2 mb-6">
            <div class="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/40">
              <span class="text-white font-black">C</span>
            </div>
          </NuxtLink>
          <h2 class="text-2xl font-bold mb-1">Créer un compte</h2>
          <p class="text-gray-500 text-sm">Gratuit et sans carte bancaire</p>
        </div>

        <!-- Bouton marketing mobile -->
        <div class="lg:hidden text-center mb-6">
          <p class="text-sm text-gray-400 mb-2">Journal de lecture · Notes & avis · Listes perso</p>
        </div>

        <div class="card p-7">
          <form @submit.prevent="submit" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-2">Email</label>
              <input v-model="form.email" type="email" required placeholder="toi@example.com" class="input" />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-400 mb-2">Nom d'utilisateur</label>
              <input v-model="form.username" type="text" required minlength="3" placeholder="spider_reader" class="input" :class="usernameReserved ? 'border-red-500/60' : ''" />
              <p v-if="usernameReserved" class="text-xs text-red-400 mt-1">Ce nom d'utilisateur est réservé.</p>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-400 mb-2">Mot de passe</label>
              <input v-model="form.password" type="password" required minlength="8" placeholder="Au moins 8 caractères" class="input" />
            </div>

            <div v-if="form.password.length > 0" class="flex gap-1 mt-1 mb-1">
              <div
                v-for="i in 4" :key="i"
                class="h-1 flex-1 rounded-full transition-all duration-300"
                :class="i <= passwordStrength ? strengthColor : 'bg-white/10'"
              ></div>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-400 mb-2">Confirmer le mot de passe</label>
              <input v-model="form.passwordConfirm" type="password" required placeholder="Répète ton mot de passe" class="input" :class="passwordMismatch ? 'border-red-500/60' : ''" />
              <p v-if="passwordMismatch" class="text-xs text-red-400 mt-1">Les mots de passe ne correspondent pas.</p>
            </div>

            <div v-if="error" class="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              <span>⚠</span> {{ error }}
            </div>

            <button type="submit" :disabled="loading" class="btn-primary w-full justify-center !py-3 text-base mt-2">
              <span v-if="loading" class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Création…
              </span>
              <span v-else>Commencer gratuitement</span>
            </button>
          </form>
        </div>

        <p class="text-center text-sm text-gray-600 mt-5">
          Déjà un compte ?
          <NuxtLink to="/auth/login" class="text-red-400 hover:text-red-300 font-medium transition">Se connecter</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: false })
const { register } = useAuth()
const form = reactive({ email: '', username: '', password: '', passwordConfirm: '' })
const error = ref('')
const loading = ref(false)

const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'root', 'superadmin', 'moderator', 'mod',
  'support', 'help', 'api', 'auth', 'login', 'logout', 'register',
  'me', 'users', 'user', 'profile', 'settings', 'dashboard', 'feed',
  'comics', 'comic', 'authors', 'author', 'lists', 'reviews', 'review',
  'stats', 'notifications', 'search', 'legal', 'rgpd', 'mentions-legales',
  'security', 'system', 'null', 'undefined', 'anonymous', 'comicster',
])

const usernameReserved = computed(() => {
  const normalized = form.username.trim().toLowerCase()
  return normalized.length > 0 && RESERVED_USERNAMES.has(normalized)
})

const features = [
  { icon: '📚', title: 'Journal de lecture', desc: 'Marque ce que tu lis, ce que tu as terminé, ce que tu veux lire.' },
  { icon: '⭐', title: 'Notes & avis', desc: 'Donne une note de 1 à 5 étoiles et laisse ton avis sur chaque comic.' },
  { icon: '🗂️', title: 'Listes personnalisées', desc: 'Crée des sélections thématiques et partage-les.' },
  { icon: '💡', title: 'Recommandations', desc: 'Découvre de nouveaux comics basés sur tes goûts.' },
]

const passwordMismatch = computed(() =>
  form.passwordConfirm.length > 0 && form.password !== form.passwordConfirm
)

const passwordStrength = computed(() => {
  const p = form.password
  if (p.length === 0) return 0
  let score = 0
  if (p.length >= 8) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return score
})

const strengthColor = computed(() => {
  if (passwordStrength.value <= 1) return 'bg-red-500'
  if (passwordStrength.value === 2) return 'bg-orange-400'
  if (passwordStrength.value === 3) return 'bg-yellow-400'
  return 'bg-green-500'
})

async function submit() {
  if (form.password !== form.passwordConfirm) {
    error.value = 'Les mots de passe ne correspondent pas.'
    return
  }
  if (usernameReserved.value) {
    error.value = "Ce nom d'utilisateur est réservé."
    return
  }
  error.value = ''
  loading.value = true
  try {
    await register(form.email, form.username, form.password)
    navigateTo('/feed')
  } catch (e) {
    error.value = e.data?.error || 'Erreur lors de la création du compte'
  } finally {
    loading.value = false
  }
}
</script>
