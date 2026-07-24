<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70"
      @click.self="$emit('close')"
    >
      <div class="card p-6 w-full max-w-sm">
        <h3 class="font-semibold mb-4">Signaler ce contenu</h3>

        <div v-if="submitted" class="text-sm text-green-400">
          Signalement envoyé. Merci, un modérateur va l'examiner.
        </div>

        <template v-else>
          <div class="space-y-2 mb-4">
            <label
              v-for="opt in REASONS"
              :key="opt.value"
              class="flex items-center gap-2 text-sm text-white cursor-pointer"
            >
              <input v-model="reason" type="radio" name="report-reason" :value="opt.value" class="accent-red-500" />
              {{ opt.label }}
            </label>
          </div>

          <textarea
            v-if="reason === 'AUTRE'"
            v-model="details"
            rows="3"
            maxlength="500"
            placeholder="Précise le motif…"
            class="input resize-none mb-4 text-sm"
          />

          <p v-if="error" class="text-[13px] text-red-400 mb-3">{{ error }}</p>

          <div class="flex gap-3">
            <button
              @click="submit"
              :disabled="!reason || loading"
              class="btn-primary !py-2 !px-4 text-sm disabled:opacity-40"
            >
              {{ loading ? '…' : 'Signaler' }}
            </button>
            <button @click="$emit('close')" class="text-sm text-white hover:text-white transition">Annuler</button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  targetType: { type: String, required: true }, // REVIEW | COMMENT | GUIDE_TOPIC | GUIDE_REPLY
  targetId: { type: String, required: true },
})
const emit = defineEmits(['close', 'reported'])

const config = useRuntimeConfig()
const base = config.public.apiBase
const { token } = useAuth()

const REASONS = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'HATE', label: 'Propos haineux' },
  { value: 'NSFW', label: 'Contenu inapproprié (NSFW)' },
  { value: 'HARCELEMENT', label: 'Harcèlement' },
  { value: 'AUTRE', label: 'Autre' },
]

const reason = ref('')
const details = ref('')
const loading = ref(false)
const error = ref('')
const submitted = ref(false)

async function submit() {
  if (!reason.value || loading.value) return
  loading.value = true
  error.value = ''
  try {
    await $fetch(`${base}/reports`, {
      method: 'POST',
      body: {
        targetType: props.targetType,
        targetId: props.targetId,
        reason: reason.value,
        details: details.value.trim() || undefined,
      },
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
    })
    submitted.value = true
    emit('reported')
    setTimeout(() => emit('close'), 1500)
  } catch (e) {
    error.value = e.data?.error || 'Erreur lors du signalement'
  } finally {
    loading.value = false
  }
}
</script>
