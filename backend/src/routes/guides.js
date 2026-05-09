import { Router } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { slugify } from "../lib/slug.js";
import prisma from "../lib/prisma.js";

const router = Router();

// ─── Proxy Giphy ──────────────────────────────────────────────────────────────

router.get("/guides/giphy", async (req, res) => {
  const key = process.env.GIPHY_API_KEY;
  if (!key) return res.json({ data: [], configured: false });

  const q = String(req.query.q || "comics").trim();
  try {
    const endpoint = q
      ? `https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(q)}&limit=24&rating=pg-13`
      : `https://api.giphy.com/v1/gifs/trending?api_key=${key}&limit=24&rating=pg-13`;

    const resp = await fetch(endpoint);
    if (!resp.ok) return res.status(502).json({ error: "Giphy indisponible", configured: true });
    const json = await resp.json();
    res.json({ data: json.data || [], configured: true });
  } catch {
    res.status(502).json({ error: "Giphy indisponible", configured: true });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rejectHtml(str) {
  if (str && /<[^>]+>/.test(str)) throw Object.assign(new Error("HTML non autorisé"), { status: 400 });
}

function buildReplyTree(replies) {
  const map = {};
  for (const r of replies) map[r.id] = { ...r, children: [] };
  const roots = [];
  for (const r of replies) {
    if (r.parentId && map[r.parentId]) {
      map[r.parentId].children.push(map[r.id]);
    } else {
      roots.push(map[r.id]);
    }
  }
  return roots;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get("/guides", async (_req, res) => {
  const guides = await prisma.readingGuide.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { comics: true, topics: true } } },
  });
  res.json(guides);
});

router.get("/guides/:slug", optionalAuth, async (req, res) => {
  const guide = await prisma.readingGuide.findUnique({
    where: { slug: req.params.slug },
    include: {
      comics: { orderBy: { order: "asc" } },
      topics: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { username: true } },
          _count: { select: { replies: true } },
        },
      },
    },
  });
  if (!guide) return res.status(404).json({ error: "Parcours introuvable" });

  let related = [];
  if (guide.relatedSlugs.length) {
    related = await prisma.readingGuide.findMany({
      where: { slug: { in: guide.relatedSlugs } },
      select: { slug: true, character: true, imageUrl: true, teaser: true },
    });
  }
  res.json({ ...guide, related });
});

router.get("/guides/:slug/topics/:topicId", async (req, res) => {
  const topic = await prisma.guideTopic.findUnique({
    where: { id: req.params.topicId },
    include: {
      author: { select: { username: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { username: true } } },
      },
    },
  });
  if (!topic) return res.status(404).json({ error: "Topic introuvable" });
  res.json({ ...topic, replies: buildReplyTree(topic.replies) });
});

router.post("/guides/:slug/topics", requireAuth, async (req, res) => {
  const { title, content, imageUrl } = req.body;
  if (!title?.trim() || !content?.trim()) {
    return res.status(400).json({ error: "Titre et contenu requis" });
  }
  if (title.length > 200) return res.status(400).json({ error: "Titre trop long (max 200 caractères)" });
  if (content.length > 5000) return res.status(400).json({ error: "Contenu trop long (max 5000 caractères)" });
  try { rejectHtml(title); rejectHtml(content); } catch { return res.status(400).json({ error: "HTML non autorisé dans le contenu" }); }
  const guide = await prisma.readingGuide.findUnique({
    where: { slug: req.params.slug },
    select: { id: true },
  });
  if (!guide) return res.status(404).json({ error: "Parcours introuvable" });

  const topic = await prisma.guideTopic.create({
    data: {
      guideId: guide.id,
      authorId: req.user.id,
      title: title.trim(),
      content: content.trim(),
      imageUrl: imageUrl || null,
    },
    include: {
      author: { select: { username: true } },
      _count: { select: { replies: true } },
    },
  });
  res.status(201).json(topic);
});

router.post("/guides/:slug/topics/:topicId/replies", requireAuth, async (req, res) => {
  const { content, imageUrl, parentId } = req.body;
  if (!content?.trim() && !imageUrl) {
    return res.status(400).json({ error: "Contenu ou GIF requis" });
  }
  if (content && content.length > 2000) return res.status(400).json({ error: "Réponse trop longue (max 2000 caractères)" });
  try { rejectHtml(content); } catch { return res.status(400).json({ error: "HTML non autorisé dans le contenu" }); }
  const topic = await prisma.guideTopic.findUnique({
    where: { id: req.params.topicId },
    select: { id: true },
  });
  if (!topic) return res.status(404).json({ error: "Topic introuvable" });

  if (parentId) {
    const parent = await prisma.guideReply.findUnique({
      where: { id: parentId },
      select: { topicId: true },
    });
    if (!parent || parent.topicId !== topic.id) {
      return res.status(400).json({ error: "Réponse parente invalide" });
    }
  }

  const reply = await prisma.guideReply.create({
    data: {
      topicId: topic.id,
      authorId: req.user.id,
      content: content?.trim() || "",
      imageUrl: imageUrl || null,
      parentId: parentId || null,
    },
    include: { author: { select: { username: true } } },
  });
  res.status(201).json({ ...reply, children: [] });
});

