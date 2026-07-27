// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  modules: ['@nuxtjs/tailwindcss'],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // URL de l'API vue depuis le serveur de rendu, quand elle diffère de celle du
    // navigateur. En local, le navigateur atteint l'API sur localhost:3001 mais le
    // conteneur frontend, lui, doit passer par le nom de service Docker : sans ça
    // tous les useFetch du rendu serveur échouent et les pages arrivent vides.
    // Vide ailleurs (dev, sandbox, prod) où l'URL publique est joignable des deux
    // côtés — le comportement y est donc inchangé. Alimentée par NUXT_API_BASE_SERVER.
    apiBaseServer: '',
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
      umamiId: process.env.NUXT_PUBLIC_UMAMI_ID || '',
      umamiUrl: process.env.NUXT_PUBLIC_UMAMI_URL || '',
      appEnv: process.env.NUXT_PUBLIC_APP_ENV || 'production',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://sitedetestdemassinissabencherif.com',
    },
  },
})
