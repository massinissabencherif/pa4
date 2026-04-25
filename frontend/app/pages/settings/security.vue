<template>
  <div class="max-w-2xl mx-auto px-4 py-10 space-y-8">
    <BackButton to="/dashboard" label="Tableau de bord" />
    <div>
      <h1 class="text-2xl font-bold">Sécurité</h1>
      <p class="text-gray-500 text-sm mt-1">Gérer la double authentification de ton compte.</p>
    </div>

    <!-- 2FA Card -->
    <div class="card p-6 space-y-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="font-semibold">Double authentification (2FA)</h2>
          <p class="text-sm text-gray-500 mt-1">Ajoute une couche de sécurité avec une application comme Google Authenticator ou Authy.</p>
        </div>
        <span
          :class="totpEnabled ? 'bg-green-500/15 text-green-400 border-green-500/20' : 'bg-gray-500/15 text-gray-400 border-gray-500/20'"
          class="text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap"
        >
          {{ totpEnabled ? 'Activé' : 'Désactivé' }}
        </span>
      </div>

      <!-- Step 1: Enable — show QR -->
      <div v-if="!totpEnabled && step === 'idle'">
        <button @click="startEnable" :disabled="loading" class="btn-primary">
          Activer la 2FA
        </button>
      </div>

      <div v-if="step === 'setup'" class="space-y-5">
        <p class="text-sm text-gray-400">
          Scanne ce QR code avec ton application d'authentification, puis entre le code à 6 chiffres pour confirmer.
        </p>
        <div class="flex justify-center">
          <img :src="qrCode" alt="QR Code 2FA" class="w-48 h-48 rounded-xl bg-white p-2" />
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">Clé manuelle (si le scan ne fonctionne pas)</p>
          <code class="text-xs font-mono bg-white/5 rounded px-2 py-1 select-all">{{ secret }}</code>
        </div>
        <form @submit.prevent="verifyAndActivate" class="space-y-3">
          <input
            v-model="verifyCode"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="Code à 6 chiffres"
            class="input text-center font-mono tracking-widest text-lg"
            autofocus
          />
          <div v-if="error" class="text-sm text-red-400">{{ error }}</div>
          <div class="flex gap-3">
            <button type="submit" :disabled="loading || verifyCode.length !== 6" class="btn-primary flex-1">
              {{ loading ? 'Vérification…' : 'Confirmer' }}
            </button>
            <button type="button" @click="cancelSetup" class="px-4 py-2 rounded-xl border border-white/10 text-sm text-gray-400 hover:bg-white/5 transition">
              Annuler
            </button>
          </div>
        </form>
      </div>

      <!-- Disable 2FA -->
      <div v-if="totpEnabled && step === 'idle'" class="space-y-3">
        <div v-if="!showDisableForm">
          <button @click="showDisableForm = true" class="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition text-sm">
            Désactiver la 2FA
          </button>
        </div>
        <form v-else @submit.prevent="disable2FA" class="space-y-3">
          <p class="text-sm text-gray-400">Entre un code valide pour désactiver la 2FA.</p>
          <input
            v-model="disableCode"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="Code à 6 chiffres"
            class="input text-center font-mono tracking-widest text-lg"
            autofocus
          />
          <div v-if="error" class="text-sm text-red-400">{{ error }}</div>
          <div class="flex gap-3">
            <button type="submit" :disabled="loading || disableCode.length !== 6" class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 transition text-white text-sm font-medium flex-1">
              {{ loading ? 'Désactivation…' : 'Désactiver' }}
            </button>
            <button type="button" @click="showDisableForm = false; error = ''" class="px-4 py-2 rounded-xl border border-white/10 text-sm text-gray-400 hover:bg-white/5 transition">
              Annuler
            </button>
          </div>
        </form>
      </div>

      <!-- Success -->
      <div v-if="step === 'done'" class="flex items-center gap-2 text-green-400 text-sm">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        2FA activé avec succès !
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

const config = useRuntimeConfig()
const base = config.public.apiBase
const { token, user, fetchMe } = useAuth()

const totpEnabled = computed(() => user.value?.totpEnabled ?? false)
const step = ref('idle') // idle | setup | done
const qrCode = ref('')
const secret = ref('')
const verifyCode = ref('')
const disableCode = ref('')
const loading = ref(false)
const error = ref('')
const showDisableForm = ref(false)

async function startEnable() {
  loading.value = true
  error.value = ''
  try {
    const data = await $fetch(`${base}/auth/2fa/enable`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
    })
    qrCode.value = data.qrCode
    secret.value = data.secret
    step.value = 'setup'
  } catch (e) {
    error.value = e.data?.error || 'Erreur'
  } finally {
    loading.value = false
  }
}

async function verifyAndActivate() {
  loading.value = true
  error.value = ''
  try {
    await $fetch(`${base}/auth/2fa/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
      body: { code: verifyCode.value },
    })
    step.value = 'done'
    await fetchMe()
    setTimeout(() => { step.value = 'idle' }, 3000)
  } catch (e) {
    error.value = e.data?.error || 'Code invalide'
  } finally {
    loading.value = false
  }
}

async function disable2FA() {
  loading.value = true
  error.value = ''
  try {
    await $fetch(`${base}/auth/2fa/disable`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
      body: { code: disableCode.value },
    })
    showDisableForm.value = false
    disableCode.value = ''
    await fetchMe()
  } catch (e) {
    error.value = e.data?.error || 'Code invalide'
  } finally {
    loading.value = false
  }
}

function cancelSetup() {
  step.value = 'idle'
  qrCode.value = ''
  secret.value = ''
  verifyCode.value = ''
  error.value = ''
}

onMounted(fetchMe)
</script>