// DELETE /guides/:slug/topics/:topicId — supprimer son propre sujet
router.delete("/guides/:slug/topics/:topicId", requireAuth, async (req, res) => {
  const topic = await prisma.guideTopic.findUnique({
    where: { id: req.params.topicId },
    select: { authorId: true },
  });
  if (!topic) return res.status(404).json({ error: "Topic introuvable" });
  if (topic.authorId !== req.user.id) return res.status(403).json({ error: "Non autorisé" });

  await prisma.guideTopic.delete({ where: { id: req.params.topicId } });
  res.json({ success: true });
});

// DELETE /guides/:slug/topics/:topicId/replies/:replyId — supprimer sa propre réponse (et ses enfants)
router.delete("/guides/:slug/topics/:topicId/replies/:replyId", requireAuth, async (req, res) => {
  const reply = await prisma.guideReply.findUnique({
    where: { id: req.params.replyId },
    select: { authorId: true, topicId: true },
  });
  if (!reply) return res.status(404).json({ error: "Réponse introuvable" });
  if (reply.authorId !== req.user.id) return res.status(403).json({ error: "Non autorisé" });

  // Suppression récursive de tous les descendants
  await deleteDescendants(req.params.replyId);
  await prisma.guideReply.delete({ where: { id: req.params.replyId } });
  res.json({ success: true });
});

async function deleteDescendants(replyId) {
  const children = await prisma.guideReply.findMany({
    where: { parentId: replyId },
    select: { id: true },
  });
  for (const child of children) {
    await deleteDescendants(child.id);
    await prisma.guideReply.delete({ where: { id: child.id } });
  }
}

// ─── Admin — Gestion des parcours ─────────────────────────────────────────────

router.get("/admin/guides", requireAdmin, async (req, res) => {
  const guides = await prisma.readingGuide.findMany({
    orderBy: { character: "asc" },
    include: {
      comics: { orderBy: { order: "asc" } },
      _count: { select: { topics: true } },
    },
  });
  res.json(guides);
});

router.post("/admin/guides", requireAdmin, async (req, res) => {
  const { character, imageUrl, teaser, story, relatedSlugs, comics } = req.body;
  if (!character?.trim() || !teaser?.trim() || !story?.trim()) {
    return res.status(400).json({ error: "Nom, teaser et texte requis" });
  }
  const slug = slugify(character);
  const existing = await prisma.readingGuide.findUnique({ where: { slug } });
  if (existing) {
    return res.status(400).json({ error: `Le slug "${slug}" est déjà utilisé` });
  }
  const guide = await prisma.readingGuide.create({
    data: {
      slug,
      character: character.trim(),
      imageUrl: imageUrl?.trim() || null,
      teaser: teaser.trim(),
      story: story.trim(),
      relatedSlugs: relatedSlugs || [],
      comics: {
        create: (comics || []).map((c, i) => ({
          title: c.title?.trim() || "",
          coverUrl: c.coverUrl?.trim() || null,
          comicUrl: c.comicUrl?.trim() || null,
          note: c.note?.trim() || "",
          order: i,
        })),
      },
    },
    include: {
      comics: { orderBy: { order: "asc" } },
      _count: { select: { topics: true } },
    },
  });
  res.status(201).json(guide);
});

router.patch("/admin/guides/:id", requireAdmin, async (req, res) => {
  const { character, imageUrl, teaser, story, relatedSlugs, comics } = req.body;
  if (!character?.trim() || !teaser?.trim() || !story?.trim()) {
    return res.status(400).json({ error: "Nom, teaser et texte requis" });
  }
  const guide = await prisma.readingGuide.findUnique({ where: { id: req.params.id } });
  if (!guide) return res.status(404).json({ error: "Parcours introuvable" });

  await prisma.guideComic.deleteMany({ where: { guideId: req.params.id } });
  const updated = await prisma.readingGuide.update({
    where: { id: req.params.id },
    data: {
      character: character.trim(),
      imageUrl: imageUrl?.trim() || null,
      teaser: teaser.trim(),
      story: story.trim(),
      relatedSlugs: relatedSlugs || [],
      comics: {
        create: (comics || []).map((c, i) => ({
          title: c.title?.trim() || "",
          coverUrl: c.coverUrl?.trim() || null,
          comicUrl: c.comicUrl?.trim() || null,
          note: c.note?.trim() || "",
          order: i,
        })),
      },
    },
    include: {
      comics: { orderBy: { order: "asc" } },
      _count: { select: { topics: true } },
    },
  });
  res.json(updated);
});

router.delete("/admin/guides/:id", requireAdmin, async (req, res) => {
  const guide = await prisma.readingGuide.findUnique({ where: { id: req.params.id } });
  if (!guide) return res.status(404).json({ error: "Parcours introuvable" });
  await prisma.readingGuide.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
