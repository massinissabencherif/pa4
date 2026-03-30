<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden min-h-[92vh] flex items-center">
      <!-- Gradient bg -->
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-red-700/10 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-900/10 rounded-full blur-3xl"></div>
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.04)_0%,_transparent_70%)]"></div>
      </div>

      <div class="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 w-full">
        <div class="max-w-2xl">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-red-400 font-medium mb-8">
            <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            Ton espace comics personnel
          </div>

          <!-- Heading -->
          <h1 class="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Suis, note et
            <br />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400">
              partage tes comics
            </span>
          </h1>

          <p class="text-gray-400 text-lg leading-relaxed mb-10 max-w-lg">
            Journal de lecture, avis, listes personnalisées et recommandations.
            Tout ce qu'il te faut pour ne jamais perdre le fil.
          </p>

          <div class="flex flex-wrap gap-3">
            <NuxtLink to="/auth/register" class="btn-primary text-base !px-7 !py-3.5">
              Commencer gratuitement
            </NuxtLink>
            <NuxtLink to="/comics/search" class="btn-ghost text-base !px-7 !py-3.5">
              Explorer les comics →
            </NuxtLink>
          </div>
        </div>

        <!-- Stats flottantes -->
        <div class="absolute right-6 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4">
          <div class="card px-5 py-4 text-center w-36">
            <div class="text-3xl font-black text-white mb-0.5">500k+</div>
            <div class="text-xs text-gray-500">Comics indexés</div>
          </div>
          <div class="card px-5 py-4 text-center w-36">
            <div class="text-3xl font-black text-red-400 mb-0.5">∞</div>
            <div class="text-xs text-gray-500">Listes possibles</div>
          </div>
          <div class="card px-5 py-4 text-center w-36">
            <div class="text-3xl font-black text-white mb-0.5">100%</div>
            <div class="text-xs text-gray-500">Gratuit</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 pb-28">
      <div class="text-center mb-14">
        <h2 class="text-3xl font-bold mb-3">Tout ce dont tu as besoin</h2>
        <p class="text-gray-500">Des outils pensés pour les vrais lecteurs de comics.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="f in features"
          :key="f.title"
          class="card p-6 hover:border-white/15 hover:-translate-y-1 transition-all duration-200 group"
        >
          <div class="text-3xl mb-4">{{ f.icon }}</div>
          <h3 class="font-semibold text-lg mb-2 group-hover:text-white transition-colors">{{ f.title }}</h3>
          <p class="text-gray-500 text-sm leading-relaxed">{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <!-- CTA bas de page -->
    <section class="border-t border-white/5 py-24 px-4 text-center">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-gray-400 mb-6">
        Rejoins la communauté
      </div>
      <h2 class="text-4xl font-extrabold mb-4">Prêt à commencer ?</h2>
      <p class="text-gray-500 mb-8">Crée ton compte en 30 secondes, c'est gratuit.</p>
      <NuxtLink to="/auth/register" class="btn-primary text-base !px-8 !py-3.5 inline-block">
        Créer mon compte
      </NuxtLink>
    </section>
  </div>
</template>

<script setup>
const { isLoggedIn } = useAuth()

// Rediriger les utilisateurs connectés vers le feed
if (isLoggedIn.value) {
  await navigateTo('/feed')
}

const features = [
  {
    icon: '📚',
    title: 'Journal de lecture',
    desc: 'Marque ce que tu lis, ce que tu as terminé, ce que tu veux lire. Tout en un endroit.',
  },
  {
    icon: '⭐',
    title: 'Notes & avis',
    desc: 'Donne une note de 1 à 5 étoiles et laisse ton avis sur chaque comic.',
  },
  {
    icon: '🗂️',
    title: 'Listes personnalisées',
    desc: 'Crée des sélections thématiques, rends-les publiques et partage-les.',
  },
  {
    icon: '🔍',
    title: 'Recherche Marvel',
    desc: 'Accès à la base Marvel complète : 500 000+ comics, séries, personnages.',
  },
  {
    icon: '💡',
    title: 'Recommandations',
    desc: 'Découvre de nouveaux comics basés sur tes goûts et ceux de la communauté.',
  },
  {
    icon: '👥',
    title: 'Social',
    desc: 'Suis d\'autres lecteurs, vois leur activité, commente leurs avis.',
  },
]
</script>
