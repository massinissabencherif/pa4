import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcrypt'
import { app } from '../server.js'
import prisma from '../lib/prisma.js'
import { hashToken } from '../lib/crypto.js'

vi.mock('../lib/email.js', () => ({
  sendRegistrationConfirmationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendPasswordChangedEmail: vi.fn(),
  sendOAuthAccountNotice: vi.fn(),
}))

import {
  sendRegistrationConfirmationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendOAuthAccountNotice,
} from '../lib/email.js'

const TEST_USER = {
  email: 'pwreset_test@comicster.test',
  username: 'pwreset_testuser',
  password: 'OriginalPassword123',
}

const OAUTH_USER_EMAIL = 'pwreset_oauth@comicster.test'

async function cleanup() {
  await prisma.passwordResetToken.deleteMany({
    where: { user: { email: { in: [TEST_USER.email, OAUTH_USER_EMAIL] } } },
  })
  await prisma.refreshToken.deleteMany({
    where: { user: { email: { in: [TEST_USER.email, OAUTH_USER_EMAIL] } } },
  })
  await prisma.user.deleteMany({ where: { email: { in: [TEST_USER.email, OAUTH_USER_EMAIL] } } })
}

beforeAll(cleanup)
afterAll(async () => {
  await cleanup()
  await prisma.$disconnect()
})

function extractToken(resetUrl) {
  return resetUrl.split('/reset-password/')[1]
}

// ─── Register → email de confirmation d'inscription ──────────────────────────

describe('POST /auth/register', () => {
  it('déclenche un email de confirmation d\'inscription', async () => {
    const res = await request(app).post('/auth/register').send(TEST_USER)
    expect(res.status).toBe(201)
    expect(sendRegistrationConfirmationEmail).toHaveBeenCalledWith(TEST_USER.email, TEST_USER.username)
  })
})

// ─── Forgot password ───────────────────────────────────────────────────────────

describe('POST /auth/forgot-password', () => {
  it('répond avec un message générique pour un compte existant', async () => {
    const res = await request(app).post('/auth/forgot-password').send({ email: TEST_USER.email })
    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/instructions ont été envoyées/)
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1)
    expect(sendPasswordResetEmail.mock.calls[0][0]).toBe(TEST_USER.email)
    expect(sendPasswordResetEmail.mock.calls[0][1]).toContain('/auth/reset-password/')
  })

  it('répond avec le même message générique pour un email inconnu (anti-enumeration)', async () => {
    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'inconnu_xyz@comicster.test' })
    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/instructions ont été envoyées/)
  })

  it('notifie un compte OAuth-only sans générer de lien de reset', async () => {
    await prisma.user.create({
      data: {
        email: OAUTH_USER_EMAIL,
        username: 'pwreset_oauth_user',
        oauthProvider: 'google',
        oauthId: 'fake_oauth_id_pwreset',
      },
    })
    sendPasswordResetEmail.mockClear()

    const res = await request(app).post('/auth/forgot-password').send({ email: OAUTH_USER_EMAIL })
    expect(res.status).toBe(200)
    expect(sendOAuthAccountNotice).toHaveBeenCalledWith(OAUTH_USER_EMAIL)
    expect(sendPasswordResetEmail).not.toHaveBeenCalled()
  })

  it('refuse un email manquant → 400', async () => {
    const res = await request(app).post('/auth/forgot-password').send({})
    expect(res.status).toBe(400)
  })
})

// ─── Reset password ─────────────────────────────────────────────────────────────

describe('POST /auth/reset-password', () => {
  it('refuse un token invalide → 401', async () => {
    const res = await request(app)
      .post('/auth/reset-password')
      .send({ token: 'token_qui_nexiste_pas', password: 'NouveauPassword123' })
    expect(res.status).toBe(401)
  })

  it('refuse un token expiré → 401', async () => {
    const user = await prisma.user.findUnique({ where: { email: TEST_USER.email } })
    const rawToken = 'expired_raw_token_test'
    await prisma.passwordResetToken.create({
      data: {
        tokenHash: hashToken(rawToken),
        userId: user.id,
        expiresAt: new Date(Date.now() - 60 * 1000), // expiré depuis 1 minute
      },
    })

    const res = await request(app)
      .post('/auth/reset-password')
      .send({ token: rawToken, password: 'NouveauPassword123' })
    expect(res.status).toBe(401)
  })

  it('refuse un mot de passe trop court → 400', async () => {
    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: TEST_USER.email })
    const rawToken = extractToken(sendPasswordResetEmail.mock.calls.at(-1)[1])

    const badRes = await request(app)
      .post('/auth/reset-password')
      .send({ token: rawToken, password: 'court' })
    expect(badRes.status).toBe(400)
  })

  it('réinitialise le mot de passe, révoque les sessions existantes et notifie par email', async () => {
    // Connexion pour obtenir un refresh token à révoquer
    const loginRes = await request(app).post('/auth/login').send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    })
    const oldRefreshToken = loginRes.body.refreshToken
    expect(oldRefreshToken).toBeTruthy()

    sendPasswordResetEmail.mockClear()
    await request(app).post('/auth/forgot-password').send({ email: TEST_USER.email })
    const rawToken = extractToken(sendPasswordResetEmail.mock.calls.at(-1)[1])

    const NEW_PASSWORD = 'NouveauPassword456'
    const resetRes = await request(app)
      .post('/auth/reset-password')
      .send({ token: rawToken, password: NEW_PASSWORD })
    expect(resetRes.status).toBe(200)
    expect(sendPasswordChangedEmail).toHaveBeenCalledWith(TEST_USER.email)

    // L'ancien mot de passe ne fonctionne plus
    const oldLoginRes = await request(app).post('/auth/login').send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    })
    expect(oldLoginRes.status).toBe(401)

    // Le nouveau mot de passe fonctionne
    const newLoginRes = await request(app).post('/auth/login').send({
      email: TEST_USER.email,
      password: NEW_PASSWORD,
    })
    expect(newLoginRes.status).toBe(200)

    // L'ancien refresh token a été révoqué
    const refreshRes = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: oldRefreshToken })
    expect(refreshRes.status).toBe(401)

    // Le token de reset est à usage unique
    const secondUse = await request(app)
      .post('/auth/reset-password')
      .send({ token: rawToken, password: 'EncoreUnAutre789' })
    expect(secondUse.status).toBe(401)
  })
})
