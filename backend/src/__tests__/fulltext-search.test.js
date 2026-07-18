import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../server.js'
import prisma from '../lib/prisma.js'

const EXT_IDS = ['fts-batman', 'fts-nightwing', 'fts-xmen', 'fts-author']

async function cleanup() {
  await prisma.comic.deleteMany({ where: { externalId: { in: EXT_IDS } } })
}

beforeAll(async () => {
  await cleanup()
  await prisma.comic.createMany({
    data: [
      {
        externalId: 'fts-batman',
        title: 'Batman: Year One',
        description: 'Les débuts du chevalier noir à Gotham City.',
        publisher: 'DC Comics',
        publishedAt: new Date('1987-02-01'),
        genres: ['Action'],
        authors: ['Frank Miller'],
      },
      {
        externalId: 'fts-nightwing',
        title: 'Nightwing Rebirth',
        // "chevalier" uniquement dans la description — introuvable avec un contains sur le titre
        description: 'Un ancien acolyte du chevalier noir vole de ses propres ailes.',
        publisher: 'DC Comics',
        publishedAt: new Date('2016-07-01'),
        genres: ['Action'],
        authors: ['Tim Seeley'],
      },
      {
        externalId: 'fts-xmen',
        title: 'X-Men: Dark Phoenix Saga',
        description: 'Jean Grey et la force du Phénix.',
        publisher: 'Marvel',
        publishedAt: new Date('1980-01-01'),
        genres: ['Science-fiction'],
        authors: ['Chris Claremont'],
      },
      {
        externalId: 'fts-author',
        title: 'Elektra Lives Again',
        description: 'Un récit de rédemption.',
        publisher: 'Marvel',
        publishedAt: new Date('1990-01-01'),
        genres: ['Drame'],
        authors: ['Frank Miller'],
      },
    ],
  })
})

afterAll(async () => {
  await cleanup()
  await prisma.$disconnect()
})

function extIds(res) {
  return res.body.comics.map((c) => c.externalId).filter((id) => EXT_IDS.includes(id))
}

describe('GET /comics/search — full-text', () => {
  it('trouve un mot présent uniquement dans la description', async () => {
    const res = await request(app).get('/comics/search?q=chevalier')
    expect(res.status).toBe(200)
    expect(extIds(res)).toEqual(expect.arrayContaining(['fts-batman', 'fts-nightwing']))
  })

  it('matche les préfixes de mots (recherche partielle)', async () => {
    const res = await request(app).get('/comics/search?q=cheval')
    expect(extIds(res)).toContain('fts-batman')
  })

  it('combine plusieurs mots en AND', async () => {
    const res = await request(app).get('/comics/search?q=chevalier acolyte')
    const ids = extIds(res)
    expect(ids).toContain('fts-nightwing')
    expect(ids).not.toContain('fts-batman')
  })

  it('trouve toujours par auteur (comportement historique conservé)', async () => {
    const res = await request(app).get('/comics/search?q=frank miller')
    expect(extIds(res)).toEqual(expect.arrayContaining(['fts-batman', 'fts-author']))
  })

  it('ne plante pas sur une saisie pleine de caractères spéciaux', async () => {
    const res = await request(app).get(`/comics/search?q=${encodeURIComponent("&|!:*()' --")}`)
    expect(res.status).toBe(200)
  })

  it('refuse une requête trop courte → 400', async () => {
    const res = await request(app).get('/comics/search?q=a')
    expect(res.status).toBe(400)
  })
})

describe('GET /comics/search — filtres', () => {
  it('filtre par éditeur', async () => {
    const res = await request(app).get('/comics/search?q=chevalier&publisher=DC')
    expect(extIds(res)).toEqual(expect.arrayContaining(['fts-batman', 'fts-nightwing']))

    const marvel = await request(app).get('/comics/search?q=chevalier&publisher=Marvel')
    expect(extIds(marvel)).toHaveLength(0)
  })

  it('filtre par fenêtre d’années', async () => {
    const res = await request(app).get('/comics/search?q=chevalier&yearFrom=2000')
    const ids = extIds(res)
    expect(ids).toContain('fts-nightwing')
    expect(ids).not.toContain('fts-batman')

    const old = await request(app).get('/comics/search?q=chevalier&yearTo=2000')
    const oldIds = extIds(old)
    expect(oldIds).toContain('fts-batman')
    expect(oldIds).not.toContain('fts-nightwing')
  })

  it('tri par titre', async () => {
    const res = await request(app).get('/comics/search?q=chevalier&sort=title')
    const ids = extIds(res)
    expect(ids.indexOf('fts-batman')).toBeLessThan(ids.indexOf('fts-nightwing'))
  })
})

describe('GET /comics — filtres éditeur/années', () => {
  it('filtre la liste par éditeur', async () => {
    const res = await request(app).get('/comics?publisher=Marvel&limit=200')
    const ids = extIds(res)
    expect(ids).toEqual(expect.arrayContaining(['fts-xmen', 'fts-author']))
    expect(ids).not.toContain('fts-batman')
  })
})

describe('GET /comics/publishers', () => {
  it('liste les éditeurs distincts', async () => {
    const res = await request(app).get('/comics/publishers')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(expect.arrayContaining(['DC Comics', 'Marvel']))
  })
})
