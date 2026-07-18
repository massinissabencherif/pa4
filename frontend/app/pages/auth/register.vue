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
          <span style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;color:#fff;">№ 003</span>
        </div>

        <!-- Marketing strip -->
        <div style="padding:20px 28px;border-bottom:1px solid #1e1e1e;">
          <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;color:#e02020;text-transform:uppercase;margin-bottom:14px;">Pourquoi Comicster ?</div>
          <div
            v-for="(f, i) in features"
            :key="f.title"
            style="display:flex;gap:14px;padding:12px 0;align-items:flex-start;"
            :style="i < features.length - 1 ? 'border-bottom:1px solid #1a1a1a;' : ''"
          >
            <div style="font-family:impact,sans-serif;font-size:22px;color:#e02020;line-height:1;flex-shrink:0;width:28px;">{{ String(i + 1).padStart(2, '0') }}</div>
            <div>
              <div style="font-family:impact,sans-serif;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#fff;margin-bottom:3px;">{{ f.title }}</div>
              <div style="font-family:'Courier New',monospace;font-size:13px;line-height:1.6;color:#fff;">{{ f.desc }}</div>
            </div>
          </div>
        </div>

        <!-- Form body -->
        <div style="padding:28px;">
          <h1 style="font-family:impact,sans-serif;font-size:28px;letter-spacing:2px;text-transform:uppercase;color:#fff;margin-bottom:4px;font-weight:normal;">CRÉER UN COMPTE</h1>
          <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:3px;color:#fff;text-transform:uppercase;margin-bottom:28px;">Gratuit · Sans carte bancaire</div>

          <form @submit.prevent="submit" class="space-y-5">
            <div>
              <label style="display:block;font-family:'Courier New',monospace;font-size:10px;letter-spacing:4px;color:#fff;text-transform:uppercase;margin-bottom:8px;">Email</label>
              <input v-model="form.email" type="email" required placeholder="toi@example.com" class="input" />
            </div>

            <div>
              <label style="display:block;font-family:'Courier New',monospace;font-size:10px;letter-spacing:4px;color:#fff;text-transform:uppercase;margin-bottom:8px;">Nom d'utilisateur</label>
              <input
                v-model="form.username"
                type="text"
                required
                minlength="3"
                placeholder="spider_reader"
                class="input"
                :style="usernameReserved ? 'border-bottom-color:#e02020;' : ''"
              />
              <p v-if="usernameReserved" style="font-family:'Courier New',monospace;font-size:12px;color:#e02020;margin-top:4px;">Ce nom d'utilisateur est réservé.</p>
            </div>

            <div>
              <label style="display:block;font-family:'Courier New',monospace;font-size:10px;letter-spacing:4px;color:#fff;text-transform:uppercase;margin-bottom:8px;">Mot de passe</label>
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
              <label style="display:block;font-family:'Courier New',monospace;font-size:10px;letter-spacing:4px;color:#fff;text-transform:uppercase;margin-bottom:8px;">Confirmer le mot de passe</label>
              <input
                v-model="form.passwordConfirm"
                type="password"
                required
                placeholder="Répète ton mot de passe"
                class="input"
                :style="passwordMismatch ? 'border-bottom-color:#e02020;' : ''"
              />
              <p v-if="passwordMismatch" style="font-family:'Courier New',monospace;font-size:12px;color:#e02020;margin-top:4px;">Les mots de passe ne correspondent pas.</p>
            </div>

            <div v-if="error" role="alert" style="display:flex;align-items:center;gap:8px;background:rgba(224,32,32,0.08);border:1px solid rgba(224,32,32,0.2);padding:10px 12px;font-family:'Courier New',monospace;font-size:12px;color:#e02020;">
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

          <!-- Divider -->
          <div class="flex items-center gap-3 my-6">
            <div style="flex:1;height:1px;background:#1e1e1e;"></div>
            <span style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;color:#fff;text-transform:uppercase;">ou</span>
            <div style="flex:1;height:1px;background:#1e1e1e;"></div>
          </div>

          <!-- OAuth -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <a :href="`${apiBase}/auth/google`" aria-label="S'inscrire avec Google" class="btn-oauth">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
                <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
                <path fill="#4A90D9" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
                <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/>
              </svg>
              Google
            </a>
            <a :href="`${apiBase}/auth/github`" aria-label="S'inscrire avec GitHub" class="btn-oauth">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
              GitHub
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding:14px 28px;border-top:1px solid #1e1e1e;text-align:center;font-family:'Courier New',monospace;font-size:12px;color:#fff;display:flex;align-items:center;justify-content:center;gap:6px;">
          Déjà un compte ?
          <NuxtLink to="/auth/login" style="color:#e02020;text-decoration:none;letter-spacing:1px;">Se connecter →</NuxtLink>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: false })
const config = useRuntimeConfig()
const apiBase = config.public.apiBase
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
