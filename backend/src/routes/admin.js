import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { requireAdmin, requireSuperAdmin } from "../middleware/requireAdmin.js";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { slugify } from "../lib/slug.js";

const router = Router();

// ─── Multer config ────────────────────────────────────────────────────────────

const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_PDF_MIME = ["application/pdf"];
const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_PDF_EXT = [".pdf"];
const ALLOWED_IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

// fileFilter effectivement appliqué — vérifie mimetype ET extension par champ
function comicFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === "pdf") {
    if (!ALLOWED_PDF_MIME.includes(file.mimetype)) {
      return cb(new Error(`Type MIME invalide pour le PDF : ${file.mimetype}. Attendu : application/pdf`), false);
    }
    if (!ALLOWED_PDF_EXT.includes(ext)) {
      return cb(new Error(`Extension invalide pour le PDF : ${ext}. Attendue : .pdf`), false);
    }
  } else if (file.fieldname === "cover") {
    if (!ALLOWED_IMAGE_MIME.includes(file.mimetype)) {
      return cb(new Error(`Type MIME invalide pour la couverture : ${file.mimetype}. Attendus : jpeg, png, webp, gif`), false);
    }
    if (!ALLOWED_IMAGE_EXT.includes(ext)) {
      return cb(new Error(`Extension invalide pour la couverture : ${ext}`), false);
    }
  } else {
    return cb(new Error(`Champ de fichier non autorisé : ${file.fieldname}`), false);
  }

  cb(null, true);
}

const comicStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const prefix = file.fieldname === "pdf" ? "comic" : "cover";
    cb(null, `${prefix}-${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
  },
});

const uploadFields = multer({
  storage: comicStorage,
  fileFilter: comicFileFilter,          // ← fileFilter maintenant réellement appliqué
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB global
}).fields([
  { name: "pdf",   maxCount: 1 },
  { name: "cover", maxCount: 1 },
]);

const MAX_COVER_SIZE = 10 * 1024 * 1024; // 10 MB pour les couvertures

// ─── Multer config pour import CSV en masse ───────────────────────────────────

const ALLOWED_CSV_EXT = [".csv"];

function csvImportFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.fieldname === "csv") {
    if (!ALLOWED_CSV_EXT.includes(ext))
      return cb(new Error(`Le fichier doit avoir l'extension .csv`), false);
  } else if (file.fieldname === "pdfs") {
    if (!ALLOWED_PDF_MIME.includes(file.mimetype) || !ALLOWED_PDF_EXT.includes(ext))
      return cb(new Error(`Fichier PDF invalide : ${file.originalname}`), false);
  } else if (file.fieldname === "covers") {
    if (!ALLOWED_IMAGE_MIME.includes(file.mimetype) || !ALLOWED_IMAGE_EXT.includes(ext))
      return cb(new Error(`Image invalide : ${file.originalname}`), false);
  } else {
    return cb(new Error(`Champ non autorisé : ${file.fieldname}`), false);
  }
  cb(null, true);
}

const csvImportUpload = multer({
  storage: comicStorage,
  fileFilter: csvImportFileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
}).fields([
  { name: "csv",    maxCount: 1   },
  { name: "pdfs",   maxCount: 200 },
  { name: "covers", maxCount: 200 },
]);

// Parser CSV minimal (gère les guillemets et les virgules dans les champs)
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  function parseLine(line) {
    const fields = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"' && line[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') { inQuotes = false; }
        else { field += c; }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        fields.push(field); field = "";
      } else {
        field += c;
      }
    }
    fields.push(field);
    return fields;
  }
  const headers = parseLine(lines[0]).map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h] = (values[idx] ?? "").trim(); });
    rows.push(row);
  }
  return rows;
}

// ─── Multer config pour les encarts publicitaires ─────────────────────────────

const MAX_AD_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

const adStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `ad-${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
  },
});

function adImageFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_IMAGE_MIME.includes(file.mimetype) || !ALLOWED_IMAGE_EXT.includes(ext)) {
    return cb(new Error(`Image invalide : ${file.originalname}`), false);
  }
  cb(null, true);
}

const adImageUpload = multer({
  storage: adStorage,
  fileFilter: adImageFileFilter,
  limits: { fileSize: MAX_AD_IMAGE_SIZE },
}).single("image");

// ─── Validation simple ────────────────────────────────────────────────────────

function requireField(value, name) {
  if (!value || String(value).trim() === "") return `Le champ "${name}" est requis`;
  return null;
}

function maxLen(value, name, max) {
  if (value && String(value).length > max) return `"${name}" dépasse ${max} caractères`;
  return null;
}

// ─── Setup premier admin ──────────────────────────────────────────────────────

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

router.patch("/admin/users/:id/role", requireSuperAdmin, async (req, res) => {
  const { role } = req.body;
  if (!role || !["USER", "ADMIN"].includes(role)) {
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

// ─── Comics ───────────────────────────────────────────────────────────────────

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

router.post("/admin/comics", requireAdmin, (req, res) => {
  uploadFields(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const { title, description, authors, publisher, genres, publishedAt } = req.body;

    const titleErr = requireField(title, "title") || maxLen(title, "title", 500);
    if (titleErr) return res.status(400).json({ error: titleErr });

    if (!req.files?.pdf?.[0]) {
      return res.status(400).json({ error: "Le fichier PDF est requis" });
    }

    // Vérification taille couverture (limit différente du PDF)
    const coverFile = req.files?.cover?.[0];
    if (coverFile && coverFile.size > MAX_COVER_SIZE) {
      fs.unlinkSync(coverFile.path);
      return res.status(400).json({ error: `La couverture dépasse la taille maximale de 10 Mo` });
    }

    const pdfFile = req.files.pdf[0];

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

// ─── Import CSV en masse ──────────────────────────────────────────────────────

router.post("/admin/comics/import-csv", requireAdmin, (req, res) => {
  csvImportUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const csvFile = req.files?.csv?.[0];
    if (!csvFile) return res.status(400).json({ error: "Fichier CSV requis" });

    const pdfFiles  = req.files?.pdfs   || [];
    const coverFiles = req.files?.covers || [];

    // Lire et parser le CSV
    let rows;
    try {
      const content = fs.readFileSync(csvFile.path, "utf-8");
      rows = parseCSV(content);
    } catch (e) {
      return res.status(400).json({ error: `Erreur de lecture du CSV : ${e.message}` });
    } finally {
      try { fs.unlinkSync(csvFile.path); } catch {}
    }

    if (!rows.length) return res.status(400).json({ error: "Le CSV ne contient aucune ligne" });

    // Maps nom_original → fichier multer
    const pdfMap   = new Map(pdfFiles.map((f) => [f.originalname, f]));
    const coverMap = new Map(coverFiles.map((f) => [f.originalname, f]));

    // Collecter tous les noms d'auteurs uniques
    const allAuthorNames = new Set();
    for (const row of rows) {
      (row.auteurs || "").split("|").map((n) => n.trim()).filter(Boolean).forEach((n) => allAuthorNames.add(n));
    }

    // Résoudre les auteurs : lookup DB + création si absent (dédupliqué)
    const authorCache = new Map(); // slug → id
    for (const name of allAuthorNames) {
      const slug = slugify(name);
      const existing = await prisma.author.findUnique({ where: { slug } });
      if (existing) {
        authorCache.set(slug, existing.id);
      } else {
        const uniqueSlug = await uniqueAuthorSlug(name);
        const created = await prisma.author.create({ data: { name, slug: uniqueSlug } });
        authorCache.set(slug, created.id);
      }
    }

    const protocol = req.get("x-forwarded-proto") || req.protocol;
    const baseUrl  = `${protocol}://${req.get("host")}`;

    const results = { success: 0, errors: [], warnings: [] };
    // Fichiers PDF/cover des lignes en erreur à supprimer
    const filesToDelete = [];

    for (let i = 0; i < rows.length; i++) {
      const row     = rows[i];
      const lineNum = i + 2; // ligne 1 = header

      // Validation champs obligatoires
      if (!row.titre?.trim()) {
        results.errors.push({ ligne: lineNum, raison: "Titre manquant" });
        continue;
      }
      if (!row.fichier_pdf?.trim()) {
        results.errors.push({ ligne: lineNum, raison: "Colonne fichier_pdf vide ou absente" });
        continue;
      }

      const pdfEntry = pdfMap.get(row.fichier_pdf.trim());
      if (!pdfEntry) {
        results.errors.push({ ligne: lineNum, raison: `PDF "${row.fichier_pdf}" non trouvé parmi les fichiers uploadés` });
        continue;
      }

      // Cover optionnelle
      let coverEntry = null;
      if (row.image_couverture?.trim()) {
        coverEntry = coverMap.get(row.image_couverture.trim()) || null;
        if (!coverEntry) {
          results.warnings.push({ ligne: lineNum, raison: `Cover "${row.image_couverture}" non trouvée — comic créé sans image` });
        }
      }

      // Date publication
      let publishedAt = null;
      if (row.date_publication?.trim()) {
        const d = new Date(row.date_publication.trim());
        if (isNaN(d.getTime())) {
          results.warnings.push({ ligne: lineNum, raison: `Date "${row.date_publication}" invalide — champ ignoré` });
        } else {
          publishedAt = d;
        }
      }

      const genresArr  = (row.genres  || "").split("|").map((g) => g.trim()).filter(Boolean);
      const authorNames = (row.auteurs || "").split("|").map((n) => n.trim()).filter(Boolean);
      const authorIds   = authorNames.map((n) => authorCache.get(slugify(n))).filter(Boolean);

      const pdfUrl   = `${baseUrl}/uploads/${pdfEntry.filename}`;
      const coverUrl = coverEntry ? `${baseUrl}/uploads/${coverEntry.filename}` : null;

      try {
        const comic = await prisma.comic.create({
          data: {
            externalId:  `manual-${crypto.randomBytes(8).toString("hex")}`,
            title:       row.titre.trim(),
            description: row.description?.trim() || null,
            coverUrl,
            pdfUrl,
            authors:     authorNames,
            publisher:   row.editeur?.trim() || null,
            genres:      genresArr,
            publishedAt,
          },
        });

        if (authorIds.length > 0) {
          await prisma.authorOnComic.createMany({
            data: authorIds.map((authorId) => ({ authorId, comicId: comic.id })),
            skipDuplicates: true,
          });
        }

        results.success++;
      } catch (e) {
        filesToDelete.push(pdfEntry.path);
        if (coverEntry) filesToDelete.push(coverEntry.path);
        results.errors.push({ ligne: lineNum, raison: `Erreur base de données : ${e.message}` });
      }
    }

    for (const fp of filesToDelete) {
      try { fs.unlinkSync(fp); } catch {}
    }

    res.json(results);
  });
});

