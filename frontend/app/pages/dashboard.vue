<template>
  <div>

    <!-- Page header -->
    <div style="border-bottom:1px solid #2a2a2a;">
      <div class="max-w-[1100px] mx-auto px-6 pt-9 pb-0">
        <div style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:5px;color:#e02020;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:10px;">
          <div style="width:16px;height:2px;background:#e02020;flex-shrink:0;"></div>
          Mes statistiques
        </div>
        <div style="font-family:impact,sans-serif;font-size:52px;letter-spacing:1px;color:#fff;text-transform:uppercase;line-height:1;padding-bottom:18px;">TABLEAU DE BORD</div>
      </div>
    </div>

    <div class="max-w-[1100px] mx-auto px-6 py-8">

      <div v-if="pending" style="display:flex;align-items:center;gap:10px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;color:#888;text-transform:uppercase;padding:80px 0;">
        <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Chargement…
      </div>

      <div v-else-if="!stats" style="text-align:center;padding:80px 0;font-family:'Courier New',monospace;font-size:11px;letter-spacing:3px;color:#555;text-transform:uppercase;">
        Impossible de charger les statistiques.
      </div>

      <template v-else>

        <!-- Compteurs principaux -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-px mb-px" style="background:#2a2a2a;margin-bottom:32px;">
          <div style="background:#111;padding:24px 20px;text-align:center;">
            <p style="font-family:impact,sans-serif;font-size:36px;letter-spacing:1px;color:#22c55e;line-height:1;">{{ stats.counts.finished }}</p>
            <p style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#888;margin-top:8px;">Terminés</p>
          </div>
          <div style="background:#111;padding:24px 20px;text-align:center;">
            <p style="font-family:impact,sans-serif;font-size:36px;letter-spacing:1px;color:#60a5fa;line-height:1;">{{ stats.counts.inProgress }}</p>
            <p style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#888;margin-top:8px;">En cours</p>
          </div>
          <div style="background:#111;padding:24px 20px;text-align:center;">
            <p style="font-family:impact,sans-serif;font-size:36px;letter-spacing:1px;color:#d4d4d4;line-height:1;">{{ stats.counts.toRead }}</p>
            <p style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#888;margin-top:8px;">À lire</p>
          </div>
          <div style="background:#111;padding:24px 20px;text-align:center;">
            <p style="font-family:impact,sans-serif;font-size:36px;letter-spacing:1px;color:#fbbf24;line-height:1;">{{ stats.counts.reviews }}</p>
            <p style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#888;margin-top:8px;">Avis postés</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-px mb-px" style="background:#2a2a2a;margin-bottom:24px;">

          <!-- Activité mensuelle -->
          <div style="background:#111;padding:24px;">
            <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#e02020;margin-bottom:6px;">Activité</div>
            <div style="font-family:impact,sans-serif;font-size:16px;letter-spacing:1px;text-transform:uppercase;color:#fff;margin-bottom:20px;">12 derniers mois</div>
            <div class="flex items-end gap-1" style="height:80px;">
              <div
                v-for="m in stats.monthlyActivity"
                :key="m.label"
                class="flex-1 flex flex-col items-center gap-1"
              >
                <div
                  class="w-full transition-all"
                  style="background:#e02020;opacity:0.8;"
                  :style="{ height: maxMonthly > 0 ? `${(m.count / maxMonthly) * 64}px` : '2px', minHeight: '2px' }"
                  :title="`${m.count} comic(s) terminé(s)`"
                />
                <span style="font-size:8px;font-family:'Courier New',monospace;color:#666;transform:rotate(45deg);transform-origin:left;display:block;width:12px;">{{ m.label }}</span>
              </div>
            </div>
          </div>

          <!-- Note moyenne + Communauté -->
          <div style="background:#111;padding:24px;display:flex;flex-direction:column;gap:24px;">
            <div>
              <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#e02020;margin-bottom:6px;">Note</div>
              <div style="font-family:impact,sans-serif;font-size:16px;letter-spacing:1px;text-transform:uppercase;color:#fff;margin-bottom:12px;">Moyenne donnée</div>
              <p v-if="stats.avgRatingGiven" style="font-family:impact,sans-serif;font-size:42px;letter-spacing:1px;color:#fbbf24;line-height:1;">
                {{ stats.avgRatingGiven }} ★
              </p>
              <p v-else style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;color:#555;text-transform:uppercase;">Aucun avis posté</p>
            </div>
            <div>
              <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#e02020;margin-bottom:12px;">Communauté</div>
              <div class="flex gap-8" style="font-family:'Courier New',monospace;">
                <div>
                  <span style="font-family:impact,sans-serif;font-size:26px;letter-spacing:1px;color:#fff;">{{ stats.counts.following }}</span>
                  <span style="font-size:10px;letter-spacing:2px;color:#888;text-transform:uppercase;margin-left:8px;">suivis</span>
                </div>
                <div>
                  <span style="font-family:impact,sans-serif;font-size:26px;letter-spacing:1px;color:#fff;">{{ stats.counts.followers }}</span>
                  <span style="font-size:10px;letter-spacing:2px;color:#888;text-transform:uppercase;margin-left:8px;">abonnés</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-px mb-px" style="background:#2a2a2a;margin-bottom:24px;">

          <!-- Top genres -->
          <div style="background:#111;padding:24px;">
            <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#e02020;margin-bottom:6px;">Préférences</div>
            <div style="font-family:impact,sans-serif;font-size:16px;letter-spacing:1px;text-transform:uppercase;color:#fff;margin-bottom:20px;">Genres préférés</div>
            <div v-if="stats.topGenres.length" class="space-y-3">
              <div v-for="g in stats.topGenres" :key="g.genre">
                <div class="flex justify-between" style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1px;margin-bottom:6px;">
                  <span style="color:#d4d4d4;">{{ g.genre }}</span>
                  <span style="color:#888;">{{ g.count }}</span>
                </div>
                <div style="height:3px;background:#1e1e1e;overflow:hidden;">
                  <div
                    style="height:100%;background:#e02020;opacity:0.8;"
                    :style="{ width: `${(g.count / stats.topGenres[0].count) * 100}%` }"
                  />
                </div>
              </div>
            </div>
            <p v-else style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;color:#555;text-transform:uppercase;">Lis des comics pour voir tes genres préférés.</p>
          </div>

          <!-- Top auteurs -->
          <div style="background:#111;padding:24px;">
            <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#e02020;margin-bottom:6px;">Préférences</div>
            <div style="font-family:impact,sans-serif;font-size:16px;letter-spacing:1px;text-transform:uppercase;color:#fff;margin-bottom:20px;">Auteurs préférés</div>
            <div v-if="stats.topAuthors.length" class="space-y-3">
              <div v-for="a in stats.topAuthors" :key="a.author">
                <div class="flex justify-between" style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1px;margin-bottom:6px;">
                  <span style="color:#d4d4d4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:70%;">{{ a.author }}</span>
                  <span style="color:#888;">{{ a.count }}</span>
                </div>
                <div style="height:3px;background:#1e1e1e;overflow:hidden;">
                  <div
                    style="height:100%;background:#60a5fa;opacity:0.8;"
                    :style="{ width: `${(a.count / stats.topAuthors[0].count) * 100}%` }"
                  />
                </div>
              </div>
            </div>
            <p v-else style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;color:#555;text-transform:uppercase;">Lis des comics pour voir tes auteurs préférés.</p>
          </div>
        </div>

        <!-- Badges -->
        <div style="background:#111;border:1px solid #2a2a2a;border-top:2px solid #e02020;padding:24px;">
          <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#e02020;margin-bottom:6px;">Récompenses</div>
          <div style="font-family:impact,sans-serif;font-size:16px;letter-spacing:1px;text-transform:uppercase;color:#fff;margin-bottom:20px;">
            Badges
            <span style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:#888;text-transform:uppercase;margin-left:12px;">({{ stats.badges.length }}/10)</span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-px" style="background:#2a2a2a;">
            <div
              v-for="badge in stats.badges"
              :key="badge.badgeKey"
              style="background:#111;display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 12px;text-align:center;position:relative;"
              class="badge-item"
            >
              <span style="font-size:24px;">{{ badge.icon }}</span>
              <span style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#d4d4d4;">{{ badge.name }}</span>
              <span style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:1px;color:#888;">{{ new Date(badge.earnedAt).toLocaleDateString('fr-FR') }}</span>
              <div class="badge-tooltip">
                <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#e02020;margin-bottom:4px;">{{ badge.name }}</div>
                <div style="font-family:'Courier New',monospace;font-size:10px;line-height:1.5;color:#d4d4d4;">{{ badge.description }}</div>
                <div style="margin-top:6px;font-family:'Courier New',monospace;font-size:8px;letter-spacing:1px;color:#555;text-transform:uppercase;">Obtenu le {{ new Date(badge.earnedAt).toLocaleDateString('fr-FR') }}</div>
              </div>
            </div>
            <div
              v-for="i in (10 - stats.badges.length)"
              :key="`empty-${i}`"
              style="background:#111;display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 12px;text-align:center;opacity:0.25;"
            >
              <span style="font-size:24px;filter:grayscale(1);">🏅</span>
              <span style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#555;">???</span>
            </div>
          </div>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

const config = useRuntimeConfig()
const base = config.public.apiBase
const { token } = useAuth()

const { data: stats, pending } = await useFetch(`${base}/stats/me`, {
  headers: { Authorization: `Bearer ${token.value}` },
})

const maxMonthly = computed(() =>
  stats.value ? Math.max(...stats.value.monthlyActivity.map((m) => m.count), 1) : 1
)
</script>

<style scoped>
.badge-item { cursor: default; }
.badge-tooltip {
  display: none;
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  width: 180px;
  background: #1a1a1a;
  border: 1px solid #e02020;
  padding: 10px 12px;
  text-align: left;
  z-index: 10;
  pointer-events: none;
}
.badge-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #e02020;
}
.badge-item:hover .badge-tooltip { display: block; }
</style>
