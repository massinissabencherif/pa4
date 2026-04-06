<template>
  <div class="min-h-screen flex flex-col">
    <!-- Navbar -->
    <header
      class="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      :class="scrolled ? 'bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5 shadow-xl shadow-black/20' : 'bg-transparent'"
    >
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2 group" aria-label="Comicster — Accueil">
          <div class="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/40 group-hover:scale-105 transition-transform">
            <span class="text-white font-black text-sm">C</span>
          </div>
          <span class="font-bold text-lg tracking-tight">
            <span class="text-red-500">Comic</span><span class="text-white">ster</span>
          </span>
        </NuxtLink>

        <!-- Nav links -->
        <nav class="hidden sm:flex items-center gap-1" aria-label="Navigation principale">
          <NuxtLink
            v-if="isLoggedIn"
            to="/feed"
            class="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            active-class="text-white bg-white/8"
          >
            Feed
          </NuxtLink>
          <NuxtLink
            v-if="isLoggedIn"
            to="/comics/search"
            class="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            active-class="text-white bg-white/8"
          >
            Explorer
          </NuxtLink>
          <NuxtLink
            v-if="isLoggedIn"
            to="/journal"
            class="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            active-class="text-white bg-white/8"
          >
            Journal
          </NuxtLink>
          <NuxtLink
            v-if="isLoggedIn"
            to="/lists"
            class="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            active-class="text-white bg-white/8"
          >
            Listes
          </NuxtLink>
          <NuxtLink
            v-if="isLoggedIn"
            to="/reviews"
            class="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            active-class="text-white bg-white/8"
          >
            Mes avis
          </NuxtLink>
          <NuxtLink
            v-if="isLoggedIn"
            to="/dashboard"
            class="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            active-class="text-white bg-white/8"
          >
            Mes stats
          </NuxtLink>
        </nav>

        <!-- Auth actions -->
        <div class="flex items-center gap-3">
          <template v-if="isLoggedIn">
            <NuxtLink
              v-if="isAdmin"
              to="/admin"
              class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all border border-red-500/20"
            >
              🛡 Admin
            </NuxtLink>
            <NuxtLink
              to="/settings/security"
              class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full glass text-sm text-gray-300 hover:text-white transition"
              :title="`Connecté en tant que ${user?.username}`"
            >
              <div class="w-2 h-2 rounded-full bg-green-500"></div>
              {{ user?.username }}
            </NuxtLink>
            <button
              @click="logout"
              class="text-gray-500 hover:text-gray-300 text-sm transition"
            >
              Déconnexion
            </button>
          </template>
          <template v-else>
            <NuxtLink to="/auth/login" class="text-sm text-gray-400 hover:text-white transition px-3 py-2">
              Connexion
            </NuxtLink>
            <NuxtLink to="/auth/register" class="btn-primary text-sm !py-2 !px-4">
              S'inscrire
            </NuxtLink>
          </template>
        </div>
      </div>
    </header>

    <!-- Page content -->
    <main class="flex-1 pt-16">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-white/5 py-8 px-4 mt-auto">
      <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
        <span><span class="text-red-600">Comic</span>ster — Ton journal de comics</span>
        <div class="flex gap-6">
          <NuxtLink to="/comics/search" class="hover:text-gray-400 transition">Explorer</NuxtLink>
          <NuxtLink to="/rgpd" class="hover:text-gray-400 transition">RGPD</NuxtLink>
          <NuxtLink to="/mentions-legales" class="hover:text-gray-400 transition">Mentions légales</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
const { isLoggedIn, user, logout, token } = useAuth()
const config = useRuntimeConfig()

if (config.public.umamiId && config.public.umamiUrl) {
  useHead({
    script: [{
      src: config.public.umamiUrl,
      'data-website-id': config.public.umamiId,
      defer: true,
      async: true,
    }],
  })
}

const isAdmin = computed(() => {
  if (!token.value) return false
  try {
    const payload = JSON.parse(atob(token.value.split('.')[1]))
    return payload.role === 'ADMIN'
  } catch {
    return false
  }
})

const scrolled = ref(false)
const onScroll = () => { scrolled.value = window.scrollY > 10 }
onMounted(() => window.addEventListener('scroll', onScroll))
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>
