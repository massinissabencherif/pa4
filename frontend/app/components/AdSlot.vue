<template>
  <div v-if="status !== 'hidden'" style="border:1px solid #2a2a2a;border-top:2px solid #e02020;">
    <div v-if="ad" style="padding:6px 16px;border-bottom:1px solid #1e1e1e;">
      <span style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:3px;color:#555;text-transform:uppercase;">Publicité</span>
    </div>
    <a
      v-if="ad?.linkUrl"
      :href="ad.linkUrl"
      target="_blank"
      rel="sponsored noopener noreferrer"
      style="display:block;height:160px;overflow:hidden;"
    >
      <img :src="displayImage" :alt="displayAlt" style="width:100%;height:100%;object-fit:cover;object-position:center;display:block;" />
    </a>
    <div v-else style="height:160px;overflow:hidden;">
      <img :src="displayImage" :alt="displayAlt" style="width:100%;height:100%;object-fit:cover;object-position:center;display:block;" />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  placement: { type: String, required: true },
})

const config = useRuntimeConfig()
const base = config.public.apiBase

const DEFAULT_BANNER = '/ads/default-banner.png'

// "generic" tant que la réponse n'est pas arrivée — évite un flash "hidden"
const status = ref('generic')
const ad = ref(null)

const displayImage = computed(() => ad.value?.imageUrl || DEFAULT_BANNER)
const displayAlt = computed(() => ad.value?.altText || 'Comicster')

onMounted(async () => {
  try {
    const res = await $fetch(`${base}/ads`, { query: { placement: props.placement } })
    status.value = res?.status || 'generic'
    ad.value = res?.ad || null
  } catch {
    status.value = 'generic'
    ad.value = null
  }
})
</script>
