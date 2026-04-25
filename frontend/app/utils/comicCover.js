const COVER_RULES = [
  { keys: ["batman", "bruce wayne", "gotham"], cover: "/covers/defaults/batman.svg" },
  { keys: ["spider-man", "spiderman", "spider man", "peter parker"], cover: "/covers/defaults/spiderman.svg" },
  { keys: ["superman", "clark kent", "man of steel"], cover: "/covers/defaults/superman.svg" },
  { keys: ["x-men", "xmen", "wolverine", "x men"], cover: "/covers/defaults/xmen.svg" },
  { keys: ["avengers"], cover: "/covers/defaults/avengers.svg" },
  { keys: ["deadpool", "wade wilson"], cover: "/covers/defaults/deadpool.svg" },
  { keys: ["wonder woman", "diana prince"], cover: "/covers/defaults/wonder-woman.svg" },
  { keys: ["justice league"], cover: "/covers/defaults/justice-league.svg" },
  { keys: ["marvel"], cover: "/covers/defaults/marvel.svg" },
  { keys: ["dc comics", " dc "], cover: "/covers/defaults/dc.svg" },
]

export function getComicCover(comic) {
  if (comic?.coverUrl) return comic.coverUrl

  const haystack = [
    comic?.title,
    comic?.description,
    ...(comic?.genres || []),
    ...(comic?.authors || []),
    comic?.publisher,
  ].filter(Boolean).join(" ").toLowerCase()

  return COVER_RULES.find((rule) =>
    rule.keys.some((key) => haystack.includes(key))
  )?.cover ?? "/covers/defaults/default-comic.svg"
}
