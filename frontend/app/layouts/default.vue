<template>
  <div class="min-h-screen flex flex-col" style="position:relative;z-index:1;">

    <!-- Navbar -->
    <header class="fixed top-0 inset-x-0 z-50" style="background:#0f0f0f;border-bottom:1px solid #1e1e1e;">
      <div style="height:2px;background:#e02020;"></div>
      <!-- xl:max-w-[1200px] : 100px de rab pour que les 9 rubriques + le lien ADMIN
           tiennent sans scroll. En dessous de xl c'est le menu burger, donc la
           largeur reste alignée sur celle du contenu (1100px). -->
      <div class="max-w-[1100px] xl:max-w-[1200px] mx-auto px-6 h-[52px] flex items-center justify-between">

        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-[10px] flex-shrink-0" aria-label="Comicster — Accueil">
          <div style="width:26px;height:26px;background:#e02020;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <span style="font-family:impact,sans-serif;font-size:15px;color:#fff;line-height:1;">C</span>
          </div>
          <span style="font-family:impact,sans-serif;font-size:18px;letter-spacing:4px;color:#fff;text-transform:uppercase;">COMICSTER</span>
        </NuxtLink>

        <!-- Nav links (desktop) -->
        <nav v-if="isLoggedIn" class="hidden xl:flex items-center flex-1 min-w-0 nav-scroll" aria-label="Navigation principale">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="nav-link"
            :style="link.accent ? 'color:#e02020;' : ''"
            :active-class="link.accent ? '!text-[#fff]' : '!text-[#e02020]'"
          >{{ link.label }}</NuxtLink>
        </nav>

        <!-- Auth actions -->
        <div class="flex items-center gap-3 flex-shrink-0">
          <template v-if="isLoggedIn">
            <NotificationBell />
            <NuxtLink
              v-if="isAdmin"
              to="/admin"
              class="hidden xl:flex items-center btn-ghost"
              style="font-size:10px;padding:6px 12px;border-color:#e02020;color:#e02020;"
            >ADMIN</NuxtLink>
            <NuxtLink
              to="/settings/security"
              class="hidden xl:flex items-center gap-2"
              style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:#fff;text-transform:uppercase;text-decoration:none;transition:color 0.15s;"
              :title="`Connecté en tant que ${user?.username}`"
            >
              <div style="width:6px;height:6px;border-radius:50%;background:#22c55e;flex-shrink:0;"></div>
              {{ user?.username }}
            </NuxtLink>
            <button
              @click="logout"
              class="hidden xl:block"
              style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;color:#fff;text-transform:uppercase;background:none;border:none;cursor:pointer;transition:color 0.15s;"
            >DÉCO_</button>

            <!-- Burger (mobile / tablette) -->
            <button
              class="burger"
              :class="{ 'is-open': menuOpen }"
              :aria-expanded="menuOpen"
              :aria-label="menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'"
              aria-controls="mobile-nav"
              @click="menuOpen = !menuOpen"
            >
              <span></span><span></span><span></span>
            </button>
          </template>
          <template v-else>
            <NuxtLink
              to="/auth/login"
              style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#fff;text-decoration:none;padding:7px 14px;border:1px solid #3a3a3a;transition:border-color 0.15s,color 0.15s;"
            >LOGIN_</NuxtLink>
            <NuxtLink to="/auth/register" class="btn-primary" style="font-size:12px;padding:8px 16px;">
              S'INSCRIRE
            </NuxtLink>
          </template>
        </div>

      </div>
    </header>

    <!-- Mobile nav panel -->
    <Transition name="drawer">
      <nav
        v-if="isLoggedIn && menuOpen"
        id="mobile-nav"
        class="mobile-nav"
        aria-label="Navigation principale"
      >
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="mnav-link"
          :style="link.accent ? 'color:#e02020;' : ''"
          active-class="mnav-active"
        >
          {{ link.label }}
          <span class="mnav-chevron" aria-hidden="true">&rsaquo;</span>
        </NuxtLink>

        <NuxtLink v-if="isAdmin" to="/admin" class="mnav-link" style="color:#e02020;" active-class="mnav-active">
          Admin
          <span class="mnav-chevron" aria-hidden="true">&rsaquo;</span>
        </NuxtLink>

        <div class="mnav-footer">
          <NuxtLink to="/settings/security" class="mnav-user">
            <span style="width:6px;height:6px;border-radius:50%;background:#22c55e;flex-shrink:0;"></span>
            {{ user?.username }}
          </NuxtLink>
          <button class="mnav-logout" @click="logout">DÉCO_</button>
        </div>
      </nav>
    </Transition>

    <!-- Page content -->
    <main class="flex-1" style="padding-top:54px;position:relative;z-index:1;">
      <slot />
    </main>

    <!-- Footer -->
    <footer style="border-top:1px solid #1e1e1e;position:relative;z-index:1;">
      <div style="height:2px;background:#e02020;"></div>
      <div class="max-w-[1100px] mx-auto px-6 py-[22px] flex flex-col sm:flex-row items-center justify-between gap-3">
        <span style="font-family:impact,sans-serif;font-size:13px;letter-spacing:4px;color:#fff;text-transform:uppercase;">
          COMICSTER — TON JOURNAL DE COMICS
        </span>
        <div class="flex">
          <NuxtLink to="/rgpd" style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;color:#fff;text-transform:uppercase;text-decoration:none;padding:0 16px;border-right:1px solid #2a2a2a;transition:color 0.15s;">RGPD</NuxtLink>
          <NuxtLink to="/mentions-legales" style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;color:#fff;text-transform:uppercase;text-decoration:none;padding:0 16px;transition:color 0.15s;">Mentions</NuxtLink>
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

