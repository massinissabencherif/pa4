import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from '../server.js'
import prisma from '../lib/prisma.js'

const USER_A = { email: 'report_a@comicster.test', username: 'report_user_a', password: 'TestPassword123!' }
const USER_B = { email: 'report_b@comicster.test', username: 'report_user_b', password: 'TestPassword123!' }
const USER_C = { email: 'report_c@comicster.test', username: 'report_user_c', password: 'TestPassword123!' }
const ADMIN = { email: 'report_admin@comicster.test', username: 'report_admin' }
const ADMIN_NO_2FA = { email: 'report_admin_no2fa@comicster.test', username: 'report_admin_no2fa' }

const ALL_TEST_EMAILS = [USER_A.email, USER_B.email, USER_C.email, ADMIN.email, ADMIN_NO_2FA.email]

let tokenA, tokenB, tokenC, adminToken, adminNo2faToken
let userAId, userBId, userCId
let guide

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  )
}

async function cleanup() {
  const emailFilter = { email: { in: ALL_TEST_EMAILS } }
  await prisma.report.deleteMany({ where: { reporter: emailFilter } })
  await prisma.commentLike.deleteMany({ where: { user: emailFilter } })
  await prisma.comment.deleteMany({ where: { user: emailFilter } })
  await prisma.reviewLike.deleteMany({ where: { user: emailFilter } })
  await prisma.review.deleteMany({ where: { user: emailFilter } })
  await prisma.guideReply.deleteMany({ where: { author: emailFilter } })
  await prisma.guideTopic.deleteMany({ where: { author: emailFilter } })
  await prisma.refreshToken.deleteMany({ where: { user: emailFilter } })
  await prisma.user.deleteMany({ where: emailFilter })
  await prisma.comic.deleteMany({ where: { externalId: { startsWith: 'report-test-comic' } } })
  await prisma.readingGuide.deleteMany({ where: { slug: 'report-test-guide' } })
}

// Review a une contrainte unique (userId, comicId) — chaque test qui a besoin
// d'un avis "propre" crée son propre comic jetable pour éviter les collisions
// entre tests indépendants qui réutilisent le même auteur.
let reviewComicCounter = 0
async function makeReview(userId, { rating = 3, content = 'Contenu de test' } = {}) {
  const c = await prisma.comic.create({
    data: { externalId: `report-test-comic-${reviewComicCounter++}`, title: 'Comic jetable', genres: [], authors: [] },
  })
  return prisma.review.create({ data: { userId, comicId: c.id, rating, content } })
}

beforeAll(async () => {
  await cleanup()

  const resA = await request(app).post('/auth/register').send(USER_A)
  tokenA = resA.body.token
  userAId = resA.body.user.id

  const resB = await request(app).post('/auth/register').send(USER_B)
  tokenB = resB.body.token
  userBId = resB.body.user.id

  const resC = await request(app).post('/auth/register').send(USER_C)
  tokenC = resC.body.token
  userCId = resC.body.user.id

  const admin = await prisma.user.create({ data: { ...ADMIN, role: 'ADMIN', totpEnabled: true } })
  adminToken = signToken(admin)

  const adminNo2fa = await prisma.user.create({ data: { ...ADMIN_NO_2FA, role: 'ADMIN', totpEnabled: false } })
  adminNo2faToken = signToken(adminNo2fa)

  guide = await prisma.readingGuide.create({
    data: { slug: 'report-test-guide', character: 'Test', teaser: 't', story: 's' },
  })
})

afterAll(async () => {
  await cleanup()
  await prisma.$disconnect()
})

describe('POST /reports — validation', () => {
  it('type de cible invalide → 400', async () => {
    const res = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ targetType: 'USER', targetId: 'x', reason: 'SPAM' })
    expect(res.status).toBe(400)
  })

  it('motif invalide → 400', async () => {
    const res = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ targetType: 'REVIEW', targetId: 'x', reason: 'PAS_UN_MOTIF' })
    expect(res.status).toBe(400)
  })

  it('motif AUTRE sans détails → 400', async () => {
    const res = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ targetType: 'REVIEW', targetId: 'x', reason: 'AUTRE' })
    expect(res.status).toBe(400)
  })

  it('cible inexistante → 404', async () => {
    const res = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ targetType: 'REVIEW', targetId: 'nope', reason: 'SPAM' })
    expect(res.status).toBe(404)
  })

  it('sans token → 401', async () => {
    const res = await request(app)
      .post('/reports')
      .send({ targetType: 'REVIEW', targetId: 'x', reason: 'SPAM' })
    expect(res.status).toBe(401)
  })
})

