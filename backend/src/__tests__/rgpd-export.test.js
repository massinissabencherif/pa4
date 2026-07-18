import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import request from 'supertest'
import { app } from '../server.js'
import prisma from '../lib/prisma.js'

vi.mock('../lib/email.js', () => ({
  sendRegistrationConfirmationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendPasswordChangedEmail: vi.fn(),
  sendOAuthAccountNotice: vi.fn(),
}))

const TEST_USER = {
  email: 'rgpd_export@comicster.test',
  username: 'rgpd_export_user',
  password: 'ExportPassword123',
}

let token
let comicId

async function cleanup() {
  const user = await prisma.user.findUnique({ where: { email: TEST_USER.email } })
  if (user) {
    await prisma.review.deleteMany({ where: { userId: user.id } })
    await prisma.readingEntry.deleteMany({ where: { userId: user.id } })
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } })
    await prisma.user.delete({ where: { id: user.id } })
  }
  await prisma.comic.deleteMany({ where: { externalId: 'rgpd-export-comic' } })
}

beforeAll(async () => {
  await cleanup()
  const res = await request(app).post('/auth/register').send(TEST_USER)
  token = res.body.token

  const comic = await prisma.comic.create({
    data: {
      externalId: 'rgpd-export-comic',
      title: 'RGPD Export Test Comic',
      genres: ['Test'],
      authors: ['Testeur'],
    },
  })
  comicId = comic.id

  const user = await prisma.user.findUnique({ where: { email: TEST_USER.email } })
  await prisma.readingEntry.create({
    data: { userId: user.id, comicId, status: 'FINISHED', finishedAt: new Date() },
  })
  await prisma.review.create({
    data: { userId: user.id, comicId, rating: 5, content: 'Excellent comic de test' },
  })
})

afterAll(async () => {
  await cleanup()
  await prisma.$disconnect()
})

describe('GET /me/export', () => {
  it('refuse un appel non authentifié → 401', async () => {
    const res = await request(app).get('/me/export')
    expect(res.status).toBe(401)
  })

  it('retourne toutes les sections attendues avec les données du user', async () => {
    const res = await request(app).get('/me/export').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)

    // Header de téléchargement
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="comicster-export-/)

    const body = res.body
    expect(body.format).toBe('comicster-export-v1')
    expect(body.profile.email).toBe(TEST_USER.email)
    expect(body.profile.username).toBe(TEST_USER.username)
    // Pas de données sensibles dans l'export
    expect(body.profile.passwordHash).toBeUndefined()
    expect(body.profile.totpSecret).toBeUndefined()

    // Sections présentes
    for (const key of ['readingJournal', 'reviews', 'comments', 'lists', 'social', 'badges', 'guideTopics', 'guideReplies']) {
      expect(body).toHaveProperty(key)
    }

    // Contenu du journal et des avis
    expect(body.readingJournal).toHaveLength(1)
    expect(body.readingJournal[0].comic).toBe('RGPD Export Test Comic')
    expect(body.readingJournal[0].status).toBe('FINISHED')
    expect(body.reviews).toHaveLength(1)
    expect(body.reviews[0].rating).toBe(5)
    expect(body.reviews[0].content).toBe('Excellent comic de test')
  })

  it("ne contient que les données du user connecté", async () => {
    // Un autre user avec ses propres données ne doit pas apparaître
    const res = await request(app).get('/me/export').set('Authorization', `Bearer ${token}`)
    const allComics = res.body.readingJournal.map((e) => e.externalId)
    expect(allComics).toEqual(['rgpd-export-comic'])
  })
})
