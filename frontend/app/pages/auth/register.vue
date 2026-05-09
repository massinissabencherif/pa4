<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:48px 24px;background:#0f0f0f;position:relative;">
    <div style="position:fixed;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,0.055) 1px,transparent 1px);background-size:6px 6px;pointer-events:none;z-index:0;"></div>

    <div style="width:100%;max-width:420px;position:relative;z-index:1;">
      <div class="card">

        <!-- Header -->
        <div style="padding:20px 28px;border-bottom:1px solid #1e1e1e;display:flex;align-items:center;justify-content:space-between;">
          <NuxtLink to="/" class="flex items-center gap-[10px]">
            <div style="width:24px;height:24px;background:#e02020;display:flex;align-items:center;justify-content:center;">
              <span style="font-family:impact,sans-serif;font-size:13px;color:#fff;line-height:1;">C</span>
            </div>
            <span style="font-family:impact,sans-serif;font-size:15px;letter-spacing:4px;color:#fff;text-transform:uppercase;">COMICSTER</span>
          </NuxtLink>
          <span style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:3px;color:#333;">№ 003</span>
        </div>

        <!-- Marketing strip -->
        <div style="padding:20px 28px;border-bottom:1px solid #1e1e1e;">
          <div style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:4px;color:#e02020;text-transform:uppercase;margin-bottom:14px;">Pourquoi Comicster ?</div>
          <div
            v-for="(f, i) in features"
            :key="f.title"
            style="display:flex;gap:14px;padding:12px 0;align-items:flex-start;"
            :style="i < features.length - 1 ? 'border-bottom:1px solid #1a1a1a;' : ''"
          >
            <div style="font-family:impact,sans-serif;font-size:22px;color:#e02020;line-height:1;flex-shrink:0;width:28px;">{{ String(i + 1).padStart(2, '0') }}</div>
            <div>
              <div style="font-family:impact,sans-serif;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#fff;margin-bottom:3px;">{{ f.title }}</div>
              <div style="font-family:'Courier New',monospace;font-size:12px;line-height:1.6;color:#d4d4d4;">{{ f.desc }}</div>
            </div>
          </div>
        </div>

        <!-- Form body -->
        <div style="padding:28px;">
          <h1 style="font-family:impact,sans-serif;font-size:28px;letter-spacing:2px;text-transform:uppercase;color:#fff;margin-bottom:4px;font-weight:normal;">CRÉER UN COMPTE</h1>
          <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;color:#555;text-transform:uppercase;margin-bottom:28px;">Gratuit · Sans carte bancaire</div>

          <form @submit.prevent="submit" class="space-y-5">
            <div>
              <label style="display:block;font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;color:#888;text-transform:uppercase;margin-bottom:8px;">Email</label>
              <input v-model="form.email" type="email" required placeholder="toi@example.com" class="input" />
            </div>

            <div>
              <label style="display:block;font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;color:#888;text-transform:uppercase;margin-bottom:8px;">Nom d'utilisateur</label>
              <input
                v-model="form.username"
                type="text"
                required
                minlength="3"
                placeholder="spider_reader"
                class="input"
                :style="usernameReserved ? 'border-bottom-color:#e02020;' : ''"
              />
              <p v-if="usernameReserved" style="font-family:'Courier New',monospace;font-size:11px;color:#e02020;margin-top:4px;">Ce nom d'utilisateur est réservé.</p>
            </div>

            <div>
              <label style="display:block;font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;color:#888;text-transform:uppercase;margin-bottom:8px;">Mot de passe</label>
              <input v-model="form.password" type="password" required minlength="8" placeholder="Au moins 8 caractères" class="input" />
              <div v-if="form.password.length > 0" style="display:flex;gap:3px;margin-top:6px;">
                <div
                  v-for="i in 4"
                  :key="i"
                  style="height:2px;flex:1;transition:all 0.3s;"
                  :class="i <= passwordStrength ? strengthColor : 'bg-[#1e1e1e]'"
                ></div>
              </div>
            </div>

            <div>
              <label style="display:block;font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;color:#888;text-transform:uppercase;margin-bottom:8px;">Confirmer le mot de passe</label>
              <input
                v-model="form.passwordConfirm"
                type="password"
                required
                placeholder="Répète ton mot de passe"
                class="input"
                :style="passwordMismatch ? 'border-bottom-color:#e02020;' : ''"
              />
              <p v-if="passwordMismatch" style="font-family:'Courier New',monospace;font-size:11px;color:#e02020;margin-top:4px;">Les mots de passe ne correspondent pas.</p>
            </div>

            <div v-if="error" role="alert" style="display:flex;align-items:center;gap:8px;background:rgba(224,32,32,0.08);border:1px solid rgba(224,32,32,0.2);padding:10px 12px;font-family:'Courier New',monospace;font-size:11px;color:#e02020;">
              <span aria-hidden="true">⚠</span> {{ error }}
            </div>

            <button type="submit" :disabled="loading" class="btn-primary" style="width:100%;justify-content:center;margin-top:8px;">
              <span v-if="loading" class="flex items-center gap-2">
                <svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Création…
              </span>
              <span v-else>COMMENCER GRATUITEMENT ▶</span>
            </button>
          </form>
        </div>

        <!-- Footer -->
        <div style="padding:14px 28px;border-top:1px solid #1e1e1e;text-align:center;font-family:'Courier New',monospace;font-size:11px;color:#555;display:flex;align-items:center;justify-content:center;gap:6px;">
          Déjà un compte ?
          <NuxtLink to="/auth/login" style="color:#e02020;text-decoration:none;letter-spacing:1px;">Se connecter →</NuxtLink>
        </div>

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
