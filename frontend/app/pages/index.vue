<template>
  <div>

    <!-- Hero -->
    <section style="border-bottom:1px solid #1e1e1e;">
      <div
        class="max-w-[1100px] mx-auto px-6 py-20"
        style="display:grid;grid-template-columns:1fr 420px;gap:48px;align-items:center;min-height:86vh;"
      >

        <!-- Left -->
        <div>
          <div class="flex items-center gap-[10px] mb-5" style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:5px;color:#e02020;text-transform:uppercase;">
            <div style="width:20px;height:2px;background:#e02020;flex-shrink:0;"></div>
            Ton journal de comics
          </div>

          <h1 style="font-family:impact,sans-serif;font-size:clamp(48px,6vw,72px);line-height:0.9;color:#fff;text-transform:uppercase;letter-spacing:0;margin-bottom:24px;">
            SUIS.<br>
            <span style="-webkit-text-stroke:1px rgba(255,255,255,0.2);color:transparent;display:block;">NOTE.</span>
            PARTAGE.
          </h1>

          <p style="font-family:'Courier New',monospace;font-size:15px;line-height:1.9;color:#d4d4d4;max-width:460px;margin-bottom:32px;">
            Journal de lecture, avis, listes personnalisées.<br>
            Tout ce qu'il te faut pour ne jamais perdre le fil.
          </p>

          <div class="flex flex-wrap gap-3">
            <NuxtLink to="/auth/register" class="btn-primary">COMMENCER ▶</NuxtLink>
            <NuxtLink to="/auth/login" class="btn-ghost">SE CONNECTER_</NuxtLink>
          </div>

          <!-- Stats bar -->
          <div style="display:flex;margin-top:48px;border-top:1px solid #1e1e1e;padding-top:28px;">
            <div style="flex:1;padding-right:28px;border-right:1px solid #1e1e1e;margin-right:28px;">
              <div style="font-family:impact,sans-serif;font-size:30px;color:#fff;letter-spacing:1px;">10K+</div>
              <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:#888;text-transform:uppercase;margin-top:4px;">Comics</div>
            </div>
            <div style="flex:1;padding-right:28px;border-right:1px solid #1e1e1e;margin-right:28px;">
              <div style="font-family:impact,sans-serif;font-size:30px;color:#fff;letter-spacing:1px;">GRATUIT</div>
              <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:#888;text-transform:uppercase;margin-top:4px;">Pour toujours</div>
            </div>
            <div style="flex:1;">
              <div style="font-family:impact,sans-serif;font-size:30px;color:#fff;letter-spacing:1px;">MARVEL</div>
              <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:#888;text-transform:uppercase;margin-top:4px;">& autres</div>
            </div>
          </div>
        </div>

        <!-- Right — Trending sidebar (infinite scroll) -->
        <div style="border:1px solid #1e1e1e;border-top:2px solid #e02020;">
          <div style="padding:12px 16px;border-bottom:1px solid #1e1e1e;display:flex;justify-content:space-between;align-items:center;">
            <h2 style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;color:#e02020;text-transform:uppercase;margin:0;">Tendances</h2>
            <span style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;color:#333;">№ 024</span>
          </div>
          <div style="overflow:hidden;height:480px;">
            <div class="carousel-track">
              <div
                v-for="(item, i) in [...trendingItems, ...trendingItems]"
                :key="`${item.title}-${i}`"
                style="padding:18px 20px;border-bottom:1px solid #1a1a1a;display:flex;gap:16px;align-items:flex-start;"
              >
                <div style="width:64px;height:90px;background:#1e1e1e;flex-shrink:0;position:relative;overflow:hidden;">
                  <img
                    v-if="item.coverUrl"
                    :src="item.coverUrl"
                    :alt="item.title"
                    style="width:100%;height:100%;object-fit:cover;"
                  />
                  <div v-else style="position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px);background-size:4px 4px;"></div>
                  <span style="position:absolute;bottom:4px;left:4px;font-family:impact,sans-serif;font-size:13px;color:#e02020;z-index:1;text-shadow:0 1px 3px #000;">{{ String((i % trendingItems.length) + 1).padStart(2, '0') }}</span>
                </div>
                <div>
                  <div style="font-family:impact,sans-serif;font-size:15px;letter-spacing:1px;text-transform:uppercase;color:#fff;margin-bottom:6px;line-height:1.2;">{{ item.title }}</div>
                  <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1px;color:#888;text-transform:uppercase;">{{ item.meta }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Features -->
    <section style="border-bottom:1px solid #1e1e1e;">
      <div class="max-w-[1100px] mx-auto px-6 py-16">
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:36px;">
          <div>
            <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:5px;color:#e02020;text-transform:uppercase;margin-bottom:10px;">Fonctionnalités</div>
            <h2 style="font-family:impact,sans-serif;font-size:38px;color:#fff;text-transform:uppercase;letter-spacing:1px;margin:0;">TOUT CE QU'IL TE FAUT</h2>
          </div>
          <div aria-hidden="true" style="font-family:impact,sans-serif;font-size:80px;color:rgba(255,255,255,0.03);line-height:1;">04</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#1e1e1e;">
          <div v-for="(f, i) in features" :key="f.title" style="background:#0f0f0f;padding:28px 22px;position:relative;">
            <div aria-hidden="true" style="position:absolute;top:14px;right:14px;font-family:impact,sans-serif;font-size:48px;color:rgba(255,255,255,0.04);line-height:1;pointer-events:none;">{{ String(i + 1).padStart(2, '0') }}</div>
            <div style="width:24px;height:2px;background:#e02020;margin-bottom:18px;"></div>
            <div style="font-family:impact,sans-serif;font-size:16px;letter-spacing:1px;text-transform:uppercase;color:#fff;margin-bottom:10px;">{{ f.title }}</div>
            <div style="font-family:'Courier New',monospace;font-size:13px;line-height:1.7;color:#d4d4d4;">{{ f.desc }}</div>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
