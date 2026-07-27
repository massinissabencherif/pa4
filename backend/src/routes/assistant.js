import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import prisma from "../lib/prisma.js";
import { extractCriteria, selectAndJustify } from "../lib/llm.js";
import { getAlgoRecommendations } from "./feed.js";
import { buildTsQueryAny, diversifyBySeries } from "../lib/search.js";

const router = Router();

const MAX_QUERY_LENGTH = 500;
const MAX_CANDIDATES = 20;
// Part réservée aux correspondances ciblées (noms propres cités) : assez pour
// couvrir plusieurs numéros d'une série demandée, en laissant la place au
// complément par genres.
const TARGETED_TAKE = 12;
// Vivier interrogé avant plafonnement par série — surdimensionné exprès : après
// avoir gardé 2 numéros par série, il faut encore de quoi remplir MAX_CANDIDATES.
const GENRE_POOL = 150;
// Les auteurs sont un String[] non indexable en plein-texte : on filtre en mémoire.
const AUTHOR_POOL = 500;

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

const CANDIDATE_FIELDS = {
  id: true,
  externalId: true,
  title: true,
  coverUrl: true,
  genres: true,
  authors: true,
  description: true,
};

// Constitue le jeu de candidats soumis au modèle.
//
// L'ancienne version filtrait sur les genres puis prenait `take: 20` trié par
// `createdAt desc`. Deux conséquences : un nom propre cité par l'utilisateur
// n'atteignait jamais la requête (« superman » était généralisé en genre, et le
// premier comic Superman arrive au rang 334 par ancienneté d'import — donc hors
// d'atteinte), et comme 434 des 651 comics portent « Super-héros », presque toute
// demande recevait les 20 mêmes numéros consécutifs de Batgirl et Harley Quinn.
//
// On combine désormais deux sources :
//   1. ciblée — recherche plein-texte sur les noms propres cités (titre, description,
//      auteurs), classée par pertinence. C'est elle qui rend « superman » atteignable.
//   2. complément — filtre par genres, classé par popularité (nombre d'avis) puis par
//      date de publication, et plafonné à 2 numéros par série pour que les candidats
//      couvrent réellement le catalogue au lieu d'une seule collection.
export async function gatherCandidates(criteria) {
  const exclusion = criteria.exclude?.length
    ? { NOT: { genres: { hasSome: criteria.exclude } } }
    : {};

  const subjects = (criteria.subjects || []).map((s) => String(s).trim()).filter(Boolean);
  let targeted = [];

  if (subjects.length) {
    const tsQuery = buildTsQueryAny(subjects);
    const [textMatches, authorPool] = await Promise.all([
      tsQuery
        ? prisma.comic.findMany({
            where: { AND: [{ OR: [{ title: { search: tsQuery } }, { description: { search: tsQuery } }] }, exclusion] },
            orderBy: { _relevance: { fields: ["title", "description"], search: tsQuery, sort: "desc" } },
            take: TARGETED_TAKE,
            select: CANDIDATE_FIELDS,
          })
        : Promise.resolve([]),
      // Les auteurs sont un String[] : pas de plein-texte dessus, on filtre en mémoire
      // sur un échantillon — même approche que /comics/search.
      prisma.comic.findMany({
        where: { AND: [{ authors: { isEmpty: false } }, exclusion] },
        take: AUTHOR_POOL,
        select: CANDIDATE_FIELDS,
      }),
    ]);

    const needles = subjects.map((s) => s.toLowerCase());
    const authorMatches = authorPool.filter((c) =>
      c.authors.some((a) => needles.some((n) => a.toLowerCase().includes(n)))
    );

    targeted = dedupeById([...textMatches, ...authorMatches]).slice(0, TARGETED_TAKE);
  }

  const genreWhere = criteria.genres?.length
    ? { AND: [{ genres: { hasSome: criteria.genres } }, exclusion] }
    : exclusion;

  const genrePool = await prisma.comic.findMany({
    where: genreWhere,
    orderBy: [{ reviews: { _count: "desc" } }, { publishedAt: "desc" }],
    take: GENRE_POOL,
    select: CANDIDATE_FIELDS,
  });

  const complement = diversifyBySeries(genrePool, 2);

  return dedupeById([...targeted, ...complement]).slice(0, MAX_CANDIDATES);
}

