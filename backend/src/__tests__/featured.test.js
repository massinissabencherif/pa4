import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from '../server.js'
import prisma from '../lib/prisma.js'

const ADMIN = { email: 'featured_admin@comicster.test', username: 'featured_admin' }

let adminToken
let comicA
let comicB

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  )
}

async function cleanup() {
  await prisma.featuredComic.deleteMany({})
  await prisma.comic.deleteMany({ where: { externalId: { in: ['featured-a', 'featured-b'] } } })
  await prisma.user.deleteMany({ where: { email: ADMIN.email } })
}

beforeAll(async () => {
  await cleanup()
  const admin = await prisma.user.create({
    data: { ...ADMIN, role: 'ADMIN', totpEnabled: true },
  })
  adminToken = signToken(admin)

  comicA = await prisma.comic.create({
    data: { externalId: 'featured-a', title: 'Featured Comic A', genres: [], authors: [] },
  })
  comicB = await prisma.comic.create({
    data: { externalId: 'featured-b', title: 'Featured Comic B', genres: [], authors: [] },
  })
})

afterAll(async () => {
  await cleanup()
  await prisma.$disconnect()
})

describe('GET /featured/current', () => {
  it('retourne featured: null quand rien n’est mis en avant', async () => {
    const res = await request(app).get('/featured/current')
    expect(res.status).toBe(200)
    expect(res.body.featured).toBeNull()
  })
})

describe('POST /admin/featured', () => {
  it('refuse sans auth admin → 401', async () => {
    const res = await request(app).post('/admin/featured').send({ comicId: comicA.id })
    expect(res.status).toBe(401)
  })

  it('refuse un comic inexistant → 404', async () => {
    const res = await request(app)
      .post('/admin/featured')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ comicId: 'nexiste_pas' })
    expect(res.status).toBe(404)
  })

  it('met un comic en avant, visible sur /featured/current', async () => {
    const res = await request(app)
      .post('/admin/featured')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ comicId: comicA.id, blurb: 'Le choix de la rédaction' })
    expect(res.status).toBe(201)

    const current = await request(app).get('/featured/current')
    expect(current.body.featured.comic.title).toBe('Featured Comic A')
    expect(current.body.featured.blurb).toBe('Le choix de la rédaction')
  })

  it('une nouvelle mise en avant clôt la précédente (une seule active)', async () => {
    const res = await request(app)
      .post('/admin/featured')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ comicId: comicB.id })
    expect(res.status).toBe(201)

    const current = await request(app).get('/featured/current')
    expect(current.body.featured.comic.title).toBe('Featured Comic B')

    const actives = await prisma.featuredComic.findMany({ where: { endAt: null } })
    expect(actives).toHaveLength(1)
  })

  it('refuse un blurb trop long → 400', async () => {
    const res = await request(app)
      .post('/admin/featured')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ comicId: comicA.id, blurb: 'x'.repeat(501) })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /admin/featured/current', () => {
  it('retire la mise en avant courante', async () => {
    const res = await request(app)
      .delete('/admin/featured/current')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)

    const current = await request(app).get('/featured/current')
    expect(current.body.featured).toBeNull()
  })

  it('404 quand il n’y a rien à retirer', async () => {
    const res = await request(app)
      .delete('/admin/featured/current')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(404)
  })
})

describe('GET /admin/featured', () => {
  it('retourne l’historique avec le flag isCurrent', async () => {
    const res = await request(app)
      .get('/admin/featured')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(2)
    expect(res.body.every((f) => f.isCurrent === false)).toBe(true)
    expect(res.body[0].comic.title).toBeDefined()
  })
})
