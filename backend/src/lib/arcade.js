// Socle commun de l'Arcade — sélection déterministe de comics et attribution d'XP.
//
// Principe anti-triche : tout ce qui touche aux réponses (tirage du jour,
// validation, scoring) vit côté serveur. Le client ne reçoit jamais la solution.

import crypto from "crypto";

export function utcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

// Le seed du jour inclut un secret serveur : le dépôt étant public, sans secret
// n'importe qui pourrait recalculer le tirage du lendemain à partir du code.
function seedSecret() {
  return process.env.ARCADE_SEED_SECRET || "comicster-arcade-dev";
}

// PRNG déterministe (mulberry32) seedé par SHA-256 — même seed, même séquence.
export function seededRng(seedStr) {
  const h = crypto.createHash("sha256").update(`${seedSecret()}:${seedStr}`).digest();
  let a = h.readUInt32LE(0);
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Tire `count` ids de comics distincts, de façon déterministe pour un seed donné.
// Pool stable : trié par id, filtrable (ex: coverUrl non null pour la Cover Mystère).
export async function pickSeededComicIds(prisma, { seed, count, where = {} }) {
  const pool = await prisma.comic.findMany({
    where,
    orderBy: { id: "asc" },
    select: { id: true },
  });
  if (pool.length === 0) return [];

  const rng = seededRng(seed);
  const indices = [...pool.keys()];
  const n = Math.min(count, pool.length);
  // Fisher-Yates partiel : n premiers éléments d'un mélange déterministe
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rng() * (indices.length - i));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, n).map((i) => pool[i].id);
}

export async function awardXp(prisma, userId, amount) {
  const value = Math.floor(amount);
  if (!Number.isFinite(value) || value <= 0) return;
  await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: value } },
  });
}