function dedupeById(comics) {
  const seen = new Set();
  return comics.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
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

    if (!criteria) {
      return fallbackToAlgo(req, res, { query, reason: "extraction des critères illisible" });
    }

    const candidates = await gatherCandidates(criteria);

    if (candidates.length === 0) {
      return fallbackToAlgo(req, res, { query, reason: "aucun candidat trouvé pour ces critères" });
    }

    const selection = await selectAndJustify(query, candidates, criteria);

    if (!selection) {
      return fallbackToAlgo(req, res, { query, reason: "réponse IA illisible (probablement tronquée)" });
    }

    // Anti-hallucination : on ne garde que les id réellement présents parmi les candidats
    // envoyés au modèle — un id inventé ou modifié est silencieusement écarté.
    const candidateMap = new Map(candidates.map((c) => [c.id, c]));
    const results = (selection.selections || [])
      .filter((s) => candidateMap.has(s.id))
      .map((s) => ({ comic: candidateMap.get(s.id), justification: s.justification }));

    if (results.length === 0) {
      // Les deux causes n'ont rien à voir et l'ancien message unique accusait l'IA
      // d'un échec qui était en fait celui de la récupération : un modèle qui ne
      // retient rien parmi 20 candidats hors sujet fait correctement son travail.
      const proposed = (selection.selections || []).length;
      const reason = proposed === 0
        ? `aucun candidat pertinent parmi les ${candidates.length} proposés au modèle`
        : `les ${proposed} id renvoyés par le modèle ne correspondent à aucun candidat`;
      return fallbackToAlgo(req, res, { query, reason });
    }

    await logQuery({ userId: req.user.id, query, resultCount: results.length, success: true });
    res.json({ basis: "ai", message: null, intro: selection.intro, results });
  } catch (e) {
    console.error("[assistant/recommend]", e.message, e.response?.data ? JSON.stringify(e.response.data) : "");
    await fallbackToAlgo(req, res, { query, reason: e.message || "erreur inconnue" });
  }
});

// ─── Recherches enregistrées ───────────────────────────────────────────────────

const MAX_SAVED_RESULTS = 10;

// POST /assistant/saved { query, intro, results: [{ comicId, justification }] }
// Le client renvoie ce qu'il a déjà reçu de /assistant/recommend ; on revérifie
// chaque comicId en base et on reconstruit un instantané côté serveur (jamais
// confiance dans le titre/cover envoyés par le client).
router.post("/assistant/saved", requireAuth, async (req, res) => {
  const query = String(req.body?.query || "").trim();
  const intro = req.body?.intro ? String(req.body.intro).slice(0, 500) : null;
  const items = Array.isArray(req.body?.results) ? req.body.results.slice(0, MAX_SAVED_RESULTS) : [];

  if (!query) return res.status(400).json({ error: "Requête manquante" });
  if (items.length === 0) return res.status(400).json({ error: "Aucun résultat à enregistrer" });

  const ids = items.map((i) => i?.comicId).filter(Boolean);
  const comics = await prisma.comic.findMany({
    where: { id: { in: ids } },
    select: { id: true, externalId: true, title: true, coverUrl: true },
  });
  const comicMap = new Map(comics.map((c) => [c.id, c]));

  const snapshot = items
    .filter((i) => comicMap.has(i.comicId))
    .map((i) => ({ ...comicMap.get(i.comicId), justification: i.justification ? String(i.justification).slice(0, 500) : null }));

  if (snapshot.length === 0) return res.status(400).json({ error: "Comics introuvables" });

  const saved = await prisma.savedAssistantQuery.create({
    data: { userId: req.user.id, query: query.slice(0, MAX_QUERY_LENGTH), intro, results: snapshot },
  });
  res.status(201).json(saved);
});

// GET /assistant/saved — recherches enregistrées par l'utilisateur connecté
router.get("/assistant/saved", requireAuth, async (req, res) => {
  const saved = await prisma.savedAssistantQuery.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(saved);
});

// DELETE /assistant/saved/:id
router.delete("/assistant/saved/:id", requireAuth, async (req, res) => {
  const saved = await prisma.savedAssistantQuery.findUnique({ where: { id: req.params.id } });
  if (!saved || saved.userId !== req.user.id) {
    return res.status(404).json({ error: "Introuvable" });
  }
  await prisma.savedAssistantQuery.delete({ where: { id: req.params.id } });
  res.status(204).end();
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
