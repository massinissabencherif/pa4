import axios from "axios";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.LLM_MODEL || "claude-haiku-4-5";
// 8s s'est révélé trop juste en usage réel (latence Anthropic variable, parfois
// 4-8s pour un seul des deux appels séquentiels) — constaté en QA pré-soutenance,
// bascule fréquente sur le repli algorithmique alors que l'appel aboutissait
// quelques secondes plus tard. Le flux a de toute façon un repli si l'appel
// échoue vraiment : plus de marge ne coûte qu'un peu d'attente, jamais de casse.
const TIMEOUT_MS = 15000;

function headers() {
  return {
    "content-type": "application/json",
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
  };
}

// `temperature` n'existe plus sur les modèles Claude 4.7+ / 5 : l'envoyer renvoie
// un 400. LLM_MODEL étant configurable, on ne l'ajoute que pour les modèles qui
// l'acceptent, afin qu'un changement de modèle ne casse pas la fonctionnalité.
function sampling() {
  return /-4-5$|-4-5-|claude-3/.test(MODEL) ? { temperature: 0 } : {};
}

// Le JSON est garanti bien formé par output_config.format, sauf si la réponse est
// tronquée (max_tokens atteint) — auquel cas JSON.parse jetait une exception
// remontée telle quelle à l'utilisateur. On renvoie null pour laisser l'appelant
// basculer proprement sur le repli algorithmique.
function firstText(content) {
  const block = (content || []).find((b) => b.type === "text");
  if (!block) return null;
  try {
    return JSON.parse(block.text);
  } catch {
    return null;
  }
}

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    // Noms propres cités littéralement par l'utilisateur (personnage, série,
    // titre, auteur, lieu). C'est le champ qui porte « Superman » : sans lui, le
    // modèle généralisait la demande en genres et le personnage disparaissait,
    // rendant ses 18 comics introuvables. Voir routes/assistant.js.
    subjects: { type: "array", items: { type: "string" } },
    genres: { type: "array", items: { type: "string" } },
    mood: { type: "string" },
    themes: { type: "array", items: { type: "string" } },
    exclude: { type: "array", items: { type: "string" } },
    era: { type: "string" },
  },
  required: ["subjects", "genres", "mood", "themes", "exclude", "era"],
  additionalProperties: false,
};

// Extrait des critères structurés à partir de la demande en langage naturel de l'utilisateur.
// Sortie contrainte par JSON schema — jamais de texte libre à parser à la main.
export async function extractCriteria(query, availableGenres) {
  const { data } = await axios.post(
    API_URL,
    {
      model: MODEL,
      max_tokens: 300,
      // temperature 0 : c'est une tâche d'extraction, pas de création. Sans ça, la
      // même demande produisait des genres différents d'un appel à l'autre, donc un
      // jeu de candidats différent, donc des réponses incohérentes à requête égale.
      ...sampling(),
      system: `Tu extrais des critères de recherche de comics à partir d'une demande en langage naturel, en français. Genres disponibles dans le catalogue : ${availableGenres.join(", ")}. N'utilise que des genres de cette liste dans "genres" et "exclude" (jamais un genre absent de la liste). "mood" est un mot ou une courte expression (ex: "sombre", "léger", "haletant"), chaîne vide si non précisé. "era" est une période si mentionnée, sinon une chaîne vide.

"subjects" est le champ le plus important : recopie-y **mot pour mot** chaque nom propre cité par l'utilisateur — personnage (Superman, Harley Quinn), série, titre, auteur, lieu (Gotham). Ne les généralise jamais en genre ou en thème : « un comic superman » donne subjects ["Superman"], pas subjects [] avec themes ["super-héros"]. Tableau vide uniquement si la demande ne cite aucun nom propre.`,
      messages: [{ role: "user", content: query }],
      output_config: { format: { type: "json_schema", schema: EXTRACTION_SCHEMA } },
    },
    { headers: headers(), timeout: TIMEOUT_MS }
  );
  return firstText(data.content);
}

const SELECTION_SCHEMA = {
  type: "object",
  properties: {
    intro: { type: "string" },
    selections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          justification: { type: "string" },
        },
        required: ["id", "justification"],
        additionalProperties: false,
      },
    },
  },
  required: ["intro", "selections"],
  additionalProperties: false,
};

// Choisit 3 à 5 comics parmi les candidats réels fournis par la DB et justifie chacun en une
// phrase. Le modèle ne voit QUE ces candidats — il ne peut pas inventer un comic qui n'existe
// pas. Les id renvoyés sont revérifiés côté appelant contre la liste des candidats.
export async function selectAndJustify(query, candidates, criteria = {}) {
  const catalog = candidates
    .map((c) => {
      const desc = c.description ? c.description.slice(0, 200) : "pas de description";
      return `- id:${c.id} | ${c.title} | genres: ${c.genres.join(", ") || "—"} | ${desc}`;
    })
    .join("\n");

  // mood / themes / era étaient extraits puis jamais utilisés. Ils ne servent pas à
  // filtrer (trop imprécis pour une requête SQL) mais renseignent utilement le choix
  // final parmi les candidats.
  const hints = [
    criteria.mood ? `Ambiance recherchée : ${criteria.mood}.` : "",
    criteria.themes?.length ? `Thèmes évoqués : ${criteria.themes.join(", ")}.` : "",
    criteria.era ? `Époque évoquée : ${criteria.era}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const { data } = await axios.post(
    API_URL,
    {
      model: MODEL,
      max_tokens: 700,
      system: `Tu es un conseiller de lecture BD/comics, tutoiement, réponses en français.\n\nComics candidats réels (n'en choisis que parmi cette liste, n'invente jamais un id) :\n${catalog}\n\nL'utilisateur cherche : "${query}".${hints}\n\nChoisis entre 3 et 5 des meilleurs candidats ci-dessus (jamais plus que la liste, jamais moins que 1 s'il y a au moins un candidat pertinent) et justifie chaque choix en une phrase. Si aucun candidat ne correspond exactement à la demande, retiens quand même les plus proches en le disant franchement dans "intro" — ne renvoie une liste vide que si les candidats n'ont vraiment aucun rapport. "intro" est une phrase d'introduction avant la liste.`,
      messages: [{ role: "user", content: query }],
      output_config: { format: { type: "json_schema", schema: SELECTION_SCHEMA } },
    },
    { headers: headers(), timeout: TIMEOUT_MS }
  );
  return firstText(data.content);
}
