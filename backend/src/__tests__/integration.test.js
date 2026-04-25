import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../server.js'
import prisma from '../lib/prisma.js'
import { hashToken } from '../lib/crypto.js'

const TEST_USER = {
  email: 'integration_test@comicster.test',
  username: 'integration_testuser',
  password: 'TestPassword123!',
}

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
    expect(res.body).toHaveProperty('refreshToken')
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

  it('refuse un email mal formé → 400', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'pas_un_email',
      username: 'test_bad_email',
      password: 'TestPassword123!',
    })
    expect(res.status).toBe(400)
  })

  it('refuse un mot de passe trop court (< 8 chars) → 400', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'short_pwd@comicster.test',
      username: 'short_pwd_user',
      password: 'abc',
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

  it('refuse si email manquant → 400', async () => {
    const res = await request(app).post('/auth/login').send({ password: 'TestPassword123!' })
    expect(res.status).toBe(400)
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
  it('émet un nouvel access token avec un refreshToken valide → 200', async () => {
    const loginRes = await request(app).post('/auth/login').send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    })
    const { refreshToken } = loginRes.body

    const res = await request(app).post('/auth/refresh').send({ refreshToken })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body).toHaveProperty('refreshToken')
    // Le nouveau refresh token doit être différent (rotation)
    expect(res.body.refreshToken).not.toBe(refreshToken)
  })

  it('refuse un refreshToken invalide → 401', async () => {
    const res = await request(app).post('/auth/refresh').send({
      refreshToken: 'token_bidon_invalide',
    })
    expect(res.status).toBe(401)
  })

  it('refuse si refreshToken manquant → 400', async () => {
    const res = await request(app).post('/auth/refresh').send({})
    expect(res.status).toBe(400)
  })
})

// ─── Logout ──────────────────────────────────────────────────────────────────

describe('POST /auth/logout', () => {
  it('logout invalide le refresh token → le refresh suivant échoue', async () => {
    const loginRes = await request(app).post('/auth/login').send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    })
    const { refreshToken } = loginRes.body

    const logoutRes = await request(app).post('/auth/logout').send({ refreshToken })
    expect(logoutRes.status).toBe(200)

    // Le refresh token ne doit plus fonctionner
    const refreshRes = await request(app).post('/auth/refresh').send({ refreshToken })
    expect(refreshRes.status).toBe(401)
  })
})

// ─── Sécurité : refresh tokens hashés en base ────────────────────────────────

describe('Sécurité — refresh tokens', () => {
  it('le token brut ne se trouve pas en base (seul le hash est stocké)', async () => {
    const loginRes = await request(app).post('/auth/login').send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    })
    const { refreshToken } = loginRes.body

    // Vérifier que le token brut n'existe pas en base
    const byRawToken = await prisma.refreshToken.findFirst({
      where: { tokenHash: refreshToken }, // cherche le token brut comme hash (doit échouer)
    })
    expect(byRawToken).toBeNull()

    // Vérifier que le hash existe bien en base
    const byHash = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
    })
    expect(byHash).not.toBeNull()
    expect(byHash.userId).toBeTruthy()
  })
})

// ─── OAuth exchange ───────────────────────────────────────────────────────────

describe('POST /auth/oauth/exchange', () => {
  it('refuse un code invalide → 401', async () => {
    const res = await request(app).post('/auth/oauth/exchange').send({ code: 'code_bidon' })
    expect(res.status).toBe(401)
  })

  it('refuse si code manquant → 400', async () => {
    const res = await request(app).post('/auth/oauth/exchange').send({})
    expect(res.status).toBe(400)
  })

  it('refuse un code expiré → 401', async () => {
    // Crée un OAuthCode expiré directement en base
    const user = await prisma.user.findUnique({ where: { email: TEST_USER.email } })
    const expiredCode = await prisma.oAuthCode.create({
      data: {
        code: 'expired_test_code_12345',
        userId: user.id,
        expiresAt: new Date(Date.now() - 1000), // déjà expiré
      },
    })
    const res = await request(app).post('/auth/oauth/exchange').send({ code: expiredCode.code })
    expect(res.status).toBe(401)
  })
})
