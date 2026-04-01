import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAdmin, requireSuperAdmin } from "../middleware/requireAdmin.js";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

const router = Router();

// ─── Multer config ────────────────────────────────────────────────────────────

const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

function fileFilter(allowedTypes) {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non autorisé : ${file.mimetype}`), false);
    }
  };
}

const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `comic-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `cover-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const uploadFields = multer({
  storage: pdfStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
}).fields([
  { name: "pdf", maxCount: 1 },
  { name: "cover", maxCount: 1 },
]);

// ─── Setup premier admin ──────────────────────────────────────────────────────

// POST /admin/setup — crée le premier super admin si aucun n'existe encore
router.post("/admin/setup", requireAuth, async (req, res) => {
  const adminExists = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
  });
  if (adminExists) {
    return res.status(409).json({ error: "Un administrateur existe déjà" });
  }
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { role: "SUPER_ADMIN" },
    select: { id: true, email: true, username: true, role: true },
  });
  res.json({ message: "Compte promu super administrateur", user });
});

// ─── Gestion des utilisateurs (SUPER_ADMIN uniquement) ───────────────────────

// GET /admin/users — liste tous les utilisateurs
router.get("/admin/users", requireSuperAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, email: true, username: true, role: true,
      totpEnabled: true, createdAt: true,
    },
  });
  res.json(users);
});

// PATCH /admin/users/:id/role — promouvoir/rétrograder un utilisateur (USER ↔ ADMIN)
router.patch("/admin/users/:id/role", requireSuperAdmin, async (req, res) => {
  const { role } = req.body;
  if (!["USER", "ADMIN"].includes(role)) {
    return res.status(400).json({ error: "Rôle invalide. Valeurs acceptées : USER, ADMIN" });
  }

  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ error: "Utilisateur introuvable" });
  if (target.role === "SUPER_ADMIN") {
    return res.status(403).json({ error: "Impossible de modifier le rôle d'un super administrateur" });
  }
  if (target.id === req.user.id) {
    return res.status(403).json({ error: "Vous ne pouvez pas modifier votre propre rôle" });
  }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
    select: { id: true, email: true, username: true, role: true, totpEnabled: true },
  });
  res.json(updated);
});

// ─── Routes admin ────────────────────────────────────────────────────────────

// GET /admin/comics — liste tous les comics
router.get("/admin/comics", requireAdmin, async (req, res) => {
  const comics = await prisma.comic.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, externalId: true, title: true, coverUrl: true,
      pdfUrl: true, authors: true, publisher: true, genres: true, publishedAt: true, createdAt: true,
      _count: { select: { readingEntries: true, reviews: true } },
    },
  });
  res.json(comics);
});

// POST /admin/comics — uploader un comic (PDF + métadonnées)
router.post("/admin/comics", requireAdmin, (req, res) => {
  uploadFields(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const { title, description, authors, publisher, genres, publishedAt } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: "Le titre est requis" });
    }
    if (!req.files?.pdf?.[0]) {
      return res.status(400).json({ error: "Le fichier PDF est requis" });
    }

    const pdfFile = req.files.pdf[0];
    const coverFile = req.files?.cover?.[0];

    const protocol = req.get("x-forwarded-proto") || req.protocol;
    const baseUrl = `${protocol}://${req.get("host")}`;
    const pdfUrl = `${baseUrl}/uploads/${pdfFile.filename}`;
    const coverUrl = coverFile ? `${baseUrl}/uploads/${coverFile.filename}` : null;

    const authorsArr = authors
      ? authors.split(",").map((a) => a.trim()).filter(Boolean)
      : [];
    const genresArr = genres
      ? genres.split(",").map((g) => g.trim()).filter(Boolean)
      : [];

    const comic = await prisma.comic.create({
      data: {
        externalId: `manual-${Date.now()}`,
        title: title.trim(),
        description: description?.trim() || null,
        coverUrl,
        pdfUrl,
        authors: authorsArr,
        publisher: publisher?.trim() || null,
        genres: genresArr,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
      },
    });

    res.status(201).json(comic);
  });
});

