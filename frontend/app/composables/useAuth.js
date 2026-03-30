export function useAuth() {
  const config = useRuntimeConfig()
  const base = config.public.apiBase
  const token = useCookie('auth_token', { maxAge: 60 * 60 * 24 * 15 })
  const refreshTokenCookie = useCookie('refresh_token', { maxAge: 60 * 60 * 24 * 30 })
  const user = useState('user', () => null)

  async function login(email, password, totpCode = null) {
    const body = { email, password }
    if (totpCode) body.totpCode = totpCode

    const data = await $fetch(`${base}/auth/login`, {
      method: 'POST',
      body,
    })

    if (data.requires2FA) return { requires2FA: true }

    token.value = data.token
    refreshTokenCookie.value = data.refreshToken
    user.value = data.user

    if (data.requires2FASetup) return { requires2FASetup: true }

    return data
  }

  async function register(email, username, password) {
    const data = await $fetch(`${base}/auth/register`, {
      method: 'POST',
      body: { email, username, password },
    })
    token.value = data.token
    refreshTokenCookie.value = data.refreshToken
    user.value = data.user
    return data
  }

  async function setOAuthTokens(accessToken, refreshToken) {
    token.value = accessToken
    refreshTokenCookie.value = refreshToken
    await fetchMe()
  }

  async function refreshAccessToken() {
    if (!refreshTokenCookie.value) throw new Error('No refresh token')
    const data = await $fetch(`${base}/auth/refresh`, {
      method: 'POST',
      body: { refreshToken: refreshTokenCookie.value },
    })
    token.value = data.token
    refreshTokenCookie.value = data.refreshToken
    return data.token
  }

  async function fetchMe() {
    if (!token.value) return
    try {
      user.value = await $fetch(`${base}/me`, {
        headers: { Authorization: `Bearer ${token.value}` },
      })
    } catch (e) {
      if (e.status === 401 && refreshTokenCookie.value) {
        try {
          await refreshAccessToken()
          user.value = await $fetch(`${base}/me`, {
            headers: { Authorization: `Bearer ${token.value}` },
          })
        } catch {
          token.value = null
          refreshTokenCookie.value = null
          user.value = null
        }
      } else {
        token.value = null
        refreshTokenCookie.value = null
        user.value = null
      }
    }
  }

  async function logout() {
    try {
      await $fetch(`${base}/auth/logout`, {
        method: 'POST',
        body: { refreshToken: refreshTokenCookie.value },
      })
    } catch {}
    token.value = null
    refreshTokenCookie.value = null
    user.value = null
    navigateTo('/')
  }

  const isLoggedIn = computed(() => !!token.value)

  return { token, user, login, register, setOAuthTokens, refreshAccessToken, fetchMe, logout, isLoggedIn }
}