router.patch("/admin/comics/:id", requireAdmin, (req, res) => {
  uploadFields(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const { title, description, authors, publisher, genres, publishedAt, authorIds, coverUrl, pdfUrl } = req.body;

    if (title !== undefined) {
      const err = requireField(title, "title") || maxLen(title, "title", 500);
      if (err) return res.status(400).json({ error: err });
    }

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

    const protocol = req.get("x-forwarded-proto") || req.protocol;
    const baseUrl = `${protocol}://${req.get("host")}`;

    if (req.files?.cover?.[0]) {
      const coverFile = req.files.cover[0];
      if (coverFile.size > MAX_COVER_SIZE) {
        fs.unlinkSync(coverFile.path);
        return res.status(400).json({ error: "La couverture dépasse la taille maximale de 10 Mo" });
      }
      updates.coverUrl = `${baseUrl}/uploads/${coverFile.filename}`;
    } else if (coverUrl !== undefined) {
      updates.coverUrl = coverUrl.trim() || null;
    }

    if (req.files?.pdf?.[0]) {
      const pdfFile = req.files.pdf[0];
      updates.pdfUrl = `${baseUrl}/uploads/${pdfFile.filename}`;
    } else if (pdfUrl !== undefined) {
      updates.pdfUrl = pdfUrl.trim() || null;
    }

    const updated = await prisma.comic.update({ where: { id: req.params.id }, data: updates });

    const parsedAuthorIds = typeof authorIds === "string"
      ? JSON.parse(authorIds)
      : Array.isArray(authorIds) ? authorIds : null;

    if (Array.isArray(parsedAuthorIds)) {
      await prisma.authorOnComic.deleteMany({ where: { comicId: req.params.id } });
      if (parsedAuthorIds.length > 0) {
        await prisma.authorOnComic.createMany({
          data: parsedAuthorIds.map((authorId) => ({ authorId, comicId: req.params.id })),
          skipDuplicates: true,
        });
      }
    }

    res.json(updated);
  });
});

