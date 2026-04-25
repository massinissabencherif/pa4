const RESERVED_USERNAMES = new Set([
  "admin", "administrator", "root", "superadmin", "moderator", "mod",
  "support", "help", "api", "auth", "login", "logout", "register",
  "me", "users", "user", "profile", "settings", "dashboard", "feed",
  "comics", "comic", "authors", "author", "lists", "reviews", "review",
  "stats", "notifications", "search", "legal", "rgpd", "mentions-legales",
  "security", "system", "null", "undefined", "anonymous", "comicster",
])

export function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase()
}

export function isReservedUsername(username) {
  return RESERVED_USERNAMES.has(normalizeUsername(username))
}
