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
            <NuxtLink to="/auth/login" class="btn-ghost text-base !px-7 !py-3.5">
              Se connecter
            </NuxtLink>
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
</script>
