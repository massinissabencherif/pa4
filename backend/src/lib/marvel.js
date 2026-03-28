import crypto from "crypto";
import axios from "axios";

const BASE_URL = "https://gateway.marvel.com/v1/public";

function getAuthParams() {
  const ts = Date.now().toString();
  const hash = crypto
    .createHash("md5")
    .update(ts + process.env.MARVEL_PRIVATE_KEY + process.env.MARVEL_PUBLIC_KEY)
    .digest("hex");

  return { ts, apikey: process.env.MARVEL_PUBLIC_KEY, hash };
}

export async function searchComics(query, limit = 20, offset = 0) {
  const { data } = await axios.get(`${BASE_URL}/comics`, {
    params: {
      ...getAuthParams(),
      titleStartsWith: query,
      limit,
      offset,
      orderBy: "-focDate",
    },
  });
  return data.data;
}

export async function getComicById(externalId) {
  const { data } = await axios.get(`${BASE_URL}/comics/${externalId}`, {
    params: getAuthParams(),
  });
  return data.data.results[0] ?? null;
}

export function normalizeComic(raw) {
  return {
    externalId: String(raw.id),
    title: raw.title,
    description: raw.description || null,
    coverUrl: raw.thumbnail
      ? `${raw.thumbnail.path}/portrait_xlarge.${raw.thumbnail.extension}`
      : null,
    genres: raw.genres?.map((g) => g.name) ?? [],
    authors: raw.creators?.items?.map((c) => c.name) ?? [],
    publishedAt: raw.dates?.find((d) => d.type === "onsaleDate")?.date
      ? new Date(raw.dates.find((d) => d.type === "onsaleDate").date)
      : null,
  };
}
