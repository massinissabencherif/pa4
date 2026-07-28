export function useAuth() {
  const config = useRuntimeConfig()
  const base = config.public.apiBase
  const secure = config.public.appEnv === 'production'
  const token = useCookie('auth_token', { maxAge: 60 * 15, sameSite: 'lax', secure })
  // 30 jours, pour correspondre à l'expiration posée en base par createRefreshToken
  // (backend/src/routes/auth.js). Le cookie était à 7 jours : la fenêtre de 30 jours
  // prévue côté serveur n'était donc jamais atteinte.
  const refreshTokenCookie = useCookie('refresh_token', { maxAge: 60 * 60 * 24 * 30, sameSite: 'lax', secure })
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

  // Échange un one-time code OAuth contre des tokens (ne lit pas l'URL)
  async function exchangeOAuthCode(code) {
    const data = await $fetch(`${base}/auth/oauth/exchange`, {
      method: 'POST',
      body: { code },
    })
    token.value = data.token
    refreshTokenCookie.value = data.refreshToken
    user.value = data.user
    return data
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
    // Le cookie auth_token ne vit que 15 minutes : en revenant sur le site après
    // une absence, il a disparu alors que refresh_token est encore valide. On
    // abandonnait ici, ce qui déconnectait l'utilisateur au bout de 15 minutes
    // au lieu des 30 jours prévus. On tente donc de reprendre la session.
    if (!token.value) {
      if (!refreshTokenCookie.value) return
      try {
        await refreshAccessToken()
      } catch {
        refreshTokenCookie.value = null
        return
      }
    }
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

  async function forgotPassword(email) {
    return $fetch(`${base}/auth/forgot-password`, {
      method: 'POST',
      body: { email },
    })
  }

  async function resetPassword(resetToken, password) {
    return $fetch(`${base}/auth/reset-password`, {
      method: 'POST',
      body: { token: resetToken, password },
    })
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
    navigateTo('/auth/login')
  }

  const isLoggedIn = computed(() => !!token.value)

  return { token, refreshToken: refreshTokenCookie, user, login, register, exchangeOAuthCode, refreshAccessToken, forgotPassword, resetPassword, fetchMe, logout, isLoggedIn }
}
