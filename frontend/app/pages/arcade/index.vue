<template>
  <div>

    <!-- Page header -->
    <div style="border-bottom:1px solid #2a2a2a;">
      <div class="max-w-[1100px] mx-auto px-6 pt-9 pb-0">
        <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:5px;color:#e02020;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:10px;">
          <div style="width:16px;height:2px;background:#e02020;flex-shrink:0;"></div>
          Mini-jeux · Générés depuis le catalogue
        </div>
        <div class="flex items-end justify-between flex-wrap gap-4" style="padding-bottom:18px;">
          <div style="font-family:impact,sans-serif;font-size:52px;letter-spacing:1px;color:#fff;text-transform:uppercase;line-height:1;">ARCADE</div>
          <div v-if="profile" style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:3px;color:#fff;text-transform:uppercase;padding-bottom:6px;">
            <span style="color:#e02020;font-family:impact,sans-serif;font-size:20px;letter-spacing:1px;">{{ profile.xp }}</span> XP
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-[1100px] mx-auto px-6 py-10">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-px" style="background:#2a2a2a;">

        <!-- Comicdle -->
        <NuxtLink to="/arcade/comicdle" class="group block" style="background:#111;padding:32px 28px;text-decoration:none;position:relative;">
          <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;color:#e02020;text-transform:uppercase;margin-bottom:14px;">Défi du jour</div>
          <div style="font-family:impact,sans-serif;font-size:34px;letter-spacing:1px;color:#fff;text-transform:uppercase;line-height:1;" class="group-hover:text-[#e02020] transition-colors">COMICDLE</div>
          <p style="font-family:'Courier New',monospace;font-size:12px;line-height:1.7;color:#999;margin-top:14px;">
            Un comic mystère par jour, le même pour tout le monde. Propose des titres :
            chaque essai révèle genre, éditeur, année et auteur. Six essais pour trouver.
          </p>
          <div class="flex items-center justify-between" style="margin-top:22px;">
            <span style="font-family:impact,sans-serif;font-size:12px;letter-spacing:3px;color:#e02020;text-transform:uppercase;">Jouer →</span>
            <span v-if="profile?.today?.COMICDLE" style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:#22c55e;text-transform:uppercase;">
              ✓ Joué aujourd'hui
            </span>
          </div>
        </NuxtLink>

        <!-- Cover Mystère -->
        <NuxtLink to="/arcade/cover-mystery" class="group block" style="background:#111;padding:32px 28px;text-decoration:none;position:relative;">
          <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;color:#e02020;text-transform:uppercase;margin-bottom:14px;">Défi du jour · Mode infini</div>
          <div style="font-family:impact,sans-serif;font-size:34px;letter-spacing:1px;color:#fff;text-transform:uppercase;line-height:1;" class="group-hover:text-[#e02020] transition-colors">COVER MYSTÈRE</div>
          <p style="font-family:'Courier New',monospace;font-size:12px;line-height:1.7;color:#999;margin-top:14px;">
            Une couverture pixelisée qui se révèle peu à peu, quatre titres proposés.
            Plus tu réponds vite, plus tu marques de points.
          </p>
          <div class="flex items-center justify-between" style="margin-top:22px;">
            <span style="font-family:impact,sans-serif;font-size:12px;letter-spacing:3px;color:#e02020;text-transform:uppercase;">Jouer →</span>
            <span v-if="profile?.today?.COVER_MYSTERY" style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:#22c55e;text-transform:uppercase;">
              ✓ Joué aujourd'hui
            </span>
          </div>
        </NuxtLink>

      </div>

      <p style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:#555;text-transform:uppercase;margin-top:24px;">
        Chaque partie rapporte des XP. Les comics croisés en jeu peuvent être ajoutés à ta liste de lecture.
      </p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

const config = useRuntimeConfig()
const base = config.public.apiBase
const { token } = useAuth()

const { data: profile } = await useFetch(`${base}/arcade/me`, {
  headers: computed(() => ({ Authorization: `Bearer ${token.value}` })),
})
</script>
