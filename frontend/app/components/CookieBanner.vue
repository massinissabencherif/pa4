<template>
  <Transition name="slide-up">
    <div
      v-if="visible"
      class="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6"
    >
      <div class="max-w-3xl mx-auto card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-2xl shadow-black/50">
        <div class="flex-1 text-sm text-gray-400 leading-relaxed">
          <span class="font-semibold text-white">Comicster utilise des cookies.</span>
          Des cookies strictement nécessaires assurent le fonctionnement du service.
          Avec votre accord, des cookies analytiques anonymes (Umami) mesurent l'audience.
          <NuxtLink to="/rgpd" class="text-red-400 hover:text-red-300 transition ml-1">En savoir plus</NuxtLink>
        </div>
        <div class="flex gap-3 shrink-0">
          <button
            @click="decline"
            class="px-4 py-2 text-sm rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition"
          >
            Refuser
          </button>
          <button
            @click="accept"
            class="px-4 py-2 text-sm rounded-xl bg-red-600 hover:bg-red-500 transition text-white font-medium"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
const COOKIE_KEY = 'cookie_consent'

const consent = useCookie(COOKIE_KEY, { maxAge: 60 * 60 * 24 * 365 })
const visible = ref(false)

onMounted(() => {
  if (!consent.value) {
    visible.value = true
  }
})

function accept() {
  consent.value = 'accepted'
  visible.value = false
}

function decline() {
  consent.value = 'declined'
  visible.value = false
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
