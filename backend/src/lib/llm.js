import axios from "axios";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.LLM_MODEL || "claude-haiku-4-5";
const TIMEOUT_MS = 8000;

function headers() {
  return {
    "content-type": "application/json",
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
  };
}

function firstText(content) {
  const block = content.find((b) => b.type === "text");
  return block ? JSON.parse(block.text) : null;
}

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    genres: { type: "array", items: { type: "string" } },
    mood: { type: "string" },
    themes: { type: "array", items: { type: "string" } },
    exclude: { type: "array", items: { type: "string" } },
    era: { type: "string" },
  },
  required: ["genres", "mood", "themes", "exclude", "era"],
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
      system: `Tu extrais des critères de recherche de comics à partir d'une demande en langage naturel, en français. Genres disponibles dans le catalogue : ${availableGenres.join(", ")}. N'utilise que des genres de cette liste dans "genres" et "exclude" (jamais un genre absent de la liste). "mood" est un mot ou une courte expression (ex: "sombre", "léger", "haletant"), chaîne vide si non précisé. "era" est une période si mentionnée, sinon une chaîne vide.`,
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
export async function selectAndJustify(query, candidates) {
  const catalog = candidates
    .map((c) => {
      const desc = c.description ? c.description.slice(0, 200) : "pas de description";
      return `- id:${c.id} | ${c.title} | genres: ${c.genres.join(", ") || "—"} | ${desc}`;
    })
    .join("\n");

  const { data } = await axios.post(
    API_URL,
    {
      model: MODEL,
      max_tokens: 700,
      system: `Tu es un conseiller de lecture BD/comics, tutoiement, réponses en français.\n\nComics candidats réels (n'en choisis que parmi cette liste, n'invente jamais un id) :\n${catalog}\n\nL'utilisateur cherche : "${query}". Choisis entre 3 et 5 des meilleurs candidats ci-dessus (jamais plus que la liste, jamais moins que 1 s'il y a au moins un candidat pertinent) et justifie chaque choix en une phrase. "intro" est une phrase d'introduction avant la liste.`,
      messages: [{ role: "user", content: query }],
      output_config: { format: { type: "json_schema", schema: SELECTION_SCHEMA } },
    },
    { headers: headers(), timeout: TIMEOUT_MS }
  );
  return firstText(data.content);
}
