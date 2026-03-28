export default defineNuxtRouteMiddleware(() => {
  const token = useCookie('auth_token')
  if (!token.value) return navigateTo('/auth/login')

  // Décoder le payload JWT (sans vérification de signature côté client)
  try {
    const payload = JSON.parse(atob(token.value.split('.')[1]))
    if (payload.role !== 'ADMIN') return navigateTo('/')
  } catch {
    return navigateTo('/')
  }
})