describe('POST /reports — signalement', () => {
  it('signaler son propre contenu → 400', async () => {
    const review = await makeReview(userAId, { rating: 5, content: 'Mon propre avis' })
    const res = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ targetType: 'REVIEW', targetId: review.id, reason: 'SPAM' })
    expect(res.status).toBe(400)
  })

  it('signale un avis avec snapshot + auteur capturés', async () => {
    const review = await makeReview(userAId, { rating: 2, content: 'Avis à signaler' })
    const res = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ targetType: 'REVIEW', targetId: review.id, reason: 'HATE' })
    expect(res.status).toBe(201)
    expect(res.body.authorUsername).toBe(USER_A.username)
    expect(res.body.contentSnapshot).toContain('Avis à signaler')
    expect(res.body.status).toBe('PENDING')
  })

  it('signaler deux fois la même cible par le même reporter → 409', async () => {
    const review = await makeReview(userAId, { rating: 1, content: 'Encore un avis' })
    const first = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ targetType: 'REVIEW', targetId: review.id, reason: 'SPAM' })
    expect(first.status).toBe(201)

    const second = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ targetType: 'REVIEW', targetId: review.id, reason: 'SPAM' })
    expect(second.status).toBe(409)
  })

  it('deux reporters différents peuvent signaler la même cible', async () => {
    const review = await makeReview(userAId, { rating: 1, content: 'Avis multi-signalé' })
    const fromB = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ targetType: 'REVIEW', targetId: review.id, reason: 'SPAM' })
    const fromC = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenC}`)
      .send({ targetType: 'REVIEW', targetId: review.id, reason: 'HATE' })
    expect(fromB.status).toBe(201)
    expect(fromC.status).toBe(201)
  })

  it('motif AUTRE avec détails → accepté', async () => {
    const review = await makeReview(userAId, { rating: 3, content: 'Avis motif autre' })
    const res = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ targetType: 'REVIEW', targetId: review.id, reason: 'AUTRE', details: 'Contexte précis' })
    expect(res.status).toBe(201)
    expect(res.body.details).toBe('Contexte précis')
  })

  it('signale un commentaire', async () => {
    const review = await makeReview(userAId, { rating: 4, content: 'Support de commentaire' })
    const comment = await prisma.comment.create({
      data: { userId: userBId, reviewId: review.id, content: 'Commentaire à signaler' },
    })
    const res = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ targetType: 'COMMENT', targetId: comment.id, reason: 'NSFW' })
    expect(res.status).toBe(201)
    expect(res.body.authorUsername).toBe(USER_B.username)
  })

  it('signale un topic de parcours et une réponse', async () => {
    const topic = await prisma.guideTopic.create({
      data: { guideId: guide.id, authorId: userAId, title: 'Topic signalé', content: 'contenu topic' },
    })
    const reply = await prisma.guideReply.create({
      data: { topicId: topic.id, authorId: userBId, content: 'Réponse signalée' },
    })

    const resTopic = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ targetType: 'GUIDE_TOPIC', targetId: topic.id, reason: 'HARCELEMENT' })
    expect(resTopic.status).toBe(201)

    const resReply = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ targetType: 'GUIDE_REPLY', targetId: reply.id, reason: 'HARCELEMENT' })
    expect(resReply.status).toBe(201)
  })
})

describe('GET /admin/reports — accès', () => {
  it('sans token → 401', async () => {
    const res = await request(app).get('/admin/reports')
    expect(res.status).toBe(401)
  })

  it('utilisateur non-admin → 403', async () => {
    const res = await request(app).get('/admin/reports').set('Authorization', `Bearer ${tokenA}`)
    expect(res.status).toBe(403)
  })

  it('admin sans 2FA → 403 avec requires2FASetup', async () => {
    const res = await request(app).get('/admin/reports').set('Authorization', `Bearer ${adminNo2faToken}`)
    expect(res.status).toBe(403)
    expect(res.body.requires2FASetup).toBe(true)
  })

  it('admin avec 2FA → liste les signalements en attente', async () => {
    const res = await request(app).get('/admin/reports').set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.reports)).toBe(true)
    expect(res.body.reports.length).toBeGreaterThan(0)
    expect(res.body.reports.every((r) => r.status === 'PENDING')).toBe(true)
  })
})

describe('PATCH /admin/reports/:id — résolution', () => {
  it('RESOLVE supprime le contenu (avis) et marque le signalement résolu', async () => {
    const review = await makeReview(userAId, { rating: 1, content: 'Avis à supprimer' })
    const reportRes = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ targetType: 'REVIEW', targetId: review.id, reason: 'SPAM' })

    const patchRes = await request(app)
      .patch(`/admin/reports/${reportRes.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'RESOLVE' })

    expect(patchRes.status).toBe(200)
    expect(patchRes.body.status).toBe('RESOLVED')
    expect(patchRes.body.resolvedBy.username).toBe(ADMIN.username)

    const stillThere = await prisma.review.findUnique({ where: { id: review.id } })
    expect(stillThere).toBeNull()
  })

  it("RESOLVE sur un avis qui a un commentaire supprime les deux (fix cascade Comment→Review)", async () => {
    const review = await makeReview(userAId, { rating: 1, content: 'Avis avec commentaire' })
    const comment = await prisma.comment.create({
      data: { userId: userBId, reviewId: review.id, content: 'Un commentaire dessus' },
    })
    const reportRes = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenC}`)
      .send({ targetType: 'REVIEW', targetId: review.id, reason: 'SPAM' })

    const patchRes = await request(app)
      .patch(`/admin/reports/${reportRes.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'RESOLVE' })

    expect(patchRes.status).toBe(200)
    expect(await prisma.review.findUnique({ where: { id: review.id } })).toBeNull()
    expect(await prisma.comment.findUnique({ where: { id: comment.id } })).toBeNull()
  })

  it('RESOLVE sur une réponse de parcours qui a une réponse imbriquée ne supprime pas la réponse enfant (fix SetNull)', async () => {
    const topic = await prisma.guideTopic.create({
      data: { guideId: guide.id, authorId: userAId, title: 'Topic parent', content: 'contenu' },
    })
    const parentReply = await prisma.guideReply.create({
      data: { topicId: topic.id, authorId: userBId, content: 'Réponse toxique' },
    })
    const childReply = await prisma.guideReply.create({
      data: { topicId: topic.id, authorId: userCId, content: 'Réponse innocente', parentId: parentReply.id },
    })

    const reportRes = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ targetType: 'GUIDE_REPLY', targetId: parentReply.id, reason: 'HARCELEMENT' })

    const patchRes = await request(app)
      .patch(`/admin/reports/${reportRes.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'RESOLVE' })

    expect(patchRes.status).toBe(200)
    expect(await prisma.guideReply.findUnique({ where: { id: parentReply.id } })).toBeNull()

    const stillChild = await prisma.guideReply.findUnique({ where: { id: childReply.id } })
    expect(stillChild).toBeTruthy()
    expect(stillChild.parentId).toBeNull()
  })

  it('RESOLVE tolère un contenu déjà supprimé entre-temps (race condition)', async () => {
    const review = await makeReview(userAId, { rating: 1, content: 'Avis auto-supprimé' })
    const reportRes = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ targetType: 'REVIEW', targetId: review.id, reason: 'SPAM' })

    // L'auteur supprime son propre avis avant que l'admin traite le signalement
    await prisma.review.delete({ where: { id: review.id } })

    const patchRes = await request(app)
      .patch(`/admin/reports/${reportRes.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'RESOLVE' })

    expect(patchRes.status).toBe(200)
    expect(patchRes.body.status).toBe('RESOLVED')
  })

  it('RESOLVE clôture aussi les autres signalements en attente sur la même cible', async () => {
    const review = await makeReview(userAId, { rating: 1, content: 'Avis multi-reporté' })
    const fromB = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ targetType: 'REVIEW', targetId: review.id, reason: 'SPAM' })
    const fromC = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenC}`)
      .send({ targetType: 'REVIEW', targetId: review.id, reason: 'HATE' })

    await request(app)
      .patch(`/admin/reports/${fromB.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'RESOLVE' })

    const otherReport = await prisma.report.findUnique({ where: { id: fromC.body.id } })
    expect(otherReport.status).toBe('RESOLVED')
  })

  it('DISMISS rejette le signalement sans toucher au contenu', async () => {
    const review = await makeReview(userAId, { rating: 5, content: 'Avis légitime' })
    const reportRes = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ targetType: 'REVIEW', targetId: review.id, reason: 'SPAM' })

    const patchRes = await request(app)
      .patch(`/admin/reports/${reportRes.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'DISMISS' })

    expect(patchRes.status).toBe(200)
    expect(patchRes.body.status).toBe('DISMISSED')
    expect(await prisma.review.findUnique({ where: { id: review.id } })).toBeTruthy()
  })

  it('action invalide → 400', async () => {
    const review = await makeReview(userAId, { rating: 5, content: 'Avis pour action invalide' })
    const reportRes = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ targetType: 'REVIEW', targetId: review.id, reason: 'SPAM' })

    const patchRes = await request(app)
      .patch(`/admin/reports/${reportRes.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'NOPE' })
    expect(patchRes.status).toBe(400)
  })

  it('traiter deux fois le même signalement → 409', async () => {
    const review = await makeReview(userAId, { rating: 5, content: 'Avis traité deux fois' })
    const reportRes = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ targetType: 'REVIEW', targetId: review.id, reason: 'SPAM' })

    await request(app)
      .patch(`/admin/reports/${reportRes.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'DISMISS' })

    const second = await request(app)
      .patch(`/admin/reports/${reportRes.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'DISMISS' })
    expect(second.status).toBe(409)
  })

  it('signalement inexistant → 404', async () => {
    const res = await request(app)
      .patch('/admin/reports/nope')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'DISMISS' })
    expect(res.status).toBe(404)
  })

  it('non-admin ne peut pas traiter un signalement → 403', async () => {
    const review = await makeReview(userAId, { rating: 5, content: 'Avis protégé' })
    const reportRes = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ targetType: 'REVIEW', targetId: review.id, reason: 'SPAM' })

    const res = await request(app)
      .patch(`/admin/reports/${reportRes.body.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ action: 'DISMISS' })
    expect(res.status).toBe(403)
  })
})