router.delete("/admin/comics/:id", requireAdmin, async (req, res) => {
  const comic = await prisma.comic.findUnique({ where: { id: req.params.id } });
  if (!comic) return res.status(404).json({ error: "Comic introuvable" });

  await prisma.$transaction(async (tx) => {
    await tx.comment.deleteMany({ where: { review: { comicId: comic.id } } });
    await tx.review.deleteMany({ where: { comicId: comic.id } });
    await tx.readingEntry.deleteMany({ where: { comicId: comic.id } });
    await tx.listItem.deleteMany({ where: { comicId: comic.id } });
    await tx.authorOnComic.deleteMany({ where: { comicId: comic.id } });
    await tx.comic.delete({ where: { id: comic.id } });
  });

  for (const url of [comic.pdfUrl, comic.coverUrl]) {
    if (url) {
      const filename = url.split("/uploads/")[1];
      if (filename) {
        const filePath = path.join(uploadDir, filename);
        try {
          await fs.promises.unlink(filePath);
        } catch {
          console.warn(`[WARN] Fichier introuvable lors de la suppression : ${filePath}`);
        }
      }
    }
  }

  res.status(204).end();
});

// ─── Auteurs ─────────────────────────────────────────────────────────────────

async function uniqueAuthorSlug(name, excludeId = null) {
  const baseSlug = slugify(name)
  let slug = baseSlug
  let i = 1
  while (true) {
    const existing = await prisma.author.findUnique({ where: { slug } })
    if (!existing || existing.id === excludeId) return slug
    slug = `${baseSlug}-${i++}`
  }
}

router.get("/admin/authors", requireAdmin, async (req, res) => {
  const authors = await prisma.author.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { comics: true } } },
  });
  res.json(authors);
});

