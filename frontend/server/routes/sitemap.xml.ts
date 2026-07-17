// Sitemap dynamique généré à la volée depuis l'API (maison, sans dépendance).
// Dégrade proprement vers les routes statiques si l'API ne répond pas.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const site = (config.public.siteUrl || 'https://sitedetestdemassinissabencherif.com').replace(/\/$/, '')
  const api = config.public.apiBase

  const routes = new Set<string>([
    '/',
    '/comics/search',
    '/authors',
    '/lists/public',
    '/guides',
    '/arcade',
    '/mentions-legales',
    '/rgpd',
  ])

  const safe = async (url: string): Promise<any> => {
    try {
      return await $fetch(url, { timeout: 5000 })
    } catch {
      return null
    }
  }

  // Comics : { total, count, offset, comics: [{ externalId }] }
  const comicsRes = await safe(`${api}/comics?limit=200`)
  const comics = Array.isArray(comicsRes) ? comicsRes : comicsRes?.comics || []
  for (const c of comics) if (c?.externalId) routes.add(`/comics/${c.externalId}`)

  // Auteurs : [{ slug }]
  const authorsRes = await safe(`${api}/authors`)
  const authors = Array.isArray(authorsRes) ? authorsRes : authorsRes?.authors || []
  for (const a of authors) if (a?.slug) routes.add(`/authors/${a.slug}`)

  // Parcours de lecture : [{ slug }]
  const guidesRes = await safe(`${api}/guides`)
  const guides = Array.isArray(guidesRes) ? guidesRes : guidesRes?.data || guidesRes?.guides || []
  for (const g of guides) if (g?.slug) routes.add(`/guides/${g.slug}`)

  const now = new Date().toISOString().slice(0, 10)
  const urls = [...routes]
    .map((path) => `  <url>\n    <loc>${site}${path}</loc>\n    <lastmod>${now}</lastmod>\n  </url>`)
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'max-age=3600, public')
  return xml
})
