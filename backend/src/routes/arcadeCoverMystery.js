// Cover Mystère — une couverture pixelisée, 4 titres proposés, plus tu réponds
// vite plus tu marques. Le chrono et le scoring sont calculés côté serveur
// (servedAt → answeredAt) : l'animation de dépixelisation du client est purement
// cosmétique. Mode défi du jour (seedé, XP) et mode infini (aléatoire, sans XP).

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { utcDateKey, pickSeededComicIds, seededRng, awardXp } from "../lib/arcade.js";

const router = Router();

export const ROUNDS_PER_RUN = 5;
const CHOICES_PER_ROUND = 4;

// Paliers de points selon le temps de réponse (calculé serveur)
export function pointsForElapsed(ms) {
  if (ms < 5_000) return 100;
  if (ms < 10_000) return 70;
  if (ms < 20_000) return 40;
  return 20;
}

const COVER_POOL_WHERE = { coverUrl: { not: null } };

// Génère les distracteurs d'un round : même genre de préférence, complétés au hasard.
async function pickChoices(answerComic, rng, poolIds) {
  const sameGenre = answerComic.genres.length
    ? await prisma.comic.findMany({
        where: {
          ...COVER_POOL_WHERE,
          id: { not: answerComic.id, in: poolIds },
          genres: { hasSome: answerComic.genres },
        },
        select: { id: true },
      })
    : [];

  const others = poolIds.filter((id) => id !== answerComic.id && !sameGenre.some((c) => c.id === id));
  const candidates = [...sameGenre.map((c) => c.id), ...others];

  const distractors = [];
  const used = new Set([answerComic.id]);
  while (distractors.length < CHOICES_PER_ROUND - 1 && candidates.length > 0) {
    const idx = Math.floor(rng() * candidates.length);
    const [id] = candidates.splice(idx, 1);
    if (!used.has(id)) {
      used.add(id);
      distractors.push(id);
    }
  }

  const choiceIds = [answerComic.id, ...distractors];
  // Mélange déterministe des choix (la position de la réponse ne doit pas être prévisible)
  for (let i = choiceIds.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [choiceIds[i], choiceIds[j]] = [choiceIds[j], choiceIds[i]];
  }
  return choiceIds;
}

async function buildRounds({ seed, poolIds }) {
  const rng = seededRng(seed);
  const answerIds = [];
  {
    // Tirage des réponses parmi le pool (sans doublon), via le même rng
    const pool = [...poolIds];
    const n = Math.min(ROUNDS_PER_RUN, pool.length);
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(rng() * pool.length);
      answerIds.push(pool.splice(idx, 1)[0]);
    }
  }

  const answers = await prisma.comic.findMany({
    where: { id: { in: answerIds } },
    select: { id: true, genres: true },
  });
  const byId = Object.fromEntries(answers.map((a) => [a.id, a]));

  const rounds = [];
  for (const answerId of answerIds) {
    const choices = await pickChoices(byId[answerId], rng, poolIds);
    rounds.push({ answerId, choices, servedAt: null, answeredAt: null, guessedId: null, points: 0 });
  }
  return rounds;
}

// Payload d'un round côté client : cover + choix, jamais l'identité de la réponse
async function roundPayload(run) {
  const state = run.state;
  const round = state.rounds[state.currentRound];
  const [answer, choiceComics] = await Promise.all([
    prisma.comic.findUnique({ where: { id: round.answerId }, select: { coverUrl: true } }),
    prisma.comic.findMany({
      where: { id: { in: round.choices } },
      select: { id: true, title: true },
    }),
  ]);
  const titleById = Object.fromEntries(choiceComics.map((c) => [c.id, c.title]));
  return {
    runId: run.id,
    mode: run.dateKey ? "daily" : "infinite",
    roundIndex: state.currentRound,
    totalRounds: state.rounds.length,
    cover: answer.coverUrl,
    choices: round.choices.map((id) => ({ id, title: titleById[id] })),
    score: run.score,
  };
}

function summaryPayload(run, xpAwarded = 0) {
  return {
    runId: run.id,
    mode: run.dateKey ? "daily" : "infinite",
    finished: true,
    score: run.score,
    xpAwarded,
    rounds: run.state.rounds.map((r) => ({ correct: r.guessedId === r.answerId, points: r.points })),
  };
}

