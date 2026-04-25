<template>
  <button
    @click="goBack"
    class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition mb-6"
    :aria-label="label"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
    </svg>
    <span v-if="!compact">{{ label }}</span>
  </button>
</template>

<script setup>
const props = defineProps({
  to:      { type: String, default: '/feed' },
  label:   { type: String, default: 'Retour' },
  compact: { type: Boolean, default: false },
})

const router = useRouter()

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    router.back()
  } else {
    navigateTo(props.to)
  }
}
</script>