router.post("/admin/authors", requireAdmin, async (req, res) => {
  const { name, bio, birthDate } = req.body;
  const err = requireField(name, "name") || maxLen(name, "name", 200);
  if (err) return res.status(400).json({ error: err });

  const slug = await uniqueAuthorSlug(name.trim());

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

router.patch("/admin/authors/:id", requireAdmin, async (req, res) => {
  const { name, bio, birthDate } = req.body;
  const author = await prisma.author.findUnique({ where: { id: req.params.id } });
  if (!author) return res.status(404).json({ error: "Auteur introuvable" });

  if (name !== undefined) {
    const err = requireField(name, "name") || maxLen(name, "name", 200);
    if (err) return res.status(400).json({ error: err });
  }

  const updates = {};
  if (name?.trim()) {
    updates.name = name.trim();
    updates.slug = await uniqueAuthorSlug(name.trim(), req.params.id);
  }
  if (bio !== undefined) updates.bio = bio?.trim() || null;
  if (birthDate !== undefined) updates.birthDate = birthDate ? new Date(birthDate) : null;

  const updated = await prisma.author.update({ where: { id: req.params.id }, data: updates });
  res.json(updated);
});

router.delete("/admin/authors/:id", requireAdmin, async (req, res) => {
  const author = await prisma.author.findUnique({ where: { id: req.params.id } });
  if (!author) return res.status(404).json({ error: "Auteur introuvable" });
  await prisma.author.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

router.patch("/admin/comics/:id/authors", requireAdmin, async (req, res) => {
  const { authorIds } = req.body;
  if (!Array.isArray(authorIds)) {
    return res.status(400).json({ error: "authorIds doit être un tableau" });
  }

  const comic = await prisma.comic.findUnique({ where: { id: req.params.id } });
  if (!comic) return res.status(404).json({ error: "Comic introuvable" });

  await prisma.authorOnComic.deleteMany({ where: { comicId: req.params.id } });
  if (authorIds.length > 0) {
    await prisma.authorOnComic.createMany({
      data: authorIds.map((authorId) => ({ authorId, comicId: req.params.id })),
      skipDuplicates: true,
    });
  }
  res.json({ linked: authorIds.length });
});

// ─── Encarts publicitaires ─────────────────────────────────────────────────────

const VALID_AD_PLACEMENTS = ["HOME", "COMIC_DETAIL", "GUIDES_LIST", "GUIDE_DETAIL"];

router.get("/admin/ads", requireAdmin, async (req, res) => {
  const ads = await prisma.adBanner.findMany({
    orderBy: [{ placement: "asc" }, { order: "asc" }],
  });
  res.json(ads);
});

router.post("/admin/ads", requireAdmin, (req, res) => {
  adImageUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      const { linkUrl, altText, placement, isActive, startAt, endAt, order } = req.body;

      const altErr = maxLen(altText, "altText", 300);
      if (altErr) return res.status(400).json({ error: altErr });

      if (!placement || !VALID_AD_PLACEMENTS.includes(placement)) {
        return res.status(400).json({ error: `placement doit être l'un de : ${VALID_AD_PLACEMENTS.join(", ")}` });
      }
      if (!req.file) {
        return res.status(400).json({ error: "L'image est requise" });
      }

      const protocol = req.get("x-forwarded-proto") || req.protocol;
      const baseUrl = `${protocol}://${req.get("host")}`;
      const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

      const ad = await prisma.adBanner.create({
        data: {
          imageUrl,
          linkUrl: linkUrl?.trim() || null,
          altText: altText?.trim() || null,
          placement,
          isActive: isActive === undefined ? true : isActive === "true" || isActive === true,
          startAt: startAt ? new Date(startAt) : null,
          endAt: endAt ? new Date(endAt) : null,
          order: order ? Number(order) : 0,
        },
      });
      res.status(201).json(ad);
    } catch (e) {
      console.error("[admin/ads POST]", e);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });
});

router.patch("/admin/ads/:id", requireAdmin, (req, res) => {
  adImageUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      const ad = await prisma.adBanner.findUnique({ where: { id: req.params.id } });
      if (!ad) return res.status(404).json({ error: "Encart introuvable" });

      const { linkUrl, altText, placement, isActive, startAt, endAt, order } = req.body;

      if (placement !== undefined && !VALID_AD_PLACEMENTS.includes(placement)) {
        return res.status(400).json({ error: `placement doit être l'un de : ${VALID_AD_PLACEMENTS.join(", ")}` });
      }
      if (altText !== undefined) {
        const altErr = maxLen(altText, "altText", 300);
        if (altErr) return res.status(400).json({ error: altErr });
      }

      const updates = {};
      if (linkUrl !== undefined) updates.linkUrl = linkUrl?.trim() || null;
      if (altText !== undefined) updates.altText = altText?.trim() || null;
      if (placement !== undefined) updates.placement = placement;
      if (isActive !== undefined) updates.isActive = isActive === "true" || isActive === true;
      if (startAt !== undefined) updates.startAt = startAt ? new Date(startAt) : null;
      if (endAt !== undefined) updates.endAt = endAt ? new Date(endAt) : null;
      if (order !== undefined) updates.order = Number(order);

      if (req.file) {
        const protocol = req.get("x-forwarded-proto") || req.protocol;
        const baseUrl = `${protocol}://${req.get("host")}`;
        updates.imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

        const oldFilename = ad.imageUrl?.split("/uploads/")[1];
        if (oldFilename) {
          try {
            await fs.promises.unlink(path.join(uploadDir, oldFilename));
          } catch {
            console.warn(`[WARN] Ancienne image d'encart introuvable lors du remplacement`);
          }
        }
      }

      const updated = await prisma.adBanner.update({ where: { id: req.params.id }, data: updates });
      res.json(updated);
    } catch (e) {
      console.error("[admin/ads PATCH]", e);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });
});

// Pas de suppression pour les encarts — "réinitialiser" vide le contenu
// (image, texte, lien, dates) et repasse à l'état de base (actif, affiche
// générique) — ce n'est pas pareil que "désactiver" qui masque le bloc.
router.post("/admin/ads/:id/reset", requireAdmin, async (req, res) => {
  const ad = await prisma.adBanner.findUnique({ where: { id: req.params.id } });
  if (!ad) return res.status(404).json({ error: "Encart introuvable" });

  if (ad.imageUrl) {
    const filename = ad.imageUrl.split("/uploads/")[1];
    if (filename) {
      try {
        await fs.promises.unlink(path.join(uploadDir, filename));
      } catch {
        console.warn(`[WARN] Fichier d'encart introuvable lors de la réinitialisation`);
      }
    }
  }

  const reset = await prisma.adBanner.update({
    where: { id: req.params.id },
    data: {
      imageUrl: null,
      altText: null,
      linkUrl: null,
      startAt: null,
      endAt: null,
      isActive: true,
    },
  });
  res.json(reset);
});

// ─── Stats ────────────────────────────────────────────────────────────────────

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
