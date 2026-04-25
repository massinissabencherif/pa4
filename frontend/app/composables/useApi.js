export function useApi() {
  const config = useRuntimeConfig()
  const base = config.public.apiBase
  const { token, refreshAccessToken, logout } = useAuth()

  async function apiFetch(path, options = {}) {
    const headers = {
      ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
      ...options.headers,
    }

    try {
      return await $fetch(base + path, { ...options, headers })
    } catch (error) {
      if (error?.status === 401) {
        try {
          await refreshAccessToken()
          return await $fetch(base + path, {
            ...options,
            headers: {
              ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
              ...options.headers,
            },
          })
        } catch {
          await logout()
        }
      }
      throw error
    }
  }

  return { apiFetch, token }
}
