import { Router } from "express";
import { searchComics, getComicById, normalizeComic } from "../lib/marvel.js";
import prisma from "../lib/prisma.js";

const router = Router();

function parsePagination(query, defaults = { limit: 20, max: 100 }) {
  const limitRaw = Number.parseInt(query.limit, 10)
  const offsetRaw = Number.parseInt(query.offset, 10)
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), defaults.max) : defaults.limit
  const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0
  return { limit, offset }
}

const hasMarvelKeys = () =>
  !!(process.env.MARVEL_PUBLIC_KEY && process.env.MARVEL_PRIVATE_KEY);

async function upsertComic(raw) {
  const data = normalizeComic(raw);
  return prisma.comic.upsert({
    where: { externalId: data.externalId },
    update: data,
    create: data,
  });
}

// GET /comics — liste tous les comics de la DB avec filtres optionnels
router.get("/", async (req, res) => {
  const { limit: lq, offset: oq, genre, author } = req.query;
  const { limit, offset } = parsePagination({ limit: lq ?? 50, offset: oq }, { limit: 50, max: 200 });

  const where = {};
  if (genre) where.genres = { has: genre };
  if (author) where.authors = { has: author };

  const [comics, total] = await Promise.all([
    prisma.comic.findMany({ where, skip: offset, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.comic.count({ where }),
  ]);
  res.json({ total, count: comics.length, offset, comics });
});

// GET /comics/latest?limit=6
router.get("/latest", async (req, res) => {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 6, 1), 20);
  const comics = await prisma.comic.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, externalId: true, title: true, coverUrl: true, publisher: true, createdAt: true },
  });
  res.json({ comics });
});

// GET /comics/trending?period=today&limit=6
router.get("/trending", async (req, res) => {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 6, 1), 20);
  const period = req.query.period || "today";

  let since;
  if (period === "today") {
    const d = new Date();
    since = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  } else if (period === "7d") {
    since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  } else {
    since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  }

  const entries = await prisma.readingEntry.groupBy({
    by: ["comicId"],
    where: { updatedAt: { gte: since } },
    _count: { comicId: true },
    orderBy: { _count: { comicId: "desc" } },
    take: limit,
  });

  const comicIds = entries.map((e) => e.comicId);
  if (comicIds.length === 0) return res.json({ comics: [] });

  const comics = await prisma.comic.findMany({
    where: { id: { in: comicIds } },
    select: { id: true, externalId: true, title: true, coverUrl: true, publisher: true },
  });

  const countMap = Object.fromEntries(entries.map((e) => [e.comicId, e._count.comicId]));
  const sorted = comicIds.map((id) => comics.find((c) => c.id === id)).filter(Boolean)
    .map((c) => ({ ...c, readCount: countMap[c.id] }));

  res.json({ comics: sorted });
});

// GET /comics/genres — liste tous les genres disponibles
router.get("/genres", async (req, res) => {
  const comics = await prisma.comic.findMany({ select: { genres: true } });
  const genres = [...new Set(comics.flatMap((c) => c.genres))].sort();
  res.json(genres);
});

// GET /comics/author-names — liste tous les auteurs (champ texte) disponibles
router.get("/author-names", async (req, res) => {
  const comics = await prisma.comic.findMany({ select: { authors: true } });
  const authors = [...new Set(comics.flatMap((c) => c.authors))].sort();
  res.json(authors);
});

// GET /comics/search?q=batman&limit=20&offset=0
router.get("/search", async (req, res) => {
  const { q } = req.query;
  const { limit, offset } = parsePagination(req.query);

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: "Le paramètre q doit contenir au moins 2 caractères" });
  }

  // Sans clés Marvel → recherche dans la DB locale avec correspondance partielle sur les auteurs
  if (!hasMarvelKeys()) {
    const search = q.trim().toLowerCase();
    const [byTitle, allWithAuthors] = await Promise.all([
      prisma.comic.findMany({
        where: { title: { contains: search, mode: "insensitive" } },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.comic.findMany({
        where: { authors: { isEmpty: false } },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
    ]);
    const authorMatches = allWithAuthors.filter((c) =>
      c.authors.some((a) => a.toLowerCase().includes(search))
    );
    const seen = new Set(byTitle.map((c) => c.id));
    const merged = [...byTitle, ...authorMatches.filter((c) => !seen.has(c.id))];
    const comics = merged.slice(offset, offset + limit);
    return res.json({ total: merged.length, count: comics.length, offset, comics });
  }

  // Avec clés Marvel → recherche sur l'API
  const results = await searchComics(q.trim(), limit, offset);
  const comics = await Promise.all(results.results.map(upsertComic));

  res.json({ total: results.total, count: results.count, offset: results.offset, comics });
});

// GET /comics/:externalId
router.get("/:externalId", async (req, res) => {
  const { externalId } = req.params;

  const cached = await prisma.comic.findUnique({
    where: { externalId },
    include: { authorLinks: { include: { author: true } } },
  });
  if (cached) {
    const { authorLinks, ...comic } = cached;
    return res.json({ ...comic, linkedAuthors: authorLinks.map((l) => l.author) });
  }

  if (!hasMarvelKeys()) {
    return res.status(404).json({ error: "Comic introuvable" });
  }

  const raw = await getComicById(externalId);
  if (!raw) return res.status(404).json({ error: "Comic introuvable" });

  const comic = await upsertComic(raw);
  res.json(comic);
});

export default router;
