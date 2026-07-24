import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { REPORT_TARGET_TYPES, REPORT_REASONS, resolveReportTarget, deleteReportedContent } from "../lib/reports.js";

const router = Router();

function parsePagination(query, defaults = { limit: 20, max: 100 }) {
  const limitRaw = Number.parseInt(query.limit, 10);
  const offsetRaw = Number.parseInt(query.offset, 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), defaults.max) : defaults.limit;
  const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;
  return { limit, offset };
}

const REPORT_INCLUDE = {
  reporter: { select: { id: true, username: true } },
  resolvedBy: { select: { id: true, username: true } },
};

// POST /reports — signaler un contenu (review, commentaire, topic ou réponse de guide)
router.post("/reports", requireAuth, async (req, res) => {
  const { targetType, targetId, reason, details } = req.body;

  if (!REPORT_TARGET_TYPES.includes(targetType)) {
    return res.status(400).json({ error: "Type de contenu invalide" });
  }
  if (!targetId || typeof targetId !== "string") {
    return res.status(400).json({ error: "targetId requis" });
  }
  if (!REPORT_REASONS.includes(reason)) {
    return res.status(400).json({ error: "Motif invalide" });
  }
  if (reason === "AUTRE" && !details?.trim()) {
    return res.status(400).json({ error: "Précise le motif pour \"Autre\"" });
  }
  if (details && details.length > 500) {
    return res.status(400).json({ error: "Détails trop longs (max 500 caractères)" });
  }

  const target = await resolveReportTarget(targetType, targetId);
  if (!target) return res.status(404).json({ error: "Contenu introuvable" });

  if (target.authorId === req.user.id) {
    return res.status(400).json({ error: "Impossible de signaler son propre contenu" });
  }

  try {
    const report = await prisma.report.create({
      data: {
        reporterId: req.user.id,
        targetType,
        targetId,
        reason,
        details: details?.trim() || null,
        contentSnapshot: target.snapshot,
        authorUsername: target.authorUsername,
      },
    });
    res.status(201).json(report);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Tu as déjà signalé ce contenu" });
    }
    throw err;
  }
});

// GET /admin/reports?status=PENDING — file de modération
router.get("/admin/reports", requireAdmin, async (req, res) => {
  const { limit, offset } = parsePagination(req.query, { limit: 20, max: 100 });
  const status = ["PENDING", "RESOLVED", "DISMISSED"].includes(req.query.status) ? req.query.status : "PENDING";

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where: { status },
      include: REPORT_INCLUDE,
      orderBy: { createdAt: status === "PENDING" ? "asc" : "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.report.count({ where: { status } }),
  ]);

  res.json({ reports, total });
});

// PATCH /admin/reports/:id — RESOLVE (supprime le contenu) ou DISMISS (rejette)
router.patch("/admin/reports/:id", requireAdmin, async (req, res) => {
  const { action } = req.body;
  if (!["RESOLVE", "DISMISS"].includes(action)) {
    return res.status(400).json({ error: "action doit être RESOLVE ou DISMISS" });
  }

  const report = await prisma.report.findUnique({ where: { id: req.params.id } });
  if (!report) return res.status(404).json({ error: "Signalement introuvable" });
  if (report.status !== "PENDING") {
    return res.status(409).json({ error: "Ce signalement a déjà été traité" });
  }

  const resolvedAt = new Date();

  if (action === "RESOLVE") {
    // Tolérant : le contenu a pu être supprimé entre-temps par son auteur.
    await deleteReportedContent(report.targetType, report.targetId);
    // D'autres signalements en attente peuvent viser la même cible (plusieurs
    // reporters) — ils deviennent sans objet dès que le contenu est supprimé.
    await prisma.report.updateMany({
      where: { status: "PENDING", targetType: report.targetType, targetId: report.targetId },
      data: { status: "RESOLVED", resolvedById: req.user.id, resolvedAt },
    });
  } else {
    await prisma.report.update({
      where: { id: report.id },
      data: { status: "DISMISSED", resolvedById: req.user.id, resolvedAt },
    });
  }

  const updated = await prisma.report.findUnique({ where: { id: req.params.id }, include: REPORT_INCLUDE });
  res.json(updated);
});

export default router;
