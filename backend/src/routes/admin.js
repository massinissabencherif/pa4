import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAdmin } from "../middleware/requireAdmin.js";
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

// POST /admin/setup — transforme un compte en admin si aucun admin n'existe encore
router.post("/admin/setup", requireAuth, async (req, res) => {
  const adminExists = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (adminExists) {
    return res.status(409).json({ error: "Un administrateur existe déjà" });
  }
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { role: "ADMIN" },
    select: { id: true, email: true, username: true, role: true },
  });
  res.json({ message: "Compte promu administrateur", user });
});

// ─── Routes admin ────────────────────────────────────────────────────────────

// GET /admin/comics — liste tous les comics
router.get("/admin/comics", requireAdmin, async (req, res) => {
  const comics = await prisma.comic.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, externalId: true, title: true, coverUrl: true,
      pdfUrl: true, authors: true, genres: true, publishedAt: true, createdAt: true,
      _count: { select: { readingEntries: true, reviews: true } },
    },
  });
  res.json(comics);
});

// POST /admin/comics — uploader un comic (PDF + métadonnées)
router.post("/admin/comics", requireAdmin, (req, res) => {
  uploadFields(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const { title, description, authors, genres, publishedAt } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: "Le titre est requis" });
    }
    if (!req.files?.pdf?.[0]) {
      return res.status(400).json({ error: "Le fichier PDF est requis" });
    }

    const pdfFile = req.files.pdf[0];
    const coverFile = req.files?.cover?.[0];

    const baseUrl = `${req.protocol}://${req.get("host")}`;
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
        genres: genresArr,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
      },
    });

    res.status(201).json(comic);
  });
});

// PATCH /admin/comics/:id — modifier les métadonnées
router.patch("/admin/comics/:id", requireAdmin, async (req, res) => {
  const { title, description, authors, genres, publishedAt } = req.body;

  const comic = await prisma.comic.findUnique({ where: { id: req.params.id } });
  if (!comic) return res.status(404).json({ error: "Comic introuvable" });

  const updates = {};
  if (title?.trim()) updates.title = title.trim();
  if (description !== undefined) updates.description = description?.trim() || null;
  if (authors !== undefined)
    updates.authors = authors.split(",").map((a) => a.trim()).filter(Boolean);
  if (genres !== undefined)
    updates.genres = genres.split(",").map((g) => g.trim()).filter(Boolean);
  if (publishedAt !== undefined)
    updates.publishedAt = publishedAt ? new Date(publishedAt) : null;

  const updated = await prisma.comic.update({ where: { id: req.params.id }, data: updates });
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
