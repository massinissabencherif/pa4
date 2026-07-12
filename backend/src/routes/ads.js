import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

const VALID_PLACEMENTS = ["HOME", "COMIC_DETAIL", "GUIDES_LIST", "GUIDE_DETAIL"];

// GET /ads?placement=HOME — un encart actif pour l'emplacement donné, ou aucun
router.get("/", async (req, res) => {
  const { placement } = req.query;
  if (!placement || !VALID_PLACEMENTS.includes(placement)) {
    return res.status(400).json({ error: `placement doit être l'un de : ${VALID_PLACEMENTS.join(", ")}` });
  }

  const now = new Date();
  const ads = await prisma.adBanner.findMany({
    where: {
      placement,
      isActive: true,
      AND: [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null }, { endAt: { gte: now } }] },
      ],
    },
    orderBy: { order: "asc" },
  });

  if (ads.length === 0) return res.json({ ad: null });

  const ad = ads[Math.floor(Math.random() * ads.length)];
  res.json({ ad });
});

export default router;
