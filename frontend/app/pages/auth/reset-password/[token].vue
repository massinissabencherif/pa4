<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:48px 24px;background:#0f0f0f;position:relative;">
    <div style="position:fixed;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,0.055) 1px,transparent 1px);background-size:6px 6px;pointer-events:none;z-index:0;"></div>

    <div style="width:100%;max-width:380px;position:relative;z-index:1;">
      <div class="card">

        <!-- Header -->
        <div style="padding:20px 28px;border-bottom:1px solid #1e1e1e;display:flex;align-items:center;justify-content:space-between;">
          <NuxtLink to="/" class="flex items-center gap-[10px]">
            <div style="width:24px;height:24px;background:#e02020;display:flex;align-items:center;justify-content:center;">
              <span style="font-family:impact,sans-serif;font-size:13px;color:#fff;line-height:1;">C</span>
            </div>
            <span style="font-family:impact,sans-serif;font-size:15px;letter-spacing:4px;color:#fff;text-transform:uppercase;">COMICSTER</span>
          </NuxtLink>
          <span style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:3px;color:#333;">№ 002</span>
        </div>

        <!-- Body -->
        <div style="padding:28px;">
          <template v-if="done">
            <h1 style="font-family:impact,sans-serif;font-size:24px;letter-spacing:2px;text-transform:uppercase;color:#fff;margin-bottom:4px;font-weight:normal;">MOT DE PASSE RÉINITIALISÉ</h1>
            <p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:1px;color:#888;line-height:1.6;margin:16px 0 24px;">
              Ton mot de passe a bien été changé. Tes anciennes sessions ont été déconnectées.
            </p>
            <NuxtLink to="/auth/login" class="btn-primary" style="width:100%;justify-content:center;display:flex;">SE CONNECTER ▶</NuxtLink>
          </template>

          <template v-else>
            <h1 style="font-family:impact,sans-serif;font-size:28px;letter-spacing:2px;text-transform:uppercase;color:#fff;margin-bottom:4px;font-weight:normal;">NOUVEAU MOT DE PASSE</h1>
            <p style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;color:#555;text-transform:uppercase;margin-bottom:28px;">Choisis un mot de passe solide</p>

            <form @submit.prevent="submit" class="space-y-5" aria-label="Réinitialisation du mot de passe">
              <div>
                <label style="display:block;font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;color:#888;text-transform:uppercase;margin-bottom:8px;">Nouveau mot de passe</label>
                <input v-model="form.password" type="password" required minlength="8" placeholder="Au moins 8 caractères" class="input" autofocus />
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

              <button type="submit" :disabled="loading" class="btn-primary" style="width:100%;justify-content:center;">
                <span v-if="loading">Réinitialisation…</span>
                <span v-else>RÉINITIALISER ▶</span>
              </button>
            </form>
          </template>
        </div>

        <!-- Footer -->
        <div style="padding:14px 28px;border-top:1px solid #1e1e1e;text-align:center;font-family:'Courier New',monospace;font-size:11px;color:#555;">
          <NuxtLink to="/auth/login" style="color:#e02020;text-decoration:none;letter-spacing:1px;">← Retour à la connexion</NuxtLink>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: false })

const route = useRoute()
const { resetPassword } = useAuth()

const form = reactive({ password: '', passwordConfirm: '' })
const error = ref('')
const loading = ref(false)
const done = ref(false)

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
  error.value = ''
  loading.value = true
  try {
    await resetPassword(route.params.token, form.password)
    done.value = true
  } catch (e) {
    error.value = e.data?.error || 'Lien invalide ou expiré. Redemande une réinitialisation.'
  } finally {
    loading.value = false
  }
}
</script>
