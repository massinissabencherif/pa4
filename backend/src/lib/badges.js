import { notify } from "./notifications.js"

// Définition des 10 badges disponibles
export const BADGES = {
  first_read: {
    key: "first_read",
    name: "Premier pas",
    description: "Terminer son premier comic",
    icon: "📖",
  },
  bookworm: {
    key: "bookworm",
    name: "Rat de bibliothèque",
    description: "Terminer 5 comics",
    icon: "🐛",
  },
  librarian: {
    key: "librarian",
    name: "Bibliothécaire",
    description: "Terminer 20 comics",
    icon: "🏛️",
  },
  first_review: {
    key: "first_review",
    name: "Critique en herbe",
    description: "Poster son premier avis",
    icon: "✍️",
  },
  top_critic: {
    key: "top_critic",
    name: "Grand critique",
    description: "Poster 10 avis",
    icon: "🏆",
  },
  social: {
    key: "social",
    name: "Connecté",
    description: "Suivre 5 personnes",
    icon: "🤝",
  },
  explorer: {
    key: "explorer",
    name: "Explorateur",
    description: "Lire des comics de 3 genres différents",
    icon: "🧭",
  },
  genre_master: {
    key: "genre_master",
    name: "Maître des genres",
    description: "Lire des comics de 5 genres différents",
    icon: "🎭",
  },
  in_progress_collector: {
    key: "in_progress_collector",
    name: "Multitâche",
    description: "Avoir 3 comics en cours simultanément",
    icon: "⚡",
  },
  early_adopter: {
    key: "early_adopter",
    name: "Pionnier",
    description: "Faire partie des 50 premiers inscrits",
    icon: "🌟",
  },
  streak_7: {
    key: "streak_7",
    name: "Une semaine de feu",
    description: "Lire 7 jours d'affilée",
    icon: "🔥",
  },
  streak_30: {
    key: "streak_30",
    name: "Le marathonien",
    description: "Lire 30 jours d'affilée",
    icon: "🏃",
  },
  streak_100: {
    key: "streak_100",
    name: "Inarrêtable",
    description: "Lire 100 jours d'affilée",
    icon: "💯",
  },
}

// Vérifie et attribue les badges mérités pour un user
export async function checkAndAwardBadges(userId, prisma) {
  const awarded = []

  const [finishedCount, reviewCount, followingCount, inProgressCount, userRank, finishedEntries, streakUser] =
    await Promise.all([
      prisma.readingEntry.count({ where: { userId, status: "FINISHED" } }),
      prisma.review.count({ where: { userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
      prisma.readingEntry.count({ where: { userId, status: "IN_PROGRESS" } }),
      prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }).then((u) =>
        u ? prisma.user.count({ where: { createdAt: { lte: u.createdAt } } }) : 999
      ),
      prisma.readingEntry.findMany({
        where: { userId, status: "FINISHED" },
        include: { comic: { select: { genres: true } } },
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { longestStreak: true } }),
    ])

  const uniqueGenres = new Set(finishedEntries.flatMap((e) => e.comic.genres)).size
  const longestStreak = streakUser?.longestStreak ?? 0

  const conditions = [
    { key: "first_read", met: finishedCount >= 1 },
    { key: "bookworm", met: finishedCount >= 5 },
    { key: "librarian", met: finishedCount >= 20 },
    { key: "first_review", met: reviewCount >= 1 },
    { key: "top_critic", met: reviewCount >= 10 },
    { key: "social", met: followingCount >= 5 },
    { key: "explorer", met: uniqueGenres >= 3 },
    { key: "genre_master", met: uniqueGenres >= 5 },
    { key: "in_progress_collector", met: inProgressCount >= 3 },
    { key: "early_adopter", met: userRank <= 50 },
    { key: "streak_7", met: longestStreak >= 7 },
    { key: "streak_30", met: longestStreak >= 30 },
    { key: "streak_100", met: longestStreak >= 100 },
  ]

  for (const { key, met } of conditions) {
    if (!met) continue
    try {
      await prisma.userBadge.create({ data: { userId, badgeKey: key } })
      awarded.push(key)
    } catch {
      // Déjà attribué (unique constraint)
    }
  }

  return awarded
}

// Vérifie, attribue, et notifie les nouveaux badges — à appeler après toute action
// pouvant en débloquer un (lecture terminée, avis posté, follow, inscription)
export async function awardBadgesAndNotify(userId, prisma) {
  const awarded = await checkAndAwardBadges(userId, prisma)
  for (const badgeKey of awarded) {
    await notify(prisma, { userId, type: "BADGE", entityId: badgeKey })
  }
  return awarded
}
