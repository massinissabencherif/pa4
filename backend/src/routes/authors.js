import { Router } from "express"
import prisma from "../lib/prisma.js"

const router = Router()

// GET /authors — liste tous les auteurs avec le nb de comics
router.get("/", async (req, res) => {
  const authors = await prisma.author.findMany({
    include: {
      _count: { select: { comics: true } },
    },
    orderBy: { name: "asc" },
  })
  res.json(authors.map((a) => ({ ...a, comicCount: a._count.comics })))
})

// GET /authors/:slug — détail auteur + ses comics
router.get("/:slug", async (req, res) => {
  const author = await prisma.author.findUnique({
    where: { slug: req.params.slug },
    include: {
      comics: {
        include: {
          comic: {
            include: {
              reviews: { select: { rating: true } },
            },
          },
        },
      },
    },
  })
  if (!author) return res.status(404).json({ error: "Auteur introuvable" })

  const comics = author.comics.map(({ comic }) => {
    const avg =
      comic.reviews.length > 0
        ? (comic.reviews.reduce((s, r) => s + r.rating, 0) / comic.reviews.length).toFixed(1)
        : null
    const { reviews, ...rest } = comic
    return { ...rest, avgRating: avg ? Number(avg) : null, reviewCount: reviews.length }
  })

  const { comics: _, ...authorData } = author
  res.json({ ...authorData, comics })
})

export default router
