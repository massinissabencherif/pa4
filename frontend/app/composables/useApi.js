export function useApi() {
  const config = useRuntimeConfig()
  const base = config.public.apiBase

  const token = useCookie('auth_token')

  function apiFetch(path, options = {}) {
    return $fetch(base + path, {
      ...options,
      headers: {
        ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
        ...options.headers,
      },
    })
  }

  return { apiFetch, token }
}
