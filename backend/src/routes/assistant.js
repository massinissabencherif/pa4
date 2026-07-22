import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import prisma from "../lib/prisma.js";
import { extractCriteria, selectAndJustify } from "../lib/llm.js";
import { getAlgoRecommendations } from "./feed.js";

const router = Router();

const MAX_QUERY_LENGTH = 500;
const MAX_CANDIDATES = 20;

// Rate limit par utilisateur, ajustable depuis l'admin sans redéploiement
// (contrairement à express-rate-limit, dont la config est figée au démarrage).
// Fenêtre glissante en mémoire — cohérent avec les autres limiters du projet
// (pas de store partagé type Redis ici non plus).
const requestLog = new Map(); // userId -> timestamps[]

function isRateLimited(userId, limitPerMinute) {
  const now = Date.now();
  const windowStart = now - 60_000;
  const timestamps = (requestLog.get(userId) || []).filter((t) => t > windowStart);
  if (timestamps.length >= limitPerMinute) {
    requestLog.set(userId, timestamps);
    return true;
  }
  timestamps.push(now);
  requestLog.set(userId, timestamps);
  return false;
}

async function getSettings() {
  const settings = await prisma.assistantSettings.findUnique({ where: { id: "singleton" } });
  return settings || { enabled: true, rateLimitPerMinute: 10 };
}

async function logQuery({ userId, query, resultCount, success, errorMessage }) {
  try {
    await prisma.assistantQuery.create({
      data: { userId, query: query.slice(0, MAX_QUERY_LENGTH), resultCount, success, errorMessage: errorMessage?.slice(0, 500) },
    });
  } catch {
    // Le log ne doit jamais faire échouer la requête utilisateur
  }
}

async function fallbackToAlgo(req, res, { query, reason }) {
  const { recommendations, basis } = await getAlgoRecommendations(req.user.id, 5);
  await logQuery({ userId: req.user.id, query, resultCount: recommendations.length, success: false, errorMessage: reason });
  res.json({
    basis: "algo_fallback",
    message: "Suggestions basées sur tes goûts (l'assistant IA n'est pas disponible pour le moment).",
    intro: null,
    results: recommendations.map((c) => ({ comic: c, justification: null })),
  });
}

// POST /assistant/recommend { query } — conseiller de lecture IA
router.post("/assistant/recommend", requireAuth, async (req, res) => {
  const settings = await getSettings();

  if (!settings.enabled) {
    return fallbackToAlgo(req, res, { query: req.body?.query || "", reason: "feature désactivée par l'admin" });
  }

  const query = String(req.body?.query || "").trim();
  if (!query) {
    return res.status(400).json({ error: "La requête ne peut pas être vide" });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return res.status(400).json({ error: `La requête est limitée à ${MAX_QUERY_LENGTH} caractères` });
  }

  // Validée après les checks de forme (vide / trop longue) pour ne pas gâcher
  // un slot de quota sur une requête mal formée côté client.
  if (isRateLimited(req.user.id, settings.rateLimitPerMinute)) {
    return res.status(429).json({ error: "Trop de requêtes à l'assistant IA, réessaie dans une minute." });
  }

  try {
    const allGenres = [...new Set((await prisma.comic.findMany({ select: { genres: true } })).flatMap((c) => c.genres))];

    const criteria = await extractCriteria(query, allGenres);

    const where = {};
    if (criteria.genres?.length) where.genres = { hasSome: criteria.genres };
    if (criteria.exclude?.length) where.NOT = { genres: { hasSome: criteria.exclude } };

    const candidates = await prisma.comic.findMany({
      where,
      take: MAX_CANDIDATES,
      select: { id: true, externalId: true, title: true, coverUrl: true, genres: true, authors: true, description: true },
      orderBy: { createdAt: "desc" },
    });

    if (candidates.length === 0) {
      return fallbackToAlgo(req, res, { query, reason: "aucun candidat trouvé pour ces critères" });
    }

    const selection = await selectAndJustify(query, candidates);

    // Anti-hallucination : on ne garde que les id réellement présents parmi les candidats
    // envoyés au modèle — un id inventé ou modifié est silencieusement écarté.
    const candidateMap = new Map(candidates.map((c) => [c.id, c]));
    const results = (selection.selections || [])
      .filter((s) => candidateMap.has(s.id))
      .map((s) => ({ comic: candidateMap.get(s.id), justification: s.justification }));

    if (results.length === 0) {
      return fallbackToAlgo(req, res, { query, reason: "sélection IA vide ou invalide" });
    }

    await logQuery({ userId: req.user.id, query, resultCount: results.length, success: true });
    res.json({ basis: "ai", message: null, intro: selection.intro, results });
  } catch (e) {
    console.error("[assistant/recommend]", e.message);
    await fallbackToAlgo(req, res, { query, reason: e.message || "erreur inconnue" });
  }
});

// ─── Admin — visibilité + contrôle ────────────────────────────────────────────

// GET /admin/assistant — stats d'usage + réglages actuels
router.get("/admin/assistant", requireAdmin, async (req, res) => {
  const [settings, total, successCount, recent] = await Promise.all([
    getSettings(),
    prisma.assistantQuery.count(),
    prisma.assistantQuery.count({ where: { success: true } }),
    prisma.assistantQuery.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true, query: true, resultCount: true, success: true, errorMessage: true, createdAt: true,
        user: { select: { username: true } },
      },
    }),
  ]);

  // Estimation grossière : ~0,5 centime par requête réussie (2 appels Haiku courts)
  const estimatedCostUsd = successCount * 0.0055;

  res.json({
    settings: { enabled: settings.enabled, rateLimitPerMinute: settings.rateLimitPerMinute },
    stats: { total, successCount, failureCount: total - successCount, estimatedCostUsd },
    recent,
  });
});

// PATCH /admin/assistant/settings — kill switch + ajustement du rate limit, à chaud
router.patch("/admin/assistant/settings", requireAdmin, async (req, res) => {
  const data = {};
  if (typeof req.body.enabled === "boolean") data.enabled = req.body.enabled;
  if (Number.isInteger(req.body.rateLimitPerMinute) && req.body.rateLimitPerMinute > 0) {
    data.rateLimitPerMinute = req.body.rateLimitPerMinute;
  }

  const settings = await prisma.assistantSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  res.json({ enabled: settings.enabled, rateLimitPerMinute: settings.rateLimitPerMinute });
});

export default router;
