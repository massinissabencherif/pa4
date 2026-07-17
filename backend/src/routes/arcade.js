import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { utcDateKey } from "../lib/arcade.js";

const router = Router();

// GET /arcade/me — profil joueur : XP total + état des défis du jour
router.get("/me", requireAuth, async (req, res) => {
  const today = utcDateKey();
  const [user, todayRuns] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.user.id }, select: { xp: true } }),
    prisma.arcadeRun.findMany({
      where: { userId: req.user.id, dateKey: today },
      select: { game: true, score: true, finishedAt: true },
    }),
  ]);

  res.json({
    xp: user?.xp ?? 0,
    today: Object.fromEntries(
      todayRuns.map((r) => [r.game, { score: r.score, finished: !!r.finishedAt }])
    ),
  });
});

export default router;
