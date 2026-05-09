<template>
  <div class="min-h-screen flex flex-col" style="position:relative;z-index:1;">

    <!-- Navbar -->
    <header class="fixed top-0 inset-x-0 z-50" style="background:#0f0f0f;border-bottom:1px solid #1e1e1e;">
      <div style="height:2px;background:#e02020;"></div>
      <div class="max-w-[1100px] mx-auto px-6 h-[52px] flex items-center justify-between">

        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-[10px]" aria-label="Comicster — Accueil">
          <div style="width:26px;height:26px;background:#e02020;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <span style="font-family:impact,sans-serif;font-size:15px;color:#fff;line-height:1;">C</span>
          </div>
          <span style="font-family:impact,sans-serif;font-size:18px;letter-spacing:4px;color:#fff;text-transform:uppercase;">COMICSTER</span>
        </NuxtLink>

        <!-- Nav links -->
        <nav class="hidden sm:flex items-center" aria-label="Navigation principale">
          <NuxtLink
            v-if="isLoggedIn"
            to="/feed"
            style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:#aaa;padding:0 14px;height:52px;display:flex;align-items:center;border-left:1px solid #2a2a2a;border-right:1px solid #2a2a2a;text-decoration:none;transition:color 0.15s;"
            active-class="!text-[#e02020]"
          >Feed</NuxtLink>
          <NuxtLink
            v-if="isLoggedIn"
            to="/comics/search"
            style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:#aaa;padding:0 14px;height:52px;display:flex;align-items:center;border-right:1px solid #2a2a2a;text-decoration:none;transition:color 0.15s;"
            active-class="!text-[#e02020]"
          >Explorer</NuxtLink>
          <NuxtLink
            v-if="isLoggedIn"
            to="/journal"
            style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:#aaa;padding:0 14px;height:52px;display:flex;align-items:center;border-right:1px solid #2a2a2a;text-decoration:none;transition:color 0.15s;"
            active-class="!text-[#e02020]"
          >Journal</NuxtLink>
          <NuxtLink
            v-if="isLoggedIn"
            to="/lists"
            style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:#aaa;padding:0 14px;height:52px;display:flex;align-items:center;border-right:1px solid #2a2a2a;text-decoration:none;transition:color 0.15s;"
            active-class="!text-[#e02020]"
          >Listes</NuxtLink>
          <NuxtLink
            v-if="isLoggedIn"
            to="/reviews"
            style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:#aaa;padding:0 14px;height:52px;display:flex;align-items:center;border-right:1px solid #2a2a2a;text-decoration:none;transition:color 0.15s;"
            active-class="!text-[#e02020]"
          >Avis</NuxtLink>
          <NuxtLink
            v-if="isLoggedIn"
            to="/recommendations"
            style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:#aaa;padding:0 14px;height:52px;display:flex;align-items:center;border-right:1px solid #2a2a2a;text-decoration:none;transition:color 0.15s;"
            active-class="!text-[#e02020]"
          >Guide</NuxtLink>
          <NuxtLink
            v-if="isLoggedIn"
            to="/dashboard"
            style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:#aaa;padding:0 14px;height:52px;display:flex;align-items:center;border-right:1px solid #2a2a2a;text-decoration:none;transition:color 0.15s;"
            active-class="!text-[#e02020]"
          >Stats</NuxtLink>
        </nav>

        <!-- Auth actions -->
        <div class="flex items-center gap-3">
          <template v-if="isLoggedIn">
            <span class="hidden sm:block" style="font-family:'Courier New',monospace;font-size:7px;letter-spacing:3px;color:#666;text-transform:uppercase;">№ 2026</span>
            <NuxtLink
              v-if="isAdmin"
              to="/admin"
              class="hidden sm:flex items-center btn-ghost"
              style="font-size:9px;padding:6px 12px;border-color:#e02020;color:#e02020;"
            >ADMIN</NuxtLink>
            <NuxtLink
              to="/settings/security"
              class="hidden sm:flex items-center gap-2"
              style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;color:#aaa;text-transform:uppercase;text-decoration:none;transition:color 0.15s;"
              :title="`Connecté en tant que ${user?.username}`"
            >
              <div style="width:6px;height:6px;border-radius:50%;background:#22c55e;flex-shrink:0;"></div>
              {{ user?.username }}
            </NuxtLink>
            <button
              @click="logout"
              style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:2px;color:#888;text-transform:uppercase;background:none;border:none;cursor:pointer;transition:color 0.15s;"
            >DÉCO_</button>
          </template>
          <template v-else>
            <span class="hidden sm:block" style="font-family:'Courier New',monospace;font-size:7px;letter-spacing:3px;color:#666;text-transform:uppercase;">№ 2026</span>
            <NuxtLink
              to="/auth/login"
              style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:#aaa;text-decoration:none;padding:7px 14px;border:1px solid #3a3a3a;transition:border-color 0.15s,color 0.15s;"
            >LOGIN_</NuxtLink>
            <NuxtLink to="/auth/register" class="btn-primary" style="font-size:11px;padding:8px 16px;">
              S'INSCRIRE
            </NuxtLink>
          </template>
        </div>

      </div>
    </header>

    <!-- Page content -->
    <main class="flex-1" style="padding-top:54px;position:relative;z-index:1;">
      <slot />
    </main>

    <!-- Footer -->
    <footer style="border-top:1px solid #1e1e1e;position:relative;z-index:1;">
      <div style="height:2px;background:#e02020;"></div>
      <div class="max-w-[1100px] mx-auto px-6 py-[22px] flex flex-col sm:flex-row items-center justify-between gap-3">
        <span style="font-family:impact,sans-serif;font-size:13px;letter-spacing:4px;color:#555;text-transform:uppercase;">
          COMICSTER — TON JOURNAL DE COMICS
        </span>
        <div class="flex">
          <NuxtLink to="/rgpd" style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;color:#888;text-transform:uppercase;text-decoration:none;padding:0 16px;border-right:1px solid #2a2a2a;transition:color 0.15s;">RGPD</NuxtLink>
          <NuxtLink to="/mentions-legales" style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;color:#888;text-transform:uppercase;text-decoration:none;padding:0 16px;transition:color 0.15s;">Mentions</NuxtLink>
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
    return ['ADMIN', 'SUPER_ADMIN'].includes(payload.role)
  } catch {
    return false
  }
})

const scrolled = ref(false)
const onScroll = () => { scrolled.value = window.scrollY > 10 }
onMounted(() => window.addEventListener('scroll', onScroll))
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>
