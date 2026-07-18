import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import request from 'supertest'
import { app } from '../server.js'
import prisma from '../lib/prisma.js'
import { utcDateKey } from '../lib/arcade.js'
import { getComicdleTargetId, buildFeedback, xpForWin, MAX_GUESSES } from '../routes/arcadeComicdle.js'

vi.mock('../lib/email.js', () => ({
  sendRegistrationConfirmationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendPasswordChangedEmail: vi.fn(),
  sendOAuthAccountNotice: vi.fn(),
}))

const TEST_USER = {
  email: 'comicdle_test@comicster.test',
  username: 'comicdle_test_user',
  password: 'ComicdlePassword123!',
}

let token
let userId
let targetId
let wrongComics // comics du pool ≠ cible

const EXT_IDS = Array.from({ length: 8 }, (_, i) => `comicdle-${i}`)

async function cleanup() {
  const user = await prisma.user.findUnique({ where: { email: TEST_USER.email } })
  if (user) {
    await prisma.arcadeRun.deleteMany({ where: { userId: user.id } })
    await prisma.readingEntry.deleteMany({ where: { userId: user.id } })
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } })
    await prisma.user.delete({ where: { id: user.id } })
  }
  await prisma.comic.deleteMany({ where: { externalId: { in: EXT_IDS } } })
}

beforeAll(async () => {
  await cleanup()
  const res = await request(app).post('/auth/register').send(TEST_USER)
  token = res.body.token
  userId = res.body.user.id

  await prisma.comic.createMany({
    data: EXT_IDS.map((extId, i) => ({
      externalId: extId,
      title: `Comicdle Test ${i}`,
      publisher: i % 2 === 0 ? 'DC Comics' : 'Marvel',
      publishedAt: new Date(Date.UTC(1990 + i, 0, 1)),
      genres: i < 4 ? ['Action', 'Aventure'] : ['Horreur'],
      authors: [`Auteur ${i % 3}`],
    })),
  })

  targetId = await getComicdleTargetId(utcDateKey())
  const pool = await prisma.comic.findMany({ where: { externalId: { in: EXT_IDS } } })
  wrongComics = pool.filter((c) => c.id !== targetId)
})

afterAll(async () => {
  await cleanup()
  await prisma.$disconnect()
})

describe('getComicdleTargetId', () => {
  it('est déterministe pour un même jour', async () => {
    const a = await getComicdleTargetId('2026-07-13')
    const b = await getComicdleTargetId('2026-07-13')
    expect(a).toBe(b)
  })
})

describe('buildFeedback', () => {
  const target = { id: 't', title: 'T', publisher: 'DC Comics', publishedAt: new Date(Date.UTC(2000, 0, 1)), genres: ['Action', 'Aventure'], authors: ['Alan Moore'] }

  it('détecte la bonne réponse', () => {
    const fb = buildFeedback(target, target)
    expect(fb.correct).toBe(true)
    expect(fb.genres).toBe('exact')
    expect(fb.publisher).toBe('match')
    expect(fb.year).toBe('match')
  })

  it('signale les correspondances partielles et directions d’année', () => {
    const guess = { id: 'g', title: 'G', publisher: 'Marvel', publishedAt: new Date(Date.UTC(1990, 0, 1)), genres: ['Action'], authors: ['Frank Miller'] }
    const fb = buildFeedback(guess, target)
    expect(fb.correct).toBe(false)
    expect(fb.genres).toBe('partial')
    expect(fb.publisher).toBe('none')
    expect(fb.year).toBe('higher') // la cible (2000) est plus récente que 1990
    expect(fb.authors).toBe('none')
  })

  it('gère les attributs manquants en unknown', () => {
    const guess = { id: 'g', title: 'G', publisher: null, publishedAt: null, genres: [], authors: [] }
    const fb = buildFeedback(guess, target)
    expect(fb.publisher).toBe('unknown')
    expect(fb.year).toBe('unknown')
  })
})

describe('flux de jeu', () => {
  it('GET /daily démarre vide, sans fuite de la cible', async () => {
    const res = await request(app).get('/arcade/comicdle/daily').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.guesses).toEqual([])
    expect(res.body.finished).toBe(false)
    expect(res.body.target).toBeUndefined()
    expect(JSON.stringify(res.body)).not.toContain(targetId)
  })

  it('un mauvais guess renvoie un feedback sans révéler la cible', async () => {
    const res = await request(app)
      .post('/arcade/comicdle/guess')
      .set('Authorization', `Bearer ${token}`)
      .send({ comicId: wrongComics[0].id })
    expect(res.status).toBe(200)
    expect(res.body.guesses).toHaveLength(1)
    expect(res.body.guesses[0].correct).toBe(false)
    expect(res.body.finished).toBe(false)
    expect(res.body.target).toBeUndefined()
  })

  it('rejette un titre déjà proposé → 400', async () => {
    const res = await request(app)
      .post('/arcade/comicdle/guess')
      .set('Authorization', `Bearer ${token}`)
      .send({ comicId: wrongComics[0].id })
    expect(res.status).toBe(400)
  })

  it('le bon guess gagne, crédite les XP et révèle la cible', async () => {
    const before = await prisma.user.findUnique({ where: { id: userId } })
    const res = await request(app)
      .post('/arcade/comicdle/guess')
      .set('Authorization', `Bearer ${token}`)
      .send({ comicId: targetId })
    expect(res.status).toBe(200)
    expect(res.body.solved).toBe(true)
    expect(res.body.finished).toBe(true)
    expect(res.body.score).toBe(xpForWin(2)) // 2e essai
    expect(res.body.target.id).toBe(targetId)

    const after = await prisma.user.findUnique({ where: { id: userId } })
    expect(after.xp - before.xp).toBe(xpForWin(2))
  })

  it('refuse de rejouer une partie terminée → 409', async () => {
    const res = await request(app)
      .post('/arcade/comicdle/guess')
      .set('Authorization', `Bearer ${token}`)
      .send({ comicId: wrongComics[1].id })
    expect(res.status).toBe(409)
  })

  it('perd après 6 mauvais essais (score 0, cible révélée)', async () => {
    // Reset de la partie du jour pour simuler une défaite
    await prisma.arcadeRun.deleteMany({ where: { userId, game: 'COMICDLE' } })

    let last
    for (let i = 0; i < MAX_GUESSES; i++) {
      last = await request(app)
        .post('/arcade/comicdle/guess')
        .set('Authorization', `Bearer ${token}`)
        .send({ comicId: wrongComics[i].id })
      expect(last.status).toBe(200)
    }
    expect(last.body.finished).toBe(true)
    expect(last.body.solved).toBe(false)
    expect(last.body.score).toBe(0)
    expect(last.body.target.id).toBe(targetId)
  })
})

describe('GET /arcade/comicdle/options', () => {
  it('autocomplete les titres', async () => {
    const res = await request(app)
      .get('/arcade/comicdle/options?q=Comicdle Test')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThan(0)
    expect(res.body[0]).toHaveProperty('id')
    expect(res.body[0]).toHaveProperty('title')
    expect(res.body[0].publisher).toBeUndefined() // pas de fuite d'attributs
  })
})
