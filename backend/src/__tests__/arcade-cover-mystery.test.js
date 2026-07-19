import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import request from 'supertest'
import { app } from '../server.js'
import prisma from '../lib/prisma.js'
import { pointsForElapsed, ROUNDS_PER_RUN } from '../routes/arcadeCoverMystery.js'

vi.mock('../lib/email.js', () => ({
  sendRegistrationConfirmationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendPasswordChangedEmail: vi.fn(),
  sendOAuthAccountNotice: vi.fn(),
}))

const TEST_USER = {
  email: 'covermystery_test@comicster.test',
  username: 'covermystery_user',
  password: 'CoverPassword123!',
}

let token
let userId

const EXT_IDS = Array.from({ length: 12 }, (_, i) => `cover-mystery-${i}`)

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
      title: `Cover Mystery Comic ${i}`,
      coverUrl: `https://example.com/cm-${i}.jpg`,
      genres: i % 2 === 0 ? ['Action'] : ['Horreur'],
      authors: [],
    })),
  })
})

afterAll(async () => {
  await cleanup()
  await prisma.$disconnect()
})

// Récupère la réponse d'un round directement en base (les tests ont le droit de tricher)
async function currentAnswer(runId) {
  const run = await prisma.arcadeRun.findUnique({ where: { id: runId } })
  const round = run.state.rounds[run.state.currentRound]
  return { run, round }
}

describe('pointsForElapsed', () => {
  it('applique les paliers 100/70/40/20', () => {
    expect(pointsForElapsed(1_000)).toBe(100)
    expect(pointsForElapsed(7_000)).toBe(70)
    expect(pointsForElapsed(15_000)).toBe(40)
    expect(pointsForElapsed(60_000)).toBe(20)
  })
})

