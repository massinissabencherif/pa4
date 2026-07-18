import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import request from 'supertest'
import { app } from '../server.js'
import prisma from '../lib/prisma.js'
import { seededRng, pickSeededComicIds, awardXp, utcDateKey } from '../lib/arcade.js'

vi.mock('../lib/email.js', () => ({
  sendRegistrationConfirmationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendPasswordChangedEmail: vi.fn(),
  sendOAuthAccountNotice: vi.fn(),
}))

const TEST_USER = {
  email: 'arcade_core@comicster.test',
  username: 'arcade_core_user',
  password: 'ArcadePassword123',
}

let token
let userId
const EXT_IDS = Array.from({ length: 10 }, (_, i) => `arcade-core-${i}`)

async function cleanup() {
  const user = await prisma.user.findUnique({ where: { email: TEST_USER.email } })
  if (user) {
    await prisma.arcadeRun.deleteMany({ where: { userId: user.id } })
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
      title: `Arcade Core Comic ${i}`,
      coverUrl: i < 8 ? `https://example.com/cover-${i}.jpg` : null,
      genres: ['Test'],
      authors: [],
    })),
  })
})

afterAll(async () => {
  await cleanup()
  await prisma.$disconnect()
})

describe('seededRng', () => {
  it('produit la même séquence pour le même seed', () => {
    const a = seededRng('2026-07-13:COMICDLE')
    const b = seededRng('2026-07-13:COMICDLE')
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('produit des séquences différentes pour des seeds différents', () => {
    const a = seededRng('2026-07-13:COMICDLE')
    const b = seededRng('2026-07-14:COMICDLE')
    expect(a()).not.toBe(b())
  })
})

describe('pickSeededComicIds', () => {
  it('est déterministe et sans doublon', async () => {
    const opts = { seed: 'test-seed', count: 5 }
    const first = await pickSeededComicIds(prisma, opts)
    const second = await pickSeededComicIds(prisma, opts)
    expect(first).toEqual(second)
    expect(new Set(first).size).toBe(first.length)
  })

  it('respecte le filtre where (ex: coverUrl requis)', async () => {
    const ids = await pickSeededComicIds(prisma, {
      seed: 'covers-only',
      count: 20,
      where: { coverUrl: { not: null }, externalId: { in: EXT_IDS } },
    })
    expect(ids.length).toBe(8) // 8 comics de test avec cover sur 10
  })

  it('retourne [] sur un pool vide', async () => {
    const ids = await pickSeededComicIds(prisma, {
      seed: 'empty',
      count: 5,
      where: { externalId: 'nexiste-pas' },
    })
    expect(ids).toEqual([])
  })
})

describe('awardXp', () => {
  it('incrémente le XP du user', async () => {
    await awardXp(prisma, userId, 50)
    await awardXp(prisma, userId, 25)
    const user = await prisma.user.findUnique({ where: { id: userId } })
    expect(user.xp).toBe(75)
  })

  it('ignore les montants nuls, négatifs ou invalides', async () => {
    await awardXp(prisma, userId, 0)
    await awardXp(prisma, userId, -10)
    await awardXp(prisma, userId, NaN)
    const user = await prisma.user.findUnique({ where: { id: userId } })
    expect(user.xp).toBe(75)
  })
})

describe('GET /arcade/me', () => {
  it('refuse sans auth → 401', async () => {
    const res = await request(app).get('/arcade/me')
    expect(res.status).toBe(401)
  })

  it('retourne le XP et l’état des défis du jour', async () => {
    await prisma.arcadeRun.create({
      data: {
        userId,
        game: 'COMICDLE',
        dateKey: utcDateKey(),
        state: {},
        score: 120,
        finishedAt: new Date(),
      },
    })
    const res = await request(app).get('/arcade/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.xp).toBe(75)
    expect(res.body.today.COMICDLE).toEqual({ score: 120, finished: true })
    expect(res.body.today.COVER_MYSTERY).toBeUndefined()
  })
})
