<template>
  <div v-if="ad" style="border:1px solid #2a2a2a;border-top:2px solid #e02020;">
    <div style="padding:6px 16px;border-bottom:1px solid #1e1e1e;">
      <span style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:3px;color:#555;text-transform:uppercase;">Publicité</span>
    </div>
    <a
      v-if="ad.linkUrl"
      :href="ad.linkUrl"
      target="_blank"
      rel="sponsored noopener noreferrer"
      style="display:block;height:160px;overflow:hidden;"
    >
      <img :src="ad.imageUrl" :alt="ad.altText" style="width:100%;height:100%;object-fit:cover;object-position:center;display:block;" />
    </a>
    <div v-else style="height:160px;overflow:hidden;">
      <img :src="ad.imageUrl" :alt="ad.altText" style="width:100%;height:100%;object-fit:cover;object-position:center;display:block;" />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  placement: { type: String, required: true },
})

const config = useRuntimeConfig()
const base = config.public.apiBase

const ad = ref(null)

onMounted(async () => {
  try {
    const res = await $fetch(`${base}/ads`, { query: { placement: props.placement } })
    ad.value = res?.ad || null
  } catch {
    ad.value = null
  }
})
</script>
