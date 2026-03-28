import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

const router = Router();

// POST /reading-list — ajouter un comic
router.post("/reading-list", requireAuth, async (req, res) => {
  const { comicId } = req.body;
  if (!comicId) return res.status(400).json({ error: "comicId est requis" });

  const comic = await prisma.comic.findUnique({ where: { id: comicId } });
  if (!comic) return res.status(404).json({ error: "Comic introuvable" });

  const existing = await prisma.readingEntry.findUnique({
    where: { userId_comicId: { userId: req.user.id, comicId } },
  });
  if (existing) return res.status(409).json({ error: "Comic déjà dans ta liste", entry: existing });

  const entry = await prisma.readingEntry.create({
    data: { userId: req.user.id, comicId },
    include: { comic: true },
  });
  res.status(201).json(entry);
});

// DELETE /reading-list/:id — retirer un comic
router.delete("/reading-list/:id", requireAuth, async (req, res) => {
  const entry = await prisma.readingEntry.findUnique({ where: { id: req.params.id } });
  if (!entry) return res.status(404).json({ error: "Entrée introuvable" });
  if (entry.userId !== req.user.id) return res.status(403).json({ error: "Interdit" });

  await prisma.readingEntry.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// PATCH /reading-list/:id/status — changer le statut
router.patch("/reading-list/:id/status", requireAuth, async (req, res) => {
  const { status } = req.body;
  const valid = ["TO_READ", "IN_PROGRESS", "FINISHED"];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `status doit être parmi : ${valid.join(", ")}` });
  }

  const entry = await prisma.readingEntry.findUnique({ where: { id: req.params.id } });
  if (!entry) return res.status(404).json({ error: "Entrée introuvable" });
  if (entry.userId !== req.user.id) return res.status(403).json({ error: "Interdit" });

  const updates = { status };
  if (status === "IN_PROGRESS" && !entry.startedAt) updates.startedAt = new Date();
  if (status === "FINISHED" && !entry.finishedAt) updates.finishedAt = new Date();

  const updated = await prisma.readingEntry.update({
    where: { id: req.params.id },
    data: updates,
    include: { comic: true },
  });
  res.json(updated);
});

// GET /history — journal de lecture de l'utilisateur
router.get("/history", requireAuth, async (req, res) => {
  const entries = await prisma.readingEntry.findMany({
    where: { userId: req.user.id },
    include: { comic: true },
    orderBy: { updatedAt: "desc" },
  });
  res.json(entries);
});

export default router;
