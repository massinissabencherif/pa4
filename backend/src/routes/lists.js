import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { slugify } from "../lib/slug.js";

const router = Router();

async function uniqueSlug(base) {
  let slug = slugify(base);
  let suffix = 0;
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const exists = await prisma.list.findUnique({ where: { slug: candidate } });
    if (!exists) return candidate;
    suffix++;
  }
}

// GET /lists — mes listes
router.get("/lists", requireAuth, async (req, res) => {
  const lists = await prisma.list.findMany({
    where: { userId: req.user.id },
    include: { _count: { select: { items: true } } },
    orderBy: { updatedAt: "desc" },
  });
  res.json(lists);
});

// GET /lists/discover — toutes les listes publiques (sans auth, avec recherche)
router.get("/lists/discover", async (req, res) => {
  const q = req.query.q?.trim() || "";
  const limit = Math.min(parseInt(req.query.limit) || 24, 50);
  const offset = parseInt(req.query.offset) || 0;

  const where = {
    isPublic: true,
    ...(q ? {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { user: { username: { contains: q, mode: "insensitive" } } },
      ],
    } : {}),
  };

  const [lists, total] = await Promise.all([
    prisma.list.findMany({
      where,
      include: {
        user: { select: { username: true } },
        _count: { select: { items: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.list.count({ where }),
  ]);

  res.json({ lists, total });
});

// GET /lists/public/:slug — liste publique (sans auth)
router.get("/lists/public/:slug", async (req, res) => {
  const list = await prisma.list.findUnique({
    where: { slug: req.params.slug },
    include: {
      user: { select: { username: true } },
      items: {
        include: { comic: true },
        orderBy: { addedAt: "desc" },
      },
    },
  });
  if (!list) return res.status(404).json({ error: "Liste introuvable" });
  if (!list.isPublic) return res.status(403).json({ error: "Cette liste est privée" });
  res.json(list);
});

// GET /lists/:id — détail d'une liste (propriétaire)
router.get("/lists/:id", requireAuth, async (req, res) => {
  const list = await prisma.list.findUnique({
    where: { id: req.params.id },
    include: {
      items: {
        include: { comic: true },
        orderBy: { addedAt: "desc" },
      },
    },
  });
  if (!list) return res.status(404).json({ error: "Liste introuvable" });
  if (list.userId !== req.user.id) return res.status(403).json({ error: "Interdit" });
  res.json(list);
});

// POST /lists — créer une liste
router.post("/lists", requireAuth, async (req, res) => {
  const { name, isPublic = false, description } = req.body;
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: "name est requis" });
  }

  const slug = await uniqueSlug(name.trim());
  const list = await prisma.list.create({
    data: {
      userId: req.user.id,
      name: name.trim(),
      slug,
      isPublic: Boolean(isPublic),
      description: description?.trim() || null,
    },
  });
  res.status(201).json(list);
});

// PATCH /lists/:id — renommer / modifier description
router.patch("/lists/:id", requireAuth, async (req, res) => {
  const { name, description } = req.body;
  const list = await prisma.list.findUnique({ where: { id: req.params.id } });
  if (!list) return res.status(404).json({ error: "Liste introuvable" });
  if (list.userId !== req.user.id) return res.status(403).json({ error: "Interdit" });

  const updates = {};
  if (name && name.trim().length > 0) updates.name = name.trim();
  if (description !== undefined) updates.description = description?.trim() || null;

  const updated = await prisma.list.update({ where: { id: req.params.id }, data: updates });
  res.json(updated);
});

// PATCH /lists/:id/visibility — basculer public/privé
router.patch("/lists/:id/visibility", requireAuth, async (req, res) => {
  const { isPublic } = req.body;
  if (typeof isPublic !== "boolean") {
    return res.status(400).json({ error: "isPublic (boolean) est requis" });
  }

  const list = await prisma.list.findUnique({ where: { id: req.params.id } });
  if (!list) return res.status(404).json({ error: "Liste introuvable" });
  if (list.userId !== req.user.id) return res.status(403).json({ error: "Interdit" });

  const updated = await prisma.list.update({
    where: { id: req.params.id },
    data: { isPublic },
  });
  res.json(updated);
});

// DELETE /lists/:id — supprimer une liste
router.delete("/lists/:id", requireAuth, async (req, res) => {
  const list = await prisma.list.findUnique({ where: { id: req.params.id } });
  if (!list) return res.status(404).json({ error: "Liste introuvable" });
  if (list.userId !== req.user.id) return res.status(403).json({ error: "Interdit" });

  await prisma.list.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// POST /lists/:id/comics — ajouter un comic
router.post("/lists/:id/comics", requireAuth, async (req, res) => {
  const { comicId } = req.body;
  if (!comicId) return res.status(400).json({ error: "comicId est requis" });

  const list = await prisma.list.findUnique({ where: { id: req.params.id } });
  if (!list) return res.status(404).json({ error: "Liste introuvable" });
  if (list.userId !== req.user.id) return res.status(403).json({ error: "Interdit" });

  const comic = await prisma.comic.findUnique({ where: { id: comicId } });
  if (!comic) return res.status(404).json({ error: "Comic introuvable" });

  const existing = await prisma.listItem.findUnique({
    where: { listId_comicId: { listId: req.params.id, comicId } },
  });
  if (existing) return res.status(409).json({ error: "Comic déjà dans cette liste" });

  const item = await prisma.listItem.create({
    data: { listId: req.params.id, comicId },
    include: { comic: true },
  });
  res.status(201).json(item);
});

// DELETE /lists/:id/comics/:comicId — retirer un comic
router.delete("/lists/:id/comics/:comicId", requireAuth, async (req, res) => {
  const list = await prisma.list.findUnique({ where: { id: req.params.id } });
  if (!list) return res.status(404).json({ error: "Liste introuvable" });
  if (list.userId !== req.user.id) return res.status(403).json({ error: "Interdit" });

  const item = await prisma.listItem.findUnique({
    where: { listId_comicId: { listId: req.params.id, comicId: req.params.comicId } },
  });
  if (!item) return res.status(404).json({ error: "Comic absent de cette liste" });

  await prisma.listItem.delete({
    where: { listId_comicId: { listId: req.params.id, comicId: req.params.comicId } },
  });
  res.json({ success: true });
});

export default router;