const navLinks = [
  { to: '/feed', label: 'Feed' },
  { to: '/comics/search', label: 'Explorer' },
  { to: '/journal', label: 'Journal' },
  { to: '/lists', label: 'Listes' },
  { to: '/reviews', label: 'Avis' },
  { to: '/guides', label: 'Guide' },
  { to: '/recommendations', label: 'Recos' },
  { to: '/dashboard', label: 'Stats' },
  { to: '/arcade', label: 'Arcade', accent: true },
]

// Menu mobile : fermé à la navigation, avec Échap, et scroll de page bloqué à l'ouverture
const menuOpen = ref(false)
const route = useRoute()

watch(() => route.fullPath, () => { menuOpen.value = false })

watch(menuOpen, (open) => {
  if (import.meta.client) document.body.style.overflow = open ? 'hidden' : ''
})

const onKeydown = (e) => { if (e.key === 'Escape') menuOpen.value = false }
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.nav-scroll {
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.nav-scroll::-webkit-scrollbar {
  display: none;
}
.nav-scroll > a {
  flex-shrink: 0;
}

/* ── Nav desktop ── */
/* padding et letter-spacing resserrés : à 3px/14px les 9 rubriques réclamaient
   742px pour 657px disponibles (conteneur plafonné à 1100px), donc Arcade était
   coupée par le scroll du .nav-scroll à *toutes* les largeurs d'écran. */
.nav-link {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #fff;
  padding: 0 11px;
  height: 52px;
  display: flex;
  align-items: center;
  border-right: 1px solid #2a2a2a;
  text-decoration: none;
  transition: color 0.15s;
}
.nav-link:first-child {
  border-left: 1px solid #2a2a2a;
}

/* ── Burger ── */
.burger {
  width: 34px;
  height: 34px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: none;
  border: 1px solid #3a3a3a;
  cursor: pointer;
  transition: border-color 0.15s;
}
.burger:hover,
.burger.is-open {
  border-color: #e02020;
}
.burger span {
  display: block;
  width: 18px;
  height: 2px;
  background: #fff;
  transition: transform 0.2s, opacity 0.2s, background-color 0.15s;
}
.burger.is-open span {
  background: #e02020;
}
.burger.is-open span:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}
.burger.is-open span:nth-child(2) {
  opacity: 0;
}
.burger.is-open span:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}

/* ── Panneau mobile ── */
.mobile-nav {
  position: fixed;
  top: 54px;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  background: #0f0f0f;
  border-top: 1px solid #1e1e1e;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.mnav-link {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #fff;
  text-decoration: none;
  padding: 17px 24px;
  border-bottom: 1px solid #1e1e1e;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.15s, color 0.15s;
}
.mnav-link:active {
  background: #161616;
}
.mnav-link.mnav-active {
  color: #e02020;
  border-left: 2px solid #e02020;
  padding-left: 22px;
}
.mnav-chevron {
  color: #3a3a3a;
  font-size: 18px;
}
.mnav-footer {
  margin-top: auto;
  border-top: 1px solid #1e1e1e;
  padding: 20px 24px calc(20px + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.mnav-user {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #fff;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mnav-logout {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #fff;
  background: none;
  border: 1px solid #3a3a3a;
  padding: 9px 16px;
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 0.15s, color 0.15s;
}
.mnav-logout:hover {
  border-color: #e02020;
  color: #e02020;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
/* Breakpoint géré ici et pas via `xl:hidden` : le CSS scoped (.burger[data-v-x])
   est plus spécifique que l'utility Tailwind et l'écraserait. xl = 1280px. */
@media (min-width: 1280px) {
  .burger,
  .mobile-nav {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .drawer-enter-active,
  .drawer-leave-active,
  .burger span {
    transition: none;
  }
}
</style>
