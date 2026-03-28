import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

const router = Router();

// POST /reviews — créer un avis
router.post("/reviews", requireAuth, async (req, res) => {
  const { comicId, rating, content } = req.body;

  if (!comicId || rating == null) {
    return res.status(400).json({ error: "comicId et rating sont requis" });
  }
  if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
    return res.status(400).json({ error: "rating doit être un entier entre 1 et 5" });
  }

  const comic = await prisma.comic.findUnique({ where: { id: comicId } });
  if (!comic) return res.status(404).json({ error: "Comic introuvable" });

  const existing = await prisma.review.findUnique({
    where: { userId_comicId: { userId: req.user.id, comicId } },
  });
  if (existing) return res.status(409).json({ error: "Tu as déjà un avis sur ce comic", review: existing });

  const review = await prisma.review.create({
    data: { userId: req.user.id, comicId, rating: Number(rating), content: content || null },
    include: { comic: { select: { title: true } } },
  });
  res.status(201).json(review);
});

// PATCH /reviews/:id — modifier un avis
router.patch("/reviews/:id", requireAuth, async (req, res) => {
  const { rating, content } = req.body;

  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) return res.status(404).json({ error: "Avis introuvable" });
  if (review.userId !== req.user.id) return res.status(403).json({ error: "Interdit" });

  const updates = {};
  if (rating != null) {
    if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ error: "rating doit être un entier entre 1 et 5" });
    }
    updates.rating = Number(rating);
  }
  if (content !== undefined) updates.content = content || null;

  const updated = await prisma.review.update({
    where: { id: req.params.id },
    data: updates,
  });
  res.json(updated);
});

// DELETE /reviews/:id — supprimer un avis
router.delete("/reviews/:id", requireAuth, async (req, res) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) return res.status(404).json({ error: "Avis introuvable" });
  if (review.userId !== req.user.id) return res.status(403).json({ error: "Interdit" });

  await prisma.review.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// GET /reviews/me — tous mes avis
router.get("/reviews/me", requireAuth, async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { userId: req.user.id },
    include: { comic: true },
    orderBy: { updatedAt: "desc" },
  });
  res.json(reviews);
});

// GET /reviews/comic/:comicId — avis sur un comic (public)
router.get("/reviews/comic/:comicId", async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { comicId: req.params.comicId },
    include: { user: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(reviews);
});

export default router;