// POST /arcade/cover-mystery/start { mode: "daily" | "infinite" }
router.post("/start", requireAuth, async (req, res) => {
  const mode = req.body.mode === "infinite" ? "infinite" : "daily";
  const dateKey = mode === "daily" ? utcDateKey() : null;

  const poolIds = await pickSeededComicIds(prisma, {
    seed: "cover-pool",
    count: 10_000, // tout le pool, l'ordre seedé est sans importance ici
    where: COVER_POOL_WHERE,
  });
  if (poolIds.length < CHOICES_PER_ROUND) {
    return res.status(503).json({ error: "Pas assez de couvertures dans le catalogue" });
  }

  if (mode === "daily") {
    let run = await prisma.arcadeRun.findUnique({
      where: { userId_game_dateKey: { userId: req.user.id, game: "COVER_MYSTERY", dateKey } },
    });
    if (run?.finishedAt) return res.json(summaryPayload(run));
    if (!run) {
      const rounds = await buildRounds({ seed: `COVER_MYSTERY:${dateKey}`, poolIds });
      run = await prisma.arcadeRun.create({
        data: {
          userId: req.user.id,
          game: "COVER_MYSTERY",
          dateKey,
          state: { rounds, currentRound: 0 },
        },
      });
    }
    // (Re)démarre le chrono du round courant s'il n'a pas encore été servi
    const state = run.state;
    if (!state.rounds[state.currentRound].servedAt) {
      state.rounds[state.currentRound].servedAt = new Date().toISOString();
      run = await prisma.arcadeRun.update({ where: { id: run.id }, data: { state } });
    }
    return res.json(await roundPayload(run));
  }

  // Mode infini : nouvelle partie à chaque start, seed aléatoire, pas d'XP
  const rounds = await buildRounds({
    seed: `COVER_MYSTERY:infinite:${req.user.id}:${Date.now()}:${Math.random()}`,
    poolIds,
  });
  rounds[0].servedAt = new Date().toISOString();
  const run = await prisma.arcadeRun.create({
    data: { userId: req.user.id, game: "COVER_MYSTERY", dateKey: null, state: { rounds, currentRound: 0 } },
  });
  res.json(await roundPayload(run));
});

// POST /arcade/cover-mystery/guess { runId, comicId }
router.post("/guess", requireAuth, async (req, res) => {
  const { runId, comicId } = req.body;
  if (!runId || !comicId) return res.status(400).json({ error: "runId et comicId sont requis" });

  let run = await prisma.arcadeRun.findUnique({ where: { id: runId } });
  if (!run || run.userId !== req.user.id || run.game !== "COVER_MYSTERY") {
    return res.status(404).json({ error: "Partie introuvable" });
  }
  if (run.finishedAt) return res.status(409).json({ error: "Partie déjà terminée" });

  const state = run.state;
  const round = state.rounds[state.currentRound];
  if (round.answeredAt) return res.status(409).json({ error: "Round déjà joué" });
  if (!round.choices.includes(comicId)) {
    return res.status(400).json({ error: "Ce titre ne fait pas partie des choix" });
  }

  const now = new Date();
  const elapsed = now.getTime() - new Date(round.servedAt).getTime();
  const correct = comicId === round.answerId;
  const points = correct ? pointsForElapsed(elapsed) : 0;

  round.answeredAt = now.toISOString();
  round.guessedId = comicId;
  round.points = points;

  const isLastRound = state.currentRound >= state.rounds.length - 1;
  if (!isLastRound) {
    state.currentRound += 1;
    state.rounds[state.currentRound].servedAt = new Date().toISOString();
  }

  const newScore = run.score + points;
  run = await prisma.arcadeRun.update({
    where: { id: run.id },
    data: { state, score: newScore, finishedAt: isLastRound ? now : null },
  });

  // XP uniquement sur le défi du jour — le mode infini est un mode entraînement
  let xpAwarded = 0;
  if (isLastRound && run.dateKey) {
    xpAwarded = newScore;
    await awardXp(prisma, req.user.id, xpAwarded);
  }

  const answer = await prisma.comic.findUnique({
    where: { id: round.answerId },
    select: { id: true, externalId: true, title: true, coverUrl: true },
  });

  res.json({
    roundResult: { correct, points, elapsedMs: elapsed, answer },
    ...(isLastRound ? summaryPayload(run, xpAwarded) : { next: await roundPayload(run), finished: false }),
  });
});

export default router;
