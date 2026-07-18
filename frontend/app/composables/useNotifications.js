export function useNotifications() {
  const { apiFetch } = useApi()
  const unreadCount = useState('notifications-unread-count', () => 0)
  const notifications = useState('notifications-list', () => [])

  async function fetchUnreadCount() {
    try {
      const data = await apiFetch('/notifications/unread-count')
      unreadCount.value = data.count
    } catch {}
  }

  async function fetchNotifications() {
    try {
      notifications.value = await apiFetch('/notifications?limit=20')
    } catch {}
  }

  async function markRead(id) {
    const n = notifications.value.find((n) => n.id === id)
    if (!n || n.readAt) return
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' })
      n.readAt = new Date().toISOString()
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch {}
  }

  async function markAllRead() {
    try {
      await apiFetch('/notifications/read-all', { method: 'PATCH' })
      notifications.value.forEach((n) => { n.readAt = n.readAt || new Date().toISOString() })
      unreadCount.value = 0
    } catch {}
  }

  return { unreadCount, notifications, fetchUnreadCount, fetchNotifications, markRead, markAllRead }
}
