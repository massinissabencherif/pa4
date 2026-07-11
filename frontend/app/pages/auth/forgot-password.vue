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
          <template v-if="sent">
            <h1 style="font-family:impact,sans-serif;font-size:24px;letter-spacing:2px;text-transform:uppercase;color:#fff;margin-bottom:4px;font-weight:normal;">VÉRIFIE TA BOÎTE MAIL</h1>
            <p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:1px;color:#888;line-height:1.6;margin-top:16px;">
              Si un compte existe pour <strong style="color:#fff;">{{ form.email }}</strong>, un email avec les instructions de réinitialisation vient d'être envoyé. Le lien expire dans 1 heure.
            </p>
          </template>

          <template v-else>
            <h1 style="font-family:impact,sans-serif;font-size:28px;letter-spacing:2px;text-transform:uppercase;color:#fff;margin-bottom:4px;font-weight:normal;">MOT DE PASSE OUBLIÉ</h1>
            <p style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;color:#555;text-transform:uppercase;margin-bottom:28px;">On t'envoie un lien de réinitialisation</p>

            <form @submit.prevent="submit" aria-label="Demande de réinitialisation">
              <div style="margin-bottom:20px;">
                <label for="forgot-email" style="display:block;font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;color:#888;text-transform:uppercase;margin-bottom:8px;">Email</label>
                <input id="forgot-email" v-model="form.email" type="email" required placeholder="toi@example.com" class="input" autocomplete="email" autofocus />
              </div>

              <div v-if="error" role="alert" style="display:flex;align-items:center;gap:8px;background:rgba(224,32,32,0.08);border:1px solid rgba(224,32,32,0.2);padding:10px 12px;font-family:'Courier New',monospace;font-size:11px;color:#e02020;margin-bottom:16px;">
                <span aria-hidden="true">⚠</span>{{ error }}
              </div>

              <button type="submit" :disabled="loading" class="btn-primary" style="width:100%;justify-content:center;">
                <span v-if="loading">Envoi…</span>
                <span v-else>ENVOYER LE LIEN ▶</span>
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

const { forgotPassword } = useAuth()

const form = reactive({ email: '' })
const error = ref('')
const loading = ref(false)
const sent = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await forgotPassword(form.email)
    sent.value = true
  } catch (e) {
    error.value = e.data?.error || 'Erreur, réessaie plus tard'
  } finally {
    loading.value = false
  }
}
</script>
