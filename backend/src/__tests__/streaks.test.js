import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import request from 'supertest'
import { app } from '../server.js'
import prisma from '../lib/prisma.js'
import { updateStreak, effectiveStreak, dayKey } from '../lib/streaks.js'

vi.mock('../lib/email.js', () => ({
  sendRegistrationConfirmationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendPasswordChangedEmail: vi.fn(),
  sendOAuthAccountNotice: vi.fn(),
}))

const TEST_USER = {
  email: 'streaks_test@comicster.test',
  username: 'streaks_test_user',
  password: 'StreakPassword123!',
}

let token
let userId
let entryId

const DAY = 24 * 60 * 60 * 1000

async function cleanup() {
  const user = await prisma.user.findUnique({ where: { email: TEST_USER.email } })
  if (user) {
    await prisma.userBadge.deleteMany({ where: { userId: user.id } })
    await prisma.readingEntry.deleteMany({ where: { userId: user.id } })
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } })
    await prisma.user.delete({ where: { id: user.id } })
  }
  await prisma.comic.deleteMany({ where: { externalId: 'streaks-test-comic' } })
}

beforeAll(async () => {
  await cleanup()
  const res = await request(app).post('/auth/register').send(TEST_USER)
  token = res.body.token
  userId = res.body.user.id

  const comic = await prisma.comic.create({
    data: { externalId: 'streaks-test-comic', title: 'Streaks Test Comic', genres: [], authors: [] },
  })
  const entryRes = await request(app)
    .post('/reading-list')
    .set('Authorization', `Bearer ${token}`)
    .send({ comicId: comic.id })
  entryId = entryRes.body.id
})

afterAll(async () => {
  await cleanup()
  await prisma.$disconnect()
})

describe('updateStreak (lib)', () => {
  it('démarre un streak à 1 à la première activité', async () => {
    const user = await updateStreak(userId, prisma)
    expect(user.currentStreak).toBe(1)
    expect(user.longestStreak).toBe(1)
    expect(dayKey(user.lastActiveDate)).toBe(dayKey(new Date()))
  })

  it("est idempotent sur la même journée", async () => {
    const user = await updateStreak(userId, prisma)
    expect(user.currentStreak).toBe(1)
  })

  it("incrémente si la dernière activité date d'hier", async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { lastActiveDate: new Date(Date.now() - DAY) },
    })
    const user = await updateStreak(userId, prisma)
    expect(user.currentStreak).toBe(2)
    expect(user.longestStreak).toBe(2)
  })

  it('reset à 1 si la dernière activité date de plus de 24h (jour sauté)', async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { lastActiveDate: new Date(Date.now() - 3 * DAY) },
    })
    const user = await updateStreak(userId, prisma)
    expect(user.currentStreak).toBe(1)
    expect(user.longestStreak).toBe(2) // le record est conservé
  })
})

describe('effectiveStreak (lib)', () => {
  it('retourne le streak si activité aujourd’hui ou hier', () => {
    expect(effectiveStreak({ currentStreak: 5, lastActiveDate: new Date() })).toBe(5)
    expect(effectiveStreak({ currentStreak: 5, lastActiveDate: new Date(Date.now() - DAY) })).toBe(5)
  })

  it('retourne 0 si le streak est cassé ou sans activité', () => {
    expect(effectiveStreak({ currentStreak: 5, lastActiveDate: new Date(Date.now() - 2 * DAY) })).toBe(0)
    expect(effectiveStreak({ currentStreak: 0, lastActiveDate: null })).toBe(0)
    expect(effectiveStreak(null)).toBe(0)
  })
})

describe('intégration routes', () => {
  it('PATCH /reading-list/:id/status IN_PROGRESS met à jour le streak', async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { currentStreak: 0, longestStreak: 2, lastActiveDate: null },
    })
    const res = await request(app)
      .patch(`/reading-list/${entryId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'IN_PROGRESS' })
    expect(res.status).toBe(200)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    expect(user.currentStreak).toBe(1)
  })

  it('PATCH /reading-list/:id/progress compte aussi comme activité', async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { lastActiveDate: new Date(Date.now() - DAY) },
    })
    const res = await request(app)
      .patch(`/reading-list/${entryId}/progress`)
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPage: 5, totalPages: 40 })
    expect(res.status).toBe(200)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    expect(user.currentStreak).toBe(2)
  })

  it('GET /stats/me expose le streak', async () => {
    const res = await request(app).get('/stats/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.streak).toEqual({ current: 2, longest: 2 })
  })

  it('attribue le badge streak_7 quand longestStreak atteint 7', async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { longestStreak: 7 },
    })
    const res = await request(app).get('/stats/me').set('Authorization', `Bearer ${token}`)
    const keys = res.body.badges.map((b) => b.badgeKey)
    expect(keys).toContain('streak_7')
    expect(keys).not.toContain('streak_30')
  })
})
