import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

// GET /featured/current — le comic mis en avant en ce moment (public)
router.get("/current", async (req, res) => {
  const now = new Date();
  const featured = await prisma.featuredComic.findFirst({
    where: {
      startAt: { lte: now },
      OR: [{ endAt: null }, { endAt: { gt: now } }],
    },
    orderBy: { startAt: "desc" },
    include: {
      comic: {
        select: {
          id: true, externalId: true, title: true, description: true,
          coverUrl: true, genres: true, authors: true, publisher: true,
        },
      },
    },
  });

  if (!featured) return res.json({ featured: null });

  const agg = await prisma.review.aggregate({
    where: { comicId: featured.comicId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  res.json({
    featured: {
      id: featured.id,
      blurb: featured.blurb,
      since: featured.startAt,
      comic: {
        ...featured.comic,
        avgRating: agg._avg.rating,
        reviewCount: agg._count.rating,
      },
    },
  });
});

export default router;