// PATCH /admin/comics/:id — modifier les métadonnées
router.patch("/admin/comics/:id", requireAdmin, async (req, res) => {
  const { title, description, authors, publisher, genres, publishedAt, authorIds } = req.body;

  const comic = await prisma.comic.findUnique({ where: { id: req.params.id } });
  if (!comic) return res.status(404).json({ error: "Comic introuvable" });

  const updates = {};
  if (title?.trim()) updates.title = title.trim();
  if (description !== undefined) updates.description = description?.trim() || null;
  if (authors !== undefined)
    updates.authors = authors.split(",").map((a) => a.trim()).filter(Boolean);
  if (publisher !== undefined)
    updates.publisher = publisher?.trim() || null;
  if (genres !== undefined)
    updates.genres = genres.split(",").map((g) => g.trim()).filter(Boolean);
  if (publishedAt !== undefined)
    updates.publishedAt = publishedAt ? new Date(publishedAt) : null;

  const updated = await prisma.comic.update({ where: { id: req.params.id }, data: updates });

  // Mettre à jour les liaisons auteurs si fourni
  if (Array.isArray(authorIds)) {
    await prisma.authorOnComic.deleteMany({ where: { comicId: req.params.id } });
    if (authorIds.length > 0) {
      await prisma.authorOnComic.createMany({
        data: authorIds.map((authorId) => ({ authorId, comicId: req.params.id })),
        skipDuplicates: true,
      });
    }
  }

  res.json(updated);
});

// DELETE /admin/comics/:id — supprimer un comic et ses fichiers
router.delete("/admin/comics/:id", requireAdmin, async (req, res) => {
  const comic = await prisma.comic.findUnique({ where: { id: req.params.id } });
  if (!comic) return res.status(404).json({ error: "Comic introuvable" });

  // Supprimer les fichiers physiques
  for (const url of [comic.pdfUrl, comic.coverUrl]) {
    if (url) {
      const filename = url.split("/uploads/")[1];
      if (filename) {
        const filePath = path.join(uploadDir, filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }
  }

  await prisma.comic.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// ─── Gestion des auteurs ──────────────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// GET /admin/authors
router.get("/admin/authors", requireAdmin, async (req, res) => {
  const authors = await prisma.author.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { comics: true } } },
  });
  res.json(authors);
});

// POST /admin/authors
router.post("/admin/authors", requireAdmin, async (req, res) => {
  const { name, bio, birthDate } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Le nom est requis" });

  const baseSlug = slugify(name.trim());
  let slug = baseSlug;
  let i = 1;
  while (await prisma.author.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${i++}`;
  }

  const author = await prisma.author.create({
    data: {
      name: name.trim(),
      slug,
      bio: bio?.trim() || null,
      birthDate: birthDate ? new Date(birthDate) : null,
    },
  });
  res.status(201).json(author);
});

// PATCH /admin/authors/:id
router.patch("/admin/authors/:id", requireAdmin, async (req, res) => {
  const { name, bio, birthDate } = req.body;
  const author = await prisma.author.findUnique({ where: { id: req.params.id } });
  if (!author) return res.status(404).json({ error: "Auteur introuvable" });

  const updates = {};
  if (name?.trim()) {
    updates.name = name.trim();
    updates.slug = slugify(name.trim());
  }
  if (bio !== undefined) updates.bio = bio?.trim() || null;
  if (birthDate !== undefined) updates.birthDate = birthDate ? new Date(birthDate) : null;

  const updated = await prisma.author.update({ where: { id: req.params.id }, data: updates });
  res.json(updated);
});

// DELETE /admin/authors/:id
router.delete("/admin/authors/:id", requireAdmin, async (req, res) => {
  const author = await prisma.author.findUnique({ where: { id: req.params.id } });
  if (!author) return res.status(404).json({ error: "Auteur introuvable" });
  await prisma.author.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// PATCH /admin/comics/:id/authors — lier/délier des auteurs à un comic
router.patch("/admin/comics/:id/authors", requireAdmin, async (req, res) => {
  const { authorIds } = req.body; // string[]
  if (!Array.isArray(authorIds)) return res.status(400).json({ error: "authorIds doit être un tableau" });

  const comic = await prisma.comic.findUnique({ where: { id: req.params.id } });
  if (!comic) return res.status(404).json({ error: "Comic introuvable" });

  // Supprimer toutes les liaisons existantes puis recréer
  await prisma.authorOnComic.deleteMany({ where: { comicId: req.params.id } });
  if (authorIds.length > 0) {
    await prisma.authorOnComic.createMany({
      data: authorIds.map((authorId) => ({ authorId, comicId: req.params.id })),
      skipDuplicates: true,
    });
  }
  res.json({ linked: authorIds.length });
});

// GET /admin/stats — statistiques globales
router.get("/admin/stats", requireAdmin, async (req, res) => {
  const [users, comics, reviews, readingEntries] = await Promise.all([
    prisma.user.count(),
    prisma.comic.count(),
    prisma.review.count(),
    prisma.readingEntry.count(),
  ]);
  res.json({ users, comics, reviews, readingEntries });
});

export default router;
