import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../server.js'
import prisma from '../lib/prisma.js'

const USER_A = { email: 'notif_a@comicster.test', username: 'notif_user_a', password: 'TestPassword123!' }
const USER_B = { email: 'notif_b@comicster.test', username: 'notif_user_b', password: 'TestPassword123!' }
// Emails créés/supprimés dans les tests eux-mêmes — inclus ici pour que le cleanup
// reste fiable même après un run précédent interrompu en cours de route
const ALL_TEST_EMAILS = [
  USER_A.email,
  USER_B.email,
  'notif_temp@comicster.test',
  'notif_temp_actor@comicster.test',
]

let tokenA, tokenB, userAId, userBId
let comic, guideTopic

async function cleanup() {
  const emailFilter = { email: { in: ALL_TEST_EMAILS } }
  await prisma.notification.deleteMany({ where: { user: emailFilter } })
  await prisma.comment.deleteMany({ where: { user: emailFilter } })
  await prisma.review.deleteMany({ where: { user: emailFilter } })
  await prisma.guideReply.deleteMany({ where: { author: emailFilter } })
  await prisma.guideTopic.deleteMany({ where: { author: emailFilter } })
  // Follow n'a pas onDelete: Cascade sur User (gap préexistant, hors scope) —
  // on nettoie dans les deux sens pour ne pas bloquer la suppression des users de test
  await prisma.follow.deleteMany({ where: { OR: [{ follower: emailFilter }, { following: emailFilter }] } })
  await prisma.readingEntry.deleteMany({ where: { user: emailFilter } })
  await prisma.refreshToken.deleteMany({ where: { user: emailFilter } })
  await prisma.user.deleteMany({ where: emailFilter })
  await prisma.comic.deleteMany({ where: { externalId: 'notif-test-comic' } })
  await prisma.readingGuide.deleteMany({ where: { slug: 'notif-test-guide' } })
}

beforeAll(async () => {
  await cleanup()

  const resA = await request(app).post('/auth/register').send(USER_A)
  tokenA = resA.body.token
  userAId = resA.body.user.id

  const resB = await request(app).post('/auth/register').send(USER_B)
  tokenB = resB.body.token
  userBId = resB.body.user.id

  comic = await prisma.comic.create({
    data: {
      externalId: 'notif-test-comic',
      title: 'Notif Test Comic',
      genres: ['Action'],
      authors: ['Test Author'],
    },
  })

  const guide = await prisma.readingGuide.create({
    data: { slug: 'notif-test-guide', character: 'Test', teaser: 't', story: 's' },
  })
  guideTopic = await prisma.guideTopic.create({
    data: { guideId: guide.id, authorId: userBId, title: 'Topic de B', content: 'contenu' },
  })
})

afterAll(async () => {
  await cleanup()
  await prisma.$disconnect()
})

describe('Notifications — follow', () => {
  it('A suit B → B reçoit une notification FOLLOW', async () => {
    const res = await request(app)
      .post(`/users/${userBId}/follow`)
      .set('Authorization', `Bearer ${tokenA}`)
    expect(res.status).toBe(201)

    const list = await request(app).get('/notifications').set('Authorization', `Bearer ${tokenB}`)
    const followNotif = list.body.find((n) => n.type === 'FOLLOW' && n.actor.id === userAId)
    expect(followNotif).toBeTruthy()
    expect(followNotif.readAt).toBeNull()
    expect(followNotif.link).toBe(`/profile/${USER_A.username}`)
  })

  it("A ne peut pas voir les notifications de B (pas de fuite entre comptes)", async () => {
    const res = await request(app).get('/notifications').set('Authorization', `Bearer ${tokenA}`)
    const leaked = res.body.find((n) => n.type === 'FOLLOW' && n.actor?.id === userAId)
    expect(leaked).toBeFalsy()
  })
})

describe('Notifications — commentaire sur avis', () => {
  it("B commente l'avis de A → A reçoit une notification, pas d'auto-notif pour B", async () => {
    const reviewRes = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ comicId: comic.id, rating: 4, content: 'Pas mal' })
    expect(reviewRes.status).toBe(201)
    const reviewId = reviewRes.body.id

    // A commente son propre avis → pas de notification
    await request(app)
      .post(`/reviews/${reviewId}/comments`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Auto-commentaire' })

    const notifsA = await request(app).get('/notifications').set('Authorization', `Bearer ${tokenA}`)
    expect(notifsA.body.find((n) => n.type === 'REVIEW_COMMENT')).toBeFalsy()

    // B commente l'avis de A → notification pour A
    await request(app)
      .post(`/reviews/${reviewId}/comments`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ content: 'Commentaire de B' })

    const notifsA2 = await request(app).get('/notifications').set('Authorization', `Bearer ${tokenA}`)
    const commentNotif = notifsA2.body.find((n) => n.type === 'REVIEW_COMMENT' && n.actor.id === userBId)
    expect(commentNotif).toBeTruthy()
    expect(commentNotif.link).toBe('/reviews')
  })
})

describe('Notifications — réponses sur parcours (nested)', () => {
  let topLevelReplyId

  it("A répond au topic de B → B est notifié (pas A)", async () => {
    const res = await request(app)
      .post(`/guides/notif-test-guide/topics/${guideTopic.id}/replies`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Réponse de A' })
    expect(res.status).toBe(201)
    topLevelReplyId = res.body.id

    const notifsB = await request(app).get('/notifications').set('Authorization', `Bearer ${tokenB}`)
    const replyNotif = notifsB.body.find((n) => n.type === 'GUIDE_REPLY' && n.entityId === topLevelReplyId)
    expect(replyNotif).toBeTruthy()
    expect(replyNotif.link).toBe(`/guides/notif-test-guide/topics/${guideTopic.id}`)
  })

  it("B répond à la réponse de A (nested) → A est notifié, pas l'auteur du topic (lui-même)", async () => {
    const res = await request(app)
      .post(`/guides/notif-test-guide/topics/${guideTopic.id}/replies`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ content: 'Réponse imbriquée de B', parentId: topLevelReplyId })
    expect(res.status).toBe(201)

    const notifsA = await request(app).get('/notifications').set('Authorization', `Bearer ${tokenA}`)
    const nestedNotif = notifsA.body.find((n) => n.type === 'GUIDE_REPLY' && n.entityId === res.body.id)
    expect(nestedNotif).toBeTruthy()
    expect(nestedNotif.actor.id).toBe(userBId)
  })
})

