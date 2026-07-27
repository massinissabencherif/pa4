// Briques de recherche partagées entre /comics/search et l'assistant IA.
// Extraites de comics.js pour que les deux chemins utilisent la même
// construction de tsquery — deux implémentations auraient dérivé.

// Construit une tsquery sûre à partir d'une saisie libre : tokens alphanumériques
// uniquement, avec préfixe (:*) pour matcher les mots partiels, reliés par AND.
export function buildTsQuery(input) {
  const tokens = String(input ?? "")
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu);
  if (!tokens || tokens.length === 0) return null;
  return tokens.map((t) => `${t}:*`).join(" & ");
}

// Variante OU : sert quand plusieurs sujets indépendants sont recherchés
// ensemble (« batman OU gotham »), là où le AND ci-dessus exigerait que tous
// les mots figurent dans le même comic.
export function buildTsQueryAny(inputs) {
  const clauses = (inputs || [])
    .map((i) => buildTsQuery(i))
    .filter(Boolean)
    .map((q) => `(${q})`);
  return clauses.length ? clauses.join(" | ") : null;
}

// Clé de série déduite du titre : « Batgirl #9 : The Three Swords » → « batgirl ».
// Le catalogue est majoritairement composé de séries numérotées, si bien qu'un
// simple tri renvoie facilement 13 numéros consécutifs de la même série — un jeu
// de candidats inutilisable pour recommander. Sert à plafonner par série.
export function seriesKey(title) {
  return String(title ?? "")
    .split(/\s*[#(]/)[0]
    .trim()
    .toLowerCase()
    .replace(/[\s:,.\-–—]+$/g, "");
}

// Plafonne le nombre d'entrées par série tout en conservant l'ordre d'entrée.
export function diversifyBySeries(comics, maxPerSeries = 2) {
  const seen = new Map();
  const out = [];
  for (const c of comics) {
    const key = seriesKey(c.title);
    const n = seen.get(key) || 0;
    if (n >= maxPerSeries) continue;
    seen.set(key, n + 1);
    out.push(c);
  }
  return out;
}
