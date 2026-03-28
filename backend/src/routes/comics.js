import { Router } from "express";
import { searchComics, getComicById, normalizeComic } from "../lib/marvel.js";
import prisma from "../lib/prisma.js";

const router = Router();

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

// GET /comics — liste tous les comics de la DB
router.get("/", async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  const comics = await prisma.comic.findMany({
    skip: Number(offset),
    take: Number(limit),
    orderBy: { createdAt: "desc" },
  });
  const total = await prisma.comic.count();
  res.json({ total, count: comics.length, offset: Number(offset), comics });
});

// GET /comics/search?q=batman&limit=20&offset=0
router.get("/search", async (req, res) => {
  const { q, limit = 20, offset = 0 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: "Le paramètre q doit contenir au moins 2 caractères" });
  }

  // Sans clés Marvel → recherche dans la DB locale
  if (!hasMarvelKeys()) {
    const search = q.trim().toLowerCase();
    const comics = await prisma.comic.findMany({
      where: {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { authors: { has: search } },
        ],
      },
      skip: Number(offset),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });
    const total = await prisma.comic.count({
      where: {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { authors: { has: search } },
        ],
      },
    });
    return res.json({ total, count: comics.length, offset: Number(offset), comics });
  }

  // Avec clés Marvel → recherche sur l'API
  const results = await searchComics(q.trim(), Number(limit), Number(offset));
  const comics = await Promise.all(results.results.map(upsertComic));

  res.json({
    total: results.total,
    count: results.count,
    offset: results.offset,
    comics,
  });
});

// GET /comics/:externalId
router.get("/:externalId", async (req, res) => {
  const { externalId } = req.params;

  const cached = await prisma.comic.findUnique({ where: { externalId } });
  if (cached) return res.json(cached);

  if (!hasMarvelKeys()) {
    return res.status(404).json({ error: "Comic introuvable" });
  }

  const raw = await getComicById(externalId);
  if (!raw) return res.status(404).json({ error: "Comic introuvable" });

  const comic = await upsertComic(raw);
  res.json(comic);
});

export default router;