describe('POST /arcade/cover-mystery/start', () => {
  it('démarre le défi du jour : cover + 4 choix, réponse jamais désignée', async () => {
    const res = await request(app)
      .post('/arcade/cover-mystery/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ mode: 'daily' })
    expect(res.status).toBe(200)
    expect(res.body.cover).toBeTruthy()
    expect(res.body.choices).toHaveLength(4)
    expect(res.body.roundIndex).toBe(0)
    expect(res.body.totalRounds).toBe(ROUNDS_PER_RUN)
    // Le payload ne désigne pas laquelle des 4 propositions est la bonne
    expect(JSON.stringify(res.body)).not.toContain('answerId')
  })

  it('start à nouveau reprend la même partie (pas de nouveau tirage quotidien)', async () => {
    const res = await request(app)
      .post('/arcade/cover-mystery/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ mode: 'daily' })
    expect(res.status).toBe(200)
    expect(res.body.roundIndex).toBe(0)
    const runs = await prisma.arcadeRun.findMany({ where: { userId, game: 'COVER_MYSTERY', dateKey: { not: null } } })
    expect(runs).toHaveLength(1)
  })
})

describe('POST /arcade/cover-mystery/guess — défi du jour', () => {
  it('bonne réponse rapide → 100 points', async () => {
    const runs = await prisma.arcadeRun.findMany({ where: { userId, game: 'COVER_MYSTERY', dateKey: { not: null } } })
    const { round } = await currentAnswer(runs[0].id)

    const res = await request(app)
      .post('/arcade/cover-mystery/guess')
      .set('Authorization', `Bearer ${token}`)
      .send({ runId: runs[0].id, comicId: round.answerId })
    expect(res.status).toBe(200)
    expect(res.body.roundResult.correct).toBe(true)
    expect(res.body.roundResult.points).toBe(100)
    expect(res.body.next.roundIndex).toBe(1)
  })

  it('mauvaise réponse → 0 point, la bonne réponse est révélée', async () => {
    const runs = await prisma.arcadeRun.findMany({ where: { userId, game: 'COVER_MYSTERY', dateKey: { not: null } } })
    const { round } = await currentAnswer(runs[0].id)
    const wrongChoice = round.choices.find((id) => id !== round.answerId)

    const res = await request(app)
      .post('/arcade/cover-mystery/guess')
      .set('Authorization', `Bearer ${token}`)
      .send({ runId: runs[0].id, comicId: wrongChoice })
    expect(res.status).toBe(200)
    expect(res.body.roundResult.correct).toBe(false)
    expect(res.body.roundResult.points).toBe(0)
    expect(res.body.roundResult.answer.id).toBe(round.answerId)
  })

  it('refuse un choix hors liste → 400', async () => {
    const runs = await prisma.arcadeRun.findMany({ where: { userId, game: 'COVER_MYSTERY', dateKey: { not: null } } })
    const res = await request(app)
      .post('/arcade/cover-mystery/guess')
      .set('Authorization', `Bearer ${token}`)
      .send({ runId: runs[0].id, comicId: 'id_bidon' })
    expect(res.status).toBe(400)
  })

  it('termine les 5 rounds : XP créditée = score', async () => {
    const runs = await prisma.arcadeRun.findMany({ where: { userId, game: 'COVER_MYSTERY', dateKey: { not: null } } })
    const runId = runs[0].id

    let finished = false
    let body
    while (!finished) {
      const { round } = await currentAnswer(runId)
      const res = await request(app)
        .post('/arcade/cover-mystery/guess')
        .set('Authorization', `Bearer ${token}`)
        .send({ runId, comicId: round.answerId })
      body = res.body
      finished = body.finished
    }

    expect(body.rounds).toHaveLength(ROUNDS_PER_RUN)
    expect(body.xpAwarded).toBe(body.score)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    expect(user.xp).toBe(body.score)

    // Rejouer le défi du jour → renvoie le résumé, pas un nouveau tirage
    const again = await request(app)
      .post('/arcade/cover-mystery/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ mode: 'daily' })
    expect(again.body.finished).toBe(true)

    // Guess sur une partie finie → 409
    const { round } = await currentAnswer(runId).catch(() => ({ round: null }))
    const res409 = await request(app)
      .post('/arcade/cover-mystery/guess')
      .set('Authorization', `Bearer ${token}`)
      .send({ runId, comicId: 'peu_importe' })
    expect(res409.status).toBe(409)
  })
})

describe('mode infini', () => {
  it('rejouable à volonté et sans XP', async () => {
    const before = (await prisma.user.findUnique({ where: { id: userId } })).xp

    const startRes = await request(app)
      .post('/arcade/cover-mystery/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ mode: 'infinite' })
    expect(startRes.status).toBe(200)
    const runId = startRes.body.runId

    let finished = false
    let body
    while (!finished) {
      const { round } = await currentAnswer(runId)
      const res = await request(app)
        .post('/arcade/cover-mystery/guess')
        .set('Authorization', `Bearer ${token}`)
        .send({ runId, comicId: round.answerId })
      body = res.body
      finished = body.finished
    }

    expect(body.score).toBeGreaterThan(0)
    expect(body.xpAwarded).toBe(0)
    const after = (await prisma.user.findUnique({ where: { id: userId } })).xp
    expect(after).toBe(before)

    // Un deuxième run infini démarre sans conflit
    const secondRun = await request(app)
      .post('/arcade/cover-mystery/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ mode: 'infinite' })
    expect(secondRun.status).toBe(200)
    expect(secondRun.body.runId).not.toBe(runId)
  })

  it('refuse de jouer la partie d’un autre utilisateur → 404', async () => {
    const other = await request(app).post('/auth/register').send({
      email: 'covermystery_other@comicster.test',
      username: 'covermystery_other',
      password: 'OtherPassword123!',
    })
    const myRun = await prisma.arcadeRun.findFirst({ where: { userId, game: 'COVER_MYSTERY' } })

    const res = await request(app)
      .post('/arcade/cover-mystery/guess')
      .set('Authorization', `Bearer ${other.body.token}`)
      .send({ runId: myRun.id, comicId: 'x' })
    expect(res.status).toBe(404)

    await prisma.refreshToken.deleteMany({ where: { userId: other.body.user.id } })
    await prisma.user.delete({ where: { id: other.body.user.id } })
  })
})
