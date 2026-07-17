<template>
  <div ref="rootEl" style="position:relative;">
    <button
      type="button"
      @click="toggle"
      style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;color:#fff;"
      :aria-label="unreadCount > 0 ? `Notifications (${unreadCount} non lues)` : 'Notifications'"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <span
        v-if="unreadCount > 0"
        style="position:absolute;top:3px;right:3px;min-width:14px;height:14px;padding:0 3px;border-radius:7px;background:#e02020;color:#fff;font-family:'Courier New',monospace;font-size:9px;line-height:14px;text-align:center;"
      >{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
    </button>

    <Transition name="notif-dropdown">
      <div
        v-if="open"
        role="menu"
        aria-label="Notifications"
        style="position:absolute;top:44px;right:0;width:320px;max-height:420px;overflow-y:auto;background:#111;border:1px solid #2a2a2a;border-top:2px solid #e02020;z-index:60;transform-origin:top right;"
      >
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #1e1e1e;">
          <span style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;color:#e02020;text-transform:uppercase;">Notifications</span>
          <button
            v-if="unreadCount > 0"
            type="button"
            @click="markAllRead"
            style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:1px;color:#fff;text-transform:uppercase;background:none;border:none;cursor:pointer;"
          >Tout marquer lu</button>
        </div>

        <div
          v-if="!notifications.length"
          style="padding:24px 14px;text-align:center;font-family:'Courier New',monospace;font-size:11px;color:#fff;"
        >Aucune notification pour l'instant</div>

        <NuxtLink
          v-for="n in notifications"
          :key="n.id"
          :to="n.link"
          @click="onClickNotification(n)"
          style="display:block;padding:10px 14px;border-bottom:1px solid #1a1a1a;text-decoration:none;transition:background 0.15s;"
          :style="!n.readAt ? 'background:rgba(224,32,32,0.06);' : ''"
        >
          <p style="font-family:'Courier New',monospace;font-size:12px;line-height:1.5;color:#fff;margin:0;">
            {{ messageFor(n) }}
          </p>
          <p style="font-family:'Courier New',monospace;font-size:9px;color:#666;margin-top:4px;">{{ timeAgo(n.createdAt) }}</p>
        </NuxtLink>
      </div>
    </Transition>
  </div>
</template>

<script setup>
const { unreadCount, notifications, fetchUnreadCount, fetchNotifications, markRead, markAllRead } = useNotifications()

const open = ref(false)
const rootEl = ref(null)

function messageFor(n) {
  const actor = n.actor?.username || 'Quelqu\'un'
  if (n.type === 'FOLLOW') return `${actor} a commencé à te suivre`
  if (n.type === 'REVIEW_COMMENT') return `${actor} a commenté ton avis`
  if (n.type === 'GUIDE_REPLY') return `${actor} a répondu à ton message`
  if (n.type === 'BADGE') return `${n.badge?.icon || '🏅'} Badge débloqué : ${n.badge?.name || 'Nouveau badge'}`
  return ''
}

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'à l\'instant'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `il y a ${days}j`
}

async function toggle() {
  open.value = !open.value
  if (open.value) await fetchNotifications()
}

function onClickNotification(n) {
  open.value = false
  markRead(n.id)
}

function onClickOutside(event) {
  if (open.value && rootEl.value && !rootEl.value.contains(event.target)) {
    open.value = false
  }
}

let pollInterval = null

onMounted(() => {
  fetchUnreadCount()
  document.addEventListener('click', onClickOutside)
  pollInterval = setInterval(fetchUnreadCount, 45_000)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<style scoped>
.notif-dropdown-enter-active,
.notif-dropdown-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.notif-dropdown-enter-from,
.notif-dropdown-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-8px);
}
@media (prefers-reduced-motion: reduce) {
  .notif-dropdown-enter-active,
  .notif-dropdown-leave-active {
    transition: opacity 0.2s ease;
  }
  .notif-dropdown-enter-from,
  .notif-dropdown-leave-to {
    transform: none;
  }
}
</style>
