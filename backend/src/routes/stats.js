import { Router } from "express"
import { requireAuth } from "../middleware/auth.js"
import { checkAndAwardBadges, BADGES } from "../lib/badges.js"
import prisma from "../lib/prisma.js"

const router = Router()

// GET /stats/me — dashboard stats de l'utilisateur connecté
router.get("/me", requireAuth, async (req, res) => {
  const userId = req.user.id

  // Vérifier et attribuer les nouveaux badges
  await checkAndAwardBadges(userId, prisma)

  const [entries, reviews, followingCount, followersCount, userBadges, allUsers] =
    await Promise.all([
      prisma.readingEntry.findMany({
        where: { userId },
        include: { comic: { select: { genres: true, authors: true, title: true, coverUrl: true, externalId: true } } },
      }),
      prisma.review.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { comic: { select: { title: true, externalId: true } } },
      }),
      prisma.follow.count({ where: { followerId: userId } }),
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.userBadge.findMany({ where: { userId }, orderBy: { earnedAt: "asc" } }),
      prisma.user.count(),
    ])

  const finished = entries.filter((e) => e.status === "FINISHED")
  const inProgress = entries.filter((e) => e.status === "IN_PROGRESS")
  const toRead = entries.filter((e) => e.status === "TO_READ")

  // Genres les plus lus
  const genreCount = {}
  finished.forEach((e) => e.comic.genres.forEach((g) => { genreCount[g] = (genreCount[g] || 0) + 1 }))
  const topGenres = Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre, count]) => ({ genre, count }))

  // Auteurs les plus lus
  const authorCount = {}
  finished.forEach((e) => e.comic.authors.forEach((a) => { authorCount[a] = (authorCount[a] || 0) + 1 }))
  const topAuthors = Object.entries(authorCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([author, count]) => ({ author, count }))

  // Note moyenne donnée
  const avgRatingGiven =
    reviews.length > 0
      ? Number((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1))
      : null

  // Activité par mois (12 derniers mois)
  const now = new Date()
  const monthlyActivity = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleString("fr-FR", { month: "short", year: "2-digit" })
    const count = finished.filter((e) => {
      const f = new Date(e.finishedAt || e.updatedAt)
      return f.getFullYear() === d.getFullYear() && f.getMonth() === d.getMonth()
    }).length
    monthlyActivity.push({ label, count })
  }

  // Badges avec métadonnées
  const badges = userBadges.map((ub) => ({
    ...ub,
    ...(BADGES[ub.badgeKey] || { name: ub.badgeKey, description: "", icon: "🏅" }),
  }))

  res.json({
    counts: {
      finished: finished.length,
      inProgress: inProgress.length,
      toRead: toRead.length,
      total: entries.length,
      reviews: reviews.length,
      following: followingCount,
      followers: followersCount,
    },
    topGenres,
    topAuthors,
    avgRatingGiven,
    monthlyActivity,
    badges,
    recentReviews: reviews.slice(0, 5),
  })
})

// GET /stats/badges — tous les badges disponibles + ceux du user
router.get("/badges", requireAuth, async (req, res) => {
  const userBadges = await prisma.userBadge.findMany({ where: { userId: req.user.id } })
  const earned = new Set(userBadges.map((b) => b.badgeKey))

  const all = Object.values(BADGES).map((badge) => ({
    ...badge,
    earned: earned.has(badge.key),
    earnedAt: userBadges.find((b) => b.badgeKey === badge.key)?.earnedAt || null,
  }))

  res.json(all)
})

export default router