const { isLoggedIn } = useAuth()

if (isLoggedIn.value) {
  await navigateTo('/feed')
}

const trendingItems = [
  { title: 'Amazing Spider-Man', meta: 'Marvel · 1963', coverUrl: '/covers/defaults/hp-spiderman.webp' },
  { title: 'Batman: Year One', meta: 'DC · 1987', coverUrl: '/covers/defaults/hp-dayone.jpg' },
  { title: 'Watchmen', meta: 'DC · 1986', coverUrl: '/covers/defaults/hp-watchmen.webp' },
  { title: 'Valérian', meta: 'Dargaud · 1967', coverUrl: '/covers/defaults/hp-valerian.jpg' },
  { title: 'Buck Danny', meta: 'Dupuis · 1947', coverUrl: '/covers/defaults/hp-buckdanny.jpg' },
  { title: 'Invincible', meta: 'Image · 2003', coverUrl: '/covers/defaults/hp-invincible.jpg' },
  { title: "Kraven's Last Hunt", meta: 'Marvel · 1987', coverUrl: '/covers/defaults/hp-kravenlasthunt.jpeg' },
  { title: 'Man of Steel', meta: 'DC · 1986', coverUrl: '/covers/defaults/hp-mos.webp' },
]

const features = [
  { title: 'Journal de lecture', desc: 'Marque ce que tu lis, ce que tu as terminé, ce que tu veux découvrir.' },
  { title: 'Notes & avis', desc: 'Note de 1 à 5 étoiles et laisse ton avis sur chaque comic.' },
  { title: 'Listes perso', desc: 'Crée des sélections thématiques et partage-les avec la communauté.' },
  { title: 'Recommandations', desc: 'Découvre de nouveaux comics basés sur tes genres et auteurs préférés.' },
]
</script>

<style scoped>
@keyframes scrollUp {
  from { transform: translateY(0); }
  to   { transform: translateY(-50%); }
}
.carousel-track {
  animation: scrollUp 24s linear infinite;
}
.carousel-track:hover {
  animation-play-state: paused;
}
</style>
