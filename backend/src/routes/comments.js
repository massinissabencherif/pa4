import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = Router();

// GET /comments/top-liked?period=7d&limit=5
router.get("/top-liked", optionalAuth, async (req, res) => {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 5, 1), 20);
  const period = req.query.period || "7d";

  let since = null;
  if (period === "7d") since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  else if (period === "30d") since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  else if (period === "today") {
    const d = new Date();
    since = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  const where = since ? { createdAt: { gte: since } } : {};

  const comments = await prisma.comment.findMany({
    where,
    include: {
      user: { select: { id: true, username: true } },
      likes: { select: { userId: true } },
      review: {
        include: {
          comic: { select: { id: true, externalId: true, title: true, coverUrl: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit * 5,
  });

  const ranked = comments
    .map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      likeCount: c.likes.length,
      likedByMe: req.user ? c.likes.some((l) => l.userId === req.user.id) : false,
      user: c.user,
      review: { id: c.review.id, comic: c.review.comic },
    }))
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, limit);

  res.json({ comments: ranked });
});

// POST /comments/:id/like
router.post("/:id/like", requireAuth, async (req, res) => {
  const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
  if (!comment) return res.status(404).json({ error: "Commentaire introuvable" });

  await prisma.commentLike.upsert({
    where: { userId_commentId: { userId: req.user.id, commentId: req.params.id } },
    create: { userId: req.user.id, commentId: req.params.id },
    update: {},
  });

  const likeCount = await prisma.commentLike.count({ where: { commentId: req.params.id } });
  res.json({ liked: true, likeCount });
});

// DELETE /comments/:id/like
router.delete("/:id/like", requireAuth, async (req, res) => {
  await prisma.commentLike.deleteMany({
    where: { userId: req.user.id, commentId: req.params.id },
  });

  const likeCount = await prisma.commentLike.count({ where: { commentId: req.params.id } });
  res.json({ liked: false, likeCount });
});

export default router;
