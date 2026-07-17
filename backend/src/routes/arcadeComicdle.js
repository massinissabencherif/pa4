// Comicdle — le Wordle du comics. Un comic mystère par jour (le même pour tous),
// 6 essais, chaque essai révèle des indices attribut par attribut.
// La réponse ne quitte JAMAIS le serveur avant la fin de partie.

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { utcDateKey, pickSeededComicIds, awardXp } from "../lib/arcade.js";

const router = Router();

export const MAX_GUESSES = 6;
// XP : 70 au 1er essai, -10 par essai supplémentaire, plancher 20
export function xpForWin(guessCount) {
  return Math.max(70 - 10 * (guessCount - 1), 20);
}

// Cible du jour — déterministe (seed = jeu + jour + secret serveur).
// Pool : comics avec au moins genres OU éditeur renseignés, sinon la partie est injouable.
export async function getComicdleTargetId(dateKey) {
  const ids = await pickSeededComicIds(prisma, {
    seed: `COMICDLE:${dateKey}`,
    count: 1,
    where: { OR: [{ genres: { isEmpty: false } }, { publisher: { not: null } }] },
  });
  return ids[0] ?? null;
}

function setsRelation(a = [], b = []) {
  const setA = new Set(a.map((x) => x.toLowerCase()));
  const setB = new Set(b.map((x) => x.toLowerCase()));
  if (setA.size === setB.size && [...setA].every((x) => setB.has(x))) {
    return setA.size > 0 ? "exact" : "unknown";
  }
  return [...setA].some((x) => setB.has(x)) ? "partial" : "none";
}

function yearOf(comic) {
  return comic.publishedAt ? new Date(comic.publishedAt).getUTCFullYear() : null;
}

// Indices attribut par attribut pour un essai
export function buildFeedback(guess, target) {
  const guessYear = yearOf(guess);
  const targetYear = yearOf(target);

  let year = "unknown";
  if (guessYear !== null && targetYear !== null) {
    if (guessYear === targetYear) year = "match";
    else year = targetYear > guessYear ? "higher" : "lower"; // higher = la cible est plus récente
  }

  let publisher = "unknown";
  if (guess.publisher && target.publisher) {
    publisher = guess.publisher.toLowerCase() === target.publisher.toLowerCase() ? "match" : "none";
  }

  return {
    comicId: guess.id,
    title: guess.title,
    correct: guess.id === target.id,
    genres: setsRelation(guess.genres, target.genres),
    publisher,
    year,
    guessYear,
    authors: setsRelation(guess.authors, target.authors),
  };
}

function publicState(run) {
  const state = run.state ?? {};
  return {
    date: run.dateKey,
    maxGuesses: MAX_GUESSES,
    guesses: state.guesses ?? [],
    finished: !!run.finishedAt,
    solved: (state.guesses ?? []).some((g) => g.correct),
    score: run.score,
  };
}

async function revealTarget(targetId) {
  return prisma.comic.findUnique({
    where: { id: targetId },
    select: { id: true, externalId: true, title: true, coverUrl: true, publisher: true, publishedAt: true, genres: true, authors: true },
  });
}

// GET /arcade/comicdle/daily — état de ma partie du jour
router.get("/daily", requireAuth, async (req, res) => {
  const dateKey = utcDateKey();
  const targetId = await getComicdleTargetId(dateKey);
  if (!targetId) return res.status(503).json({ error: "Catalogue insuffisant pour générer le défi" });

  const run = await prisma.arcadeRun.findUnique({
    where: { userId_game_dateKey: { userId: req.user.id, game: "COMICDLE", dateKey } },
  });

  if (!run) {
    return res.json({ date: dateKey, maxGuesses: MAX_GUESSES, guesses: [], finished: false, solved: false, score: 0 });
  }

  const payload = publicState(run);
  // La cible n'est révélée qu'une fois la partie terminée
  if (run.finishedAt) payload.target = await revealTarget(run.state.targetId);
  res.json(payload);
});

// GET /arcade/comicdle/options?q= — autocomplete des titres du catalogue
router.get("/options", requireAuth, async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (q.length < 2) return res.json([]);
  const comics = await prisma.comic.findMany({
    where: { title: { contains: q, mode: "insensitive" } },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
    take: 10,
  });
  res.json(comics);
});

// POST /arcade/comicdle/guess — proposer un titre
router.post("/guess", requireAuth, async (req, res) => {
  const { comicId } = req.body;
  if (!comicId || typeof comicId !== "string") {
    return res.status(400).json({ error: "comicId est requis" });
  }

  const dateKey = utcDateKey();
  const targetId = await getComicdleTargetId(dateKey);
  if (!targetId) return res.status(503).json({ error: "Catalogue insuffisant pour générer le défi" });

  const [guessComic, targetComic] = await Promise.all([
    prisma.comic.findUnique({ where: { id: comicId } }),
    prisma.comic.findUnique({ where: { id: targetId } }),
  ]);
  if (!guessComic) return res.status(404).json({ error: "Comic introuvable" });

  let run = await prisma.arcadeRun.findUnique({
    where: { userId_game_dateKey: { userId: req.user.id, game: "COMICDLE", dateKey } },
  });

  if (run?.finishedAt) {
    return res.status(409).json({ error: "Partie du jour déjà terminée" });
  }

  const guesses = run?.state?.guesses ?? [];
  if (guesses.some((g) => g.comicId === comicId)) {
    return res.status(400).json({ error: "Titre déjà proposé" });
  }

  const feedback = buildFeedback(guessComic, targetComic);
  const newGuesses = [...guesses, feedback];
  const solved = feedback.correct;
  const exhausted = newGuesses.length >= MAX_GUESSES;
  const finished = solved || exhausted;
  const score = solved ? xpForWin(newGuesses.length) : 0;

  const data = {
    state: { targetId, guesses: newGuesses },
    score,
    finishedAt: finished ? new Date() : null,
  };

  run = run
    ? await prisma.arcadeRun.update({ where: { id: run.id }, data })
    : await prisma.arcadeRun.create({
        data: { userId: req.user.id, game: "COMICDLE", dateKey, ...data },
      });

  if (solved) await awardXp(prisma, req.user.id, score);

  const payload = publicState(run);
  if (finished) payload.target = await revealTarget(targetId);
  res.json(payload);
});

export default router;
