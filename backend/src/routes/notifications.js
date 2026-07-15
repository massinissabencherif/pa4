import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { BADGES } from "../lib/badges.js";
import prisma from "../lib/prisma.js";

const router = Router();

function parsePagination(query, defaults = { limit: 20, max: 100 }) {
  const limitRaw = Number.parseInt(query.limit, 10)
  const offsetRaw = Number.parseInt(query.offset, 10)
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), defaults.max) : defaults.limit
  const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0
  return { limit, offset }
}

// Construit le lien de destination selon le type — évite au frontend de
// connaître la structure des routes /guides, /profile, etc.
async function attachLinks(notifications, prisma) {
  const guideReplyIds = notifications
    .filter((n) => n.type === "GUIDE_REPLY" && n.entityId)
    .map((n) => n.entityId);

  const replyLinks = new Map();
  if (guideReplyIds.length) {
    const replies = await prisma.guideReply.findMany({
      where: { id: { in: guideReplyIds } },
      select: { id: true, topicId: true, topic: { select: { guide: { select: { slug: true } } } } },
    });
    for (const r of replies) {
      replyLinks.set(r.id, `/guides/${r.topic.guide.slug}/topics/${r.topicId}`);
    }
  }

  return notifications.map((n) => {
    let link = "/";
    if (n.type === "FOLLOW" && n.actor) link = `/profile/${n.actor.username}`;
    else if (n.type === "REVIEW_COMMENT") link = "/reviews";
    else if (n.type === "GUIDE_REPLY") link = replyLinks.get(n.entityId) || "/";
    else if (n.type === "BADGE") link = "/dashboard";

    const badge = n.type === "BADGE" ? BADGES[n.entityId] || null : null;
    return { ...n, link, badge };
  });
}

// GET /notifications — liste paginée, plus récentes en premier
router.get("/notifications", requireAuth, async (req, res) => {
  const { limit, offset } = parsePagination(req.query, { limit: 20, max: 50 });

  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    include: { actor: { select: { id: true, username: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  res.json(await attachLinks(notifications, prisma));
});

// GET /notifications/unread-count
router.get("/notifications/unread-count", requireAuth, async (req, res) => {
  const count = await prisma.notification.count({
    where: { userId: req.user.id, readAt: null },
  });
  res.json({ count });
});

// PATCH /notifications/read-all — tout marquer comme lu
// (déclarée avant /:id/read pour ne pas être capturée par le paramètre :id)
router.patch("/notifications/read-all", requireAuth, async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  res.json({ success: true });
});

// PATCH /notifications/:id/read — marquer une notification comme lue
router.patch("/notifications/:id/read", requireAuth, async (req, res) => {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification) return res.status(404).json({ error: "Notification introuvable" });
  if (notification.userId !== req.user.id) return res.status(403).json({ error: "Interdit" });

  const updated = await prisma.notification.update({
    where: { id: req.params.id },
    data: { readAt: notification.readAt || new Date() },
  });
  res.json(updated);
});

export default router;
