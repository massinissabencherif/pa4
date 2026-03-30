import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

const router = Router();

// GET /me — profil connecté
router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true, email: true, username: true, role: true, totpEnabled: true, createdAt: true,
      _count: {
        select: { readingEntries: true, reviews: true, lists: true, following: true, followers: true },
      },
    },
  });
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
  res.json(user);
});

// GET /users/:username — profil public
router.get("/users/:username", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { username: req.params.username },
    select: {
      id: true, username: true, createdAt: true,
      _count: {
        select: { readingEntries: true, reviews: true, following: true, followers: true },
      },
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { comic: { select: { title: true, coverUrl: true, externalId: true } } },
      },
      lists: {
        where: { isPublic: true },
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { items: true } } },
      },
    },
  });
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
  res.json(user);
});

// GET /users/:username/reviews — tous les avis publics d'un utilisateur
router.get("/users/:username/reviews", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

  const reviews = await prisma.review.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      comic: { select: { id: true, externalId: true, title: true, coverUrl: true } },
    },
  });
  res.json(reviews);
});

// GET /users/:id/follow — est-ce que je suis cet utilisateur ?
router.get("/users/:id/follow", requireAuth, async (req, res) => {
  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: req.user.id, followingId: req.params.id } },
  });
  res.json({ following: !!follow });
});

// POST /users/:id/follow — suivre
router.post("/users/:id/follow", requireAuth, async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: "Tu ne peux pas te suivre toi-même" });
  }
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ error: "Utilisateur introuvable" });

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: req.user.id, followingId: req.params.id } },
  });
  if (existing) return res.status(409).json({ error: "Déjà suivi" });

  await prisma.follow.create({
    data: { followerId: req.user.id, followingId: req.params.id },
  });
  res.status(201).json({ message: "Suivi" });
});

// DELETE /users/:id/follow — ne plus suivre
router.delete("/users/:id/follow", requireAuth, async (req, res) => {
  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: req.user.id, followingId: req.params.id } },
  });
  if (!follow) return res.status(404).json({ error: "Pas abonné à cet utilisateur" });

  await prisma.follow.delete({
    where: { followerId_followingId: { followerId: req.user.id, followingId: req.params.id } },
  });
  res.status(204).end();
});

export default router;
