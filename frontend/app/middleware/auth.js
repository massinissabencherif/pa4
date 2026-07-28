export default defineNuxtRouteMiddleware(() => {
  const token = useCookie('auth_token')
  // refresh_token vit 30 jours, auth_token seulement 15 minutes : on laisse
  // passer quand seule la session longue subsiste. Le plugin auth.client a déjà
  // tenté la reprise au démarrage, et useApi rafraîchit sur un 401 — rediriger
  // ici déconnecterait un utilisateur dont la session est parfaitement valide.
  const refreshToken = useCookie('refresh_token')
  if (!token.value && !refreshToken.value) {
    return navigateTo('/auth/login')
  }
})
