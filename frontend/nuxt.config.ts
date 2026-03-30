// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  modules: ['@nuxtjs/tailwindcss'],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
      umamiId: process.env.NUXT_PUBLIC_UMAMI_ID || '',
      umamiUrl: process.env.NUXT_PUBLIC_UMAMI_URL || '',
      appEnv: process.env.NUXT_PUBLIC_APP_ENV || 'production',
    },
  },

  app: {
    head: {
      titleTemplate: process.env.NUXT_PUBLIC_APP_ENV === 'dev' ? '(dev) Comicster' : 'Comicster',
    },
  },
})
