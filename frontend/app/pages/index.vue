<template>
  <div>

    <!-- Hero -->
    <section style="border-bottom:1px solid #1e1e1e;">
      <div
        class="max-w-[1100px] mx-auto px-6 py-20"
        style="display:grid;grid-template-columns:1fr 320px;gap:48px;align-items:center;min-height:86vh;"
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

        <!-- Right — Trending sidebar -->
        <div style="border:1px solid #1e1e1e;border-top:2px solid #e02020;">
          <div style="padding:12px 16px;border-bottom:1px solid #1e1e1e;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;color:#e02020;text-transform:uppercase;">Tendances</span>
            <span style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;color:#333;">№ 024</span>
          </div>
          <div
            v-for="(item, i) in trendingItems"
            :key="i"
            style="padding:14px 16px;border-bottom:1px solid #1a1a1a;display:flex;gap:12px;align-items:flex-start;"
          >
            <div style="width:36px;height:50px;background:#1e1e1e;flex-shrink:0;position:relative;overflow:hidden;">
              <div style="position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px);background-size:4px 4px;"></div>
              <span style="position:absolute;bottom:3px;left:3px;font-family:impact,sans-serif;font-size:11px;color:#e02020;z-index:1;">{{ String(i + 1).padStart(2, '0') }}</span>
            </div>
            <div>
              <div style="font-family:impact,sans-serif;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#fff;margin-bottom:4px;line-height:1.15;">{{ item.title }}</div>
              <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1px;color:#888;text-transform:uppercase;">{{ item.meta }}</div>
              <div style="display:inline-flex;align-items:center;font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;padding:2px 6px;margin-top:6px;border:1px solid #e02020;color:#e02020;">{{ item.status }}</div>
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
            <div style="font-family:impact,sans-serif;font-size:38px;color:#fff;text-transform:uppercase;letter-spacing:1px;">TOUT CE QU'IL TE FAUT</div>
          </div>
          <div style="font-family:impact,sans-serif;font-size:80px;color:rgba(255,255,255,0.03);line-height:1;">04</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#1e1e1e;">
          <div v-for="(f, i) in features" :key="f.title" style="background:#0f0f0f;padding:28px 22px;position:relative;">
            <div style="position:absolute;top:14px;right:14px;font-family:impact,sans-serif;font-size:48px;color:rgba(255,255,255,0.04);line-height:1;pointer-events:none;">{{ String(i + 1).padStart(2, '0') }}</div>
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
  { title: 'Amazing Spider-Man', meta: 'Marvel · 1963', status: 'En cours' },
  { title: 'Batman: Year One', meta: 'DC · 1987', status: 'Terminé' },
  { title: 'Watchmen', meta: 'DC · 1986', status: 'À lire' },
  { title: 'Saga Vol. 1', meta: 'Image · 2012', status: 'En cours' },
]

const features = [
  { title: 'Journal de lecture', desc: 'Marque ce que tu lis, ce que tu as terminé, ce que tu veux découvrir.' },
  { title: 'Notes & avis', desc: 'Note de 1 à 5 étoiles et laisse ton avis sur chaque comic.' },
  { title: 'Listes perso', desc: 'Crée des sélections thématiques et partage-les avec la communauté.' },
  { title: 'Recommandations', desc: 'Découvre de nouveaux comics basés sur tes genres et auteurs préférés.' },
]
</script>
