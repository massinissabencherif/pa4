import { describe, it, expect } from 'vitest'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const SECRET = 'test_secret_key'

describe('JWT — génération et vérification', () => {
  it('génère un token avec les bons claims', () => {
    const payload = { id: 'user-123', email: 'test@comicster.fr', role: 'USER' }
    const token = jwt.sign(payload, SECRET, { expiresIn: '15m' })

    const decoded = jwt.verify(token, SECRET)
    expect(decoded.id).toBe('user-123')
    expect(decoded.email).toBe('test@comicster.fr')
    expect(decoded.role).toBe('USER')
  })

  it('le token contient une date d\'expiration', () => {
    const token = jwt.sign({ id: 'u1' }, SECRET, { expiresIn: '15m' })
    const decoded = jwt.verify(token, SECRET)
    expect(decoded.exp).toBeDefined()
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })

  it('rejette un token signé avec un mauvais secret', () => {
    const token = jwt.sign({ id: 'u1' }, 'mauvais_secret')
    expect(() => jwt.verify(token, SECRET)).toThrow('invalid signature')
  })

  it('rejette un token expiré', () => {
    const token = jwt.sign({ id: 'u1' }, SECRET, { expiresIn: '0s' })
    // Attendre 1ms pour être sûr que le token est expiré
    return new Promise((resolve) => setTimeout(resolve, 10)).then(() => {
      expect(() => jwt.verify(token, SECRET)).toThrow('jwt expired')
    })
  })

  it('rejette un token malformé', () => {
    expect(() => jwt.verify('pas.un.token.valide', SECRET)).toThrow()
  })
})

describe('bcrypt — hachage des mots de passe', () => {
  it('hache un mot de passe (le hash diffère du plaintext)', async () => {
    const password = 'MonMotDePasse123!'
    const hash = await bcrypt.hash(password, 10)
    expect(hash).not.toBe(password)
    expect(hash).toMatch(/^\$2b\$/)
  })

  it('compare correctement un mot de passe valide', async () => {
    const password = 'MonMotDePasse123!'
    const hash = await bcrypt.hash(password, 10)
    const isValid = await bcrypt.compare(password, hash)
    expect(isValid).toBe(true)
  })

  it('rejette un mot de passe incorrect', async () => {
    const hash = await bcrypt.hash('MonMotDePasse123!', 10)
    const isValid = await bcrypt.compare('MauvaisMotDePasse', hash)
    expect(isValid).toBe(false)
  })

  it('deux hachages du même mot de passe sont différents (salt)', async () => {
    const password = 'MotDePasse123!'
    const hash1 = await bcrypt.hash(password, 10)
    const hash2 = await bcrypt.hash(password, 10)
    expect(hash1).not.toBe(hash2)
  })
})
