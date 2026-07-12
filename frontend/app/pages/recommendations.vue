<template>
  <div>

    <!-- Page header -->
    <div style="border-bottom:1px solid #2a2a2a;">
      <div class="max-w-[1100px] mx-auto px-6 pt-9 pb-0">
        <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:5px;color:#e02020;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:10px;">
          <div style="width:16px;height:2px;background:#e02020;flex-shrink:0;"></div>
          Guides de lecture
        </div>
        <div style="font-family:impact,sans-serif;font-size:52px;letter-spacing:1px;color:#fff;text-transform:uppercase;line-height:1;padding-bottom:18px;">PARCOURS</div>
      </div>
    </div>

    <!-- Intro strip -->
    <div style="border-bottom:1px solid #2a2a2a;background:#111;">
      <div class="max-w-[1100px] mx-auto px-6 py-4">
        <p style="font-family:'Courier New',monospace;font-size:12px;letter-spacing:1px;color:#fff;line-height:1.7;">
          Chaque parcours propose une liste de lecture commentée, une discussion communautaire et des guides liés. Choisissez un personnage pour commencer.
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" style="display:flex;align-items:center;gap:10px;font-family:'Courier New',monospace;font-size:12px;letter-spacing:2px;color:#fff;text-transform:uppercase;padding:80px 24px;">
      <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      Chargement…
    </div>

    <!-- Grid de cartes -->
    <div v-else-if="guides.length" class="max-w-[1100px] mx-auto px-6 py-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style="background:#2a2a2a;">
        <NuxtLink
          v-for="guide in guides"
          :key="guide.slug"
          :to="`/guides/${guide.slug}`"
          style="background:#111;display:flex;flex-direction:column;text-decoration:none;transition:background 0.15s;"
          class="group hover:bg-[#141414]"
        >
          <!-- Image / gradient header -->
          <div style="aspect-ratio:16/7;overflow:hidden;position:relative;background:#1a1a1a;">
            <img
              v-if="guide.imageUrl"
              :src="guide.imageUrl"
              :alt="guide.character"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
            <div v-else style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
              <span style="font-family:impact,sans-serif;font-size:48px;letter-spacing:2px;text-transform:uppercase;color:#1e1e1e;">{{ guide.character[0] }}</span>
            </div>
            <!-- Overlay gradient -->
            <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.1) 60%);"></div>
            <!-- Character name over image -->
            <div style="position:absolute;bottom:0;left:0;right:0;padding:14px 16px;">
              <div style="font-family:impact,sans-serif;font-size:22px;letter-spacing:1px;text-transform:uppercase;color:#fff;line-height:1;">{{ guide.character }}</div>
            </div>
          </div>

          <!-- Content -->
          <div style="padding:16px;flex:1;display:flex;flex-direction:column;gap:12px;">
            <p style="font-family:'Courier New',monospace;font-size:12px;line-height:1.7;color:#fff;flex:1;">{{ guide.teaser }}</p>

            <div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid #1e1e1e;">
              <div style="display:flex;gap:16px;">
                <span style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:#fff;text-transform:uppercase;">
                  <span style="font-family:impact,sans-serif;font-size:14px;letter-spacing:1px;color:#fff;">{{ guide._count.comics }}</span> comics
                </span>
                <span style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:#fff;text-transform:uppercase;">
                  <span style="font-family:impact,sans-serif;font-size:14px;letter-spacing:1px;color:#fff;">{{ guide._count.topics }}</span> discussions
                </span>
              </div>
              <span style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:#e02020;text-transform:uppercase;transition:letter-spacing 0.15s;" class="group-hover:tracking-[3px]">VOIR →</span>
            </div>
          </div>
        </NuxtLink>
      </div>
      <div class="mt-8">
        <AdSlot placement="GUIDES_LIST" />
      </div>
    </div>

    <!-- Vide -->
    <div v-else style="text-align:center;padding:96px 24px;">
      <div style="font-family:impact,sans-serif;font-size:48px;letter-spacing:2px;text-transform:uppercase;color:#1e1e1e;margin-bottom:14px;">AUCUN PARCOURS</div>
      <div style="font-family:'Courier New',monospace;font-size:12px;letter-spacing:3px;color:#fff;text-transform:uppercase;">Les parcours arrivent bientôt.</div>
    </div>

  </div>
</template>

<script setup>
const config = useRuntimeConfig()
const base = config.public.apiBase

const { data, pending } = await useFetch(`${base}/guides`)
const guides = computed(() => data.value || [])
</script>