describe('Notifications — badges', () => {
  it("le premier avis de A déclenche le badge first_read... first_review et une notification BADGE", async () => {
    const notifsA = await request(app).get('/notifications').set('Authorization', `Bearer ${tokenA}`)
    const badgeNotif = notifsA.body.find((n) => n.type === 'BADGE' && n.entityId === 'first_review')
    expect(badgeNotif).toBeTruthy()
    expect(badgeNotif.badge.name).toBeTruthy()
    expect(badgeNotif.link).toBe('/dashboard')
  })

  it('un badge déjà détenu ne re-génère pas de notification', async () => {
    const before = await prisma.notification.count({
      where: { userId: userAId, type: 'BADGE', entityId: 'first_review' },
    })
    // Repasse par une action qui redéclenche le check (login n'appelle pas checkAndAwardBadges,
    // mais /stats/me le fait — sert de filet de sécurité)
    await request(app).get('/stats/me').set('Authorization', `Bearer ${tokenA}`)
    const after = await prisma.notification.count({
      where: { userId: userAId, type: 'BADGE', entityId: 'first_review' },
    })
    expect(after).toBe(before)
  })
})

describe('Notifications — routes de lecture', () => {
  it('GET /notifications sans token → 401', async () => {
    const res = await request(app).get('/notifications')
    expect(res.status).toBe(401)
  })

  it('GET /notifications/unread-count reflète le nombre de non-lues', async () => {
    const res = await request(app).get('/notifications/unread-count').set('Authorization', `Bearer ${tokenB}`)
    const expected = await prisma.notification.count({ where: { userId: userBId, readAt: null } })
    expect(res.body.count).toBe(expected)
  })

  it("PATCH /notifications/:id/read refuse si la notification n'appartient pas à l'appelant", async () => {
    const notif = await prisma.notification.findFirst({ where: { userId: userBId } })
    const res = await request(app)
      .patch(`/notifications/${notif.id}/read`)
      .set('Authorization', `Bearer ${tokenA}`)
    expect(res.status).toBe(403)
  })

  it('PATCH /notifications/:id/read marque une notification comme lue', async () => {
    const notif = await prisma.notification.findFirst({ where: { userId: userBId, readAt: null } })
    const res = await request(app)
      .patch(`/notifications/${notif.id}/read`)
      .set('Authorization', `Bearer ${tokenB}`)
    expect(res.status).toBe(200)
    expect(res.body.readAt).toBeTruthy()
  })

  it('PATCH /notifications/read-all marque tout comme lu pour l\'appelant uniquement', async () => {
    const res = await request(app).patch('/notifications/read-all').set('Authorization', `Bearer ${tokenB}`)
    expect(res.status).toBe(200)

    const unreadB = await prisma.notification.count({ where: { userId: userBId, readAt: null } })
    expect(unreadB).toBe(0)

    // Les notifications de A ne sont pas affectées
    const unreadA = await prisma.notification.count({ where: { userId: userAId, readAt: null } })
    expect(unreadA).toBeGreaterThan(0)
  })
})

describe('Notifications — cascade suppression', () => {
  it('supprimer un compte supprime les notifications reçues (cascade)', async () => {
    const tempUser = { email: 'notif_temp@comicster.test', username: 'notif_temp_user', password: 'TestPassword123!' }
    const reg = await request(app).post('/auth/register').send(tempUser)
    const tempId = reg.body.user.id

    await request(app).post(`/users/${tempId}/follow`).set('Authorization', `Bearer ${tokenA}`)
    const before = await prisma.notification.count({ where: { userId: tempId } })
    expect(before).toBeGreaterThan(0)

    // Follow n'a pas de cascade sur User (gap préexistant, hors scope ici) —
    // on nettoie manuellement pour isoler la vérification de la cascade de Notification
    await prisma.follow.deleteMany({ where: { OR: [{ followerId: tempId }, { followingId: tempId }] } })
    await prisma.user.delete({ where: { id: tempId } })
    const after = await prisma.notification.count({ where: { userId: tempId } })
    expect(after).toBe(0)
  })

  it("supprimer l'acteur passe actorId à null sans supprimer la notification du destinataire", async () => {
    const tempActor = { email: 'notif_temp_actor@comicster.test', username: 'notif_temp_actor', password: 'TestPassword123!' }
    const reg = await request(app).post('/auth/register').send(tempActor)
    const tempActorToken = reg.body.token
    const tempActorId = reg.body.user.id

    await request(app).post(`/users/${userAId}/follow`).set('Authorization', `Bearer ${tempActorToken}`)
    const notif = await prisma.notification.findFirst({ where: { userId: userAId, actorId: tempActorId } })
    expect(notif).toBeTruthy()

    await prisma.follow.deleteMany({ where: { OR: [{ followerId: tempActorId }, { followingId: tempActorId }] } })
    await prisma.user.delete({ where: { id: tempActorId } })
    const updated = await prisma.notification.findUnique({ where: { id: notif.id } })
    expect(updated).toBeTruthy()
    expect(updated.actorId).toBeNull()
  })
})
