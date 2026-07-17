<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <CookieBanner />
</template>

<script setup>
const config = useRuntimeConfig()
const route = useRoute()

const isDev = config.public.appEnv === 'dev'
const siteUrl = config.public.siteUrl
const brand = isDev ? '(dev) Comicster' : 'Comicster'
const defaultTitle = `${brand} — le réseau des lecteurs de comics`
const defaultDescription =
  'Comicster, le réseau des lecteurs de comics : suivez vos lectures, notez, créez des listes et découvrez de nouveaux titres. Le Letterboxd des comics.'
const defaultImage = `${siteUrl}/covers/defaults/hp-watchmen.webp`

// Titre : "<page> · Comicster", ou le titre complet de marque sur les pages sans titre propre.
useHead({
  htmlAttrs: { lang: 'fr' },
  titleTemplate: (title) => (title ? `${title} · ${brand}` : defaultTitle),
  link: [{ rel: 'canonical', href: computed(() => `${siteUrl}${route.path}`) }],
  meta: [{ name: 'theme-color', content: '#e11d1d' }],
})

// Valeurs SEO par défaut, héritées par toutes les pages puis surchargées au besoin.
useSeoMeta({
  description: defaultDescription,
  ogSiteName: 'Comicster',
  ogType: 'website',
  ogLocale: 'fr_FR',
  ogTitle: defaultTitle,
  ogDescription: defaultDescription,
  ogImage: defaultImage,
  twitterCard: 'summary_large_image',
  twitterTitle: defaultTitle,
  twitterDescription: defaultDescription,
  twitterImage: defaultImage,
})
</script>
