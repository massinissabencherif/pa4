import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../server.js'
import prisma from '../lib/prisma.js'

const TEST_USER = {
  email: 'integration_test@comicster.test',
  username: 'integration_testuser',
  password: 'TestPassword123!',
}

// Nettoyage avant et après les tests
beforeAll(async () => {
  await prisma.readingEntry.deleteMany({ where: { user: { email: TEST_USER.email } } })
  await prisma.refreshToken.deleteMany({ where: { user: { email: TEST_USER.email } } })
  await prisma.user.deleteMany({ where: { email: TEST_USER.email } })
})

afterAll(async () => {
  await prisma.readingEntry.deleteMany({ where: { user: { email: TEST_USER.email } } })
  await prisma.refreshToken.deleteMany({ where: { user: { email: TEST_USER.email } } })
  await prisma.user.deleteMany({ where: { email: TEST_USER.email } })
  await prisma.$disconnect()
})

// ─── Register ────────────────────────────────────────────────────────────────

describe('POST /auth/register', () => {
  it('crée un compte avec des données valides → 201', async () => {
    const res = await request(app).post('/auth/register').send(TEST_USER)
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user.email).toBe(TEST_USER.email)
  })

  it('refuse un email déjà utilisé → 409', async () => {
    const res = await request(app).post('/auth/register').send({
      ...TEST_USER,
      username: 'autre_username',
    })
    expect(res.status).toBe(409)
  })

  it('refuse si le champ email est manquant → 400', async () => {
    const res = await request(app).post('/auth/register').send({
      username: 'sans_email',
      password: 'TestPassword123!',
    })
    expect(res.status).toBe(400)
  })

  it('refuse si le mot de passe est manquant → 400', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'sans_mdp@comicster.test',
      username: 'sans_mdp_user',
    })
    expect(res.status).toBe(400)
  })
})

// ─── Login ───────────────────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  it('retourne un token avec les bons identifiants → 200', async () => {
    const res = await request(app).post('/auth/login').send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body).toHaveProperty('refreshToken')
  })

  it('refuse un mauvais mot de passe → 401', async () => {
    const res = await request(app).post('/auth/login').send({
      email: TEST_USER.email,
      password: 'MauvaisMotDePasse!',
    })
    expect(res.status).toBe(401)
  })

  it('refuse un email inexistant → 401', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'inexistant@comicster.test',
      password: 'TestPassword123!',
    })
    expect(res.status).toBe(401)
  })
})

// ─── Routes protégées ────────────────────────────────────────────────────────

describe('Routes protégées — sans token', () => {
  it('GET /history sans token → 401', async () => {
    const res = await request(app).get('/history')
    expect(res.status).toBe(401)
  })

  it('GET /lists sans token → 401', async () => {
    const res = await request(app).get('/lists')
    expect(res.status).toBe(401)
  })

  it('GET /reviews/me sans token → 401', async () => {
    const res = await request(app).get('/reviews/me')
    expect(res.status).toBe(401)
  })

  it('POST /reading-list sans token → 401', async () => {
    const res = await request(app).post('/reading-list').send({ comicId: 'fake' })
    expect(res.status).toBe(401)
  })
})

// ─── Refresh token ───────────────────────────────────────────────────────────

describe('POST /auth/refresh', () => {
  it('émet un nouvel token avec un refreshToken valide → 200', async () => {
    // Login pour obtenir un refresh token
    const loginRes = await request(app).post('/auth/login').send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    })
    const { refreshToken } = loginRes.body

    const res = await request(app).post('/auth/refresh').send({ refreshToken })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
  })

  it('refuse un refreshToken invalide → 401', async () => {
    const res = await request(app).post('/auth/refresh').send({
      refreshToken: 'token_bidon_invalide',
    })
    expect(res.status).toBe(401)
  })
})
