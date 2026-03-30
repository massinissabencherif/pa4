import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

const router = Router();

// GET /feed — activités des utilisateurs suivis
router.get("/feed", requireAuth, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 30, 50);

  // Récupérer les IDs des gens suivis
  const follows = await prisma.follow.findMany({
    where: { followerId: req.user.id },
    select: { followingId: true },
  });
  const followingIds = follows.map((f) => f.followingId);

  if (followingIds.length === 0) {
    return res.json({ events: [], empty: true });
  }

  // Récupérer les avis récents
  const reviews = await prisma.review.findMany({
    where: { userId: { in: followingIds } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true, rating: true, content: true, createdAt: true,
      user: { select: { id: true, username: true } },
      comic: { select: { id: true, title: true, coverUrl: true } },
    },
  });

  // Récupérer les lectures terminées récentes
  const finished = await prisma.readingEntry.findMany({
    where: { userId: { in: followingIds }, status: "FINISHED", finishedAt: { not: null } },
    orderBy: { finishedAt: "desc" },
    take: limit,
    select: {
      id: true, finishedAt: true, status: true,
      user: { select: { id: true, username: true } },
      comic: { select: { id: true, title: true, coverUrl: true } },
    },
  });

  // Récupérer les lectures commencées récentes
  const started = await prisma.readingEntry.findMany({
    where: { userId: { in: followingIds }, status: "IN_PROGRESS", startedAt: { not: null } },
    orderBy: { startedAt: "desc" },
    take: limit,
    select: {
      id: true, startedAt: true, status: true,
      user: { select: { id: true, username: true } },
      comic: { select: { id: true, title: true, coverUrl: true } },
    },
  });

  // Récupérer les ajouts à la liste
  const added = await prisma.readingEntry.findMany({
    where: { userId: { in: followingIds }, status: "TO_READ" },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true, createdAt: true,
      user: { select: { id: true, username: true } },
      comic: { select: { id: true, title: true, coverUrl: true } },
    },
  });

  // Fusionner et trier par date
  const events = [
    ...reviews.map((r) => ({ type: "REVIEW", date: r.createdAt, user: r.user, comic: r.comic, data: { rating: r.rating, content: r.content }, id: r.id })),
    ...finished.map((e) => ({ type: "FINISHED", date: e.finishedAt, user: e.user, comic: e.comic, data: {}, id: e.id })),
    ...started.map((e) => ({ type: "STARTED", date: e.startedAt, user: e.user, comic: e.comic, data: {}, id: e.id })),
    ...added.map((e) => ({ type: "ADDED", date: e.createdAt, user: e.user, comic: e.comic, data: {}, id: e.id })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);

  res.json({ events, empty: events.length === 0 });
});

// GET /recommendations — comics recommandés basés sur les goûts
router.get("/recommendations", requireAuth, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 12, 24);

  // Comics déjà dans la liste de l'utilisateur
  const myEntries = await prisma.readingEntry.findMany({
    where: { userId: req.user.id },
    select: { comicId: true, comic: { select: { genres: true, authors: true } } },
  });

  const myComicIds = myEntries.map((e) => e.comicId);

  // Extraire genres et auteurs favoris
  const genreCount = {};
  const authorCount = {};
  for (const entry of myEntries) {
    for (const g of entry.comic.genres) genreCount[g] = (genreCount[g] || 0) + 1;
    for (const a of entry.comic.authors) authorCount[a] = (authorCount[a] || 0) + 1;
  }

  const topGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([g]) => g);
  const topAuthors = Object.entries(authorCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([a]) => a);

  // Si pas d'historique, retourner les comics les mieux notés
  if (topGenres.length === 0) {
    const popular = await prisma.comic.findMany({
      where: { id: { notIn: myComicIds } },
      take: limit,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, coverUrl: true, genres: true, authors: true, _count: { select: { reviews: true } } },
    });
    return res.json({ recommendations: popular, basis: "popular" });
  }

  // Chercher des comics avec genres/auteurs similaires
  const candidates = await prisma.comic.findMany({
    where: {
      id: { notIn: myComicIds },
      OR: [
        { genres: { hasSome: topGenres } },
        { authors: { hasSome: topAuthors } },
      ],
    },
    take: limit * 3,
    select: {
      id: true, title: true, coverUrl: true, genres: true, authors: true,
      _count: { select: { reviews: true } },
      reviews: { select: { rating: true } },
    },
  });

  // Scorer les candidats
  const scored = candidates.map((comic) => {
    let score = 0;
    for (const g of comic.genres) if (topGenres.includes(g)) score += genreCount[g] || 1;
    for (const a of comic.authors) if (topAuthors.includes(a)) score += (authorCount[a] || 1) * 2;
    const avgRating = comic.reviews.length > 0
      ? comic.reviews.reduce((sum, r) => sum + r.rating, 0) / comic.reviews.length
      : 3;
    score += avgRating;
    return { ...comic, reviews: undefined, score };
  });

  scored.sort((a, b) => b.score - a.score);

  res.json({ recommendations: scored.slice(0, limit), basis: "taste", topGenres });
});

export default router;
