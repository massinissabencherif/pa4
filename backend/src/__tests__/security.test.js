import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import { hashToken, encryptTotp, decryptTotp } from '../lib/crypto.js'

// ─── hashToken ────────────────────────────────────────────────────────────────

describe('hashToken', () => {
  it('retourne un hash SHA-256 hex de 64 caractères', () => {
    const token = crypto.randomBytes(64).toString('hex')
    const hash = hashToken(token)
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[a-f0-9]+$/)
  })

  it('deux tokens différents donnent des hashes différents', () => {
    const h1 = hashToken(crypto.randomBytes(64).toString('hex'))
    const h2 = hashToken(crypto.randomBytes(64).toString('hex'))
    expect(h1).not.toBe(h2)
  })

  it('le même token donne toujours le même hash (déterministe)', () => {
    const token = 'test_token_stable'
    expect(hashToken(token)).toBe(hashToken(token))
  })

  it('le hash est différent du token brut', () => {
    const token = 'mon_token_brut'
    expect(hashToken(token)).not.toBe(token)
  })
})

// ─── TOTP encryption ──────────────────────────────────────────────────────────

// Clé test 32 octets / 64 hex chars
const TEST_KEY = crypto.randomBytes(32).toString('hex')

describe('encryptTotp / decryptTotp', () => {
  it('chiffre puis déchiffre correctement le secret', () => {
    process.env.TOTP_ENCRYPTION_KEY = TEST_KEY
    const secret = 'JBSWY3DPEHPK3PXP'
    const encrypted = encryptTotp(secret)
    expect(encrypted).not.toBe(secret)
    expect(decryptTotp(encrypted)).toBe(secret)
  })

  it('le format chiffré contient 3 parties (iv:enc:tag)', () => {
    process.env.TOTP_ENCRYPTION_KEY = TEST_KEY
    const encrypted = encryptTotp('JBSWY3DPEHPK3PXP')
    expect(encrypted.split(':')).toHaveLength(3)
  })

  it('deux chiffrements du même secret donnent des résultats différents (IV aléatoire)', () => {
    process.env.TOTP_ENCRYPTION_KEY = TEST_KEY
    const enc1 = encryptTotp('JBSWY3DPEHPK3PXP')
    const enc2 = encryptTotp('JBSWY3DPEHPK3PXP')
    expect(enc1).not.toBe(enc2)
    // Mais les deux se déchiffrent en le même secret
    expect(decryptTotp(enc1)).toBe(decryptTotp(enc2))
  })

  it('la modification du ciphertext corrompt le déchiffrement (authenticité GCM)', () => {
    process.env.TOTP_ENCRYPTION_KEY = TEST_KEY
    const encrypted = encryptTotp('JBSWY3DPEHPK3PXP')
    // Corrompt le ciphertext
    const parts = encrypted.split(':')
    parts[1] = 'ff'.repeat(parts[1].length / 2) // remplace par des ff
    const tampered = parts.join(':')
    expect(() => decryptTotp(tampered)).toThrow()
  })

  it('compatibilité legacy : retourne le secret tel quel si pas de ":" (ancien plaintext)', () => {
    process.env.TOTP_ENCRYPTION_KEY = TEST_KEY
    const legacySecret = 'PLAINTEXTSECRET'
    expect(decryptTotp(legacySecret)).toBe(legacySecret)
  })

  it('lève une erreur si TOTP_ENCRYPTION_KEY manquante', () => {
    const savedKey = process.env.TOTP_ENCRYPTION_KEY
    delete process.env.TOTP_ENCRYPTION_KEY
    expect(() => encryptTotp('secret')).toThrow()
    process.env.TOTP_ENCRYPTION_KEY = savedKey
  })

  it('lève une erreur si TOTP_ENCRYPTION_KEY trop courte', () => {
    process.env.TOTP_ENCRYPTION_KEY = 'toocourt'
    expect(() => encryptTotp('secret')).toThrow()
    process.env.TOTP_ENCRYPTION_KEY = TEST_KEY
  })
})

// ─── Multer fileFilter logic (test unitaire) ──────────────────────────────────

const ALLOWED_PDF_MIME = ['application/pdf']
const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_PDF_EXT = ['.pdf']
const ALLOWED_IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

function simulateFileFilter(fieldname, mimetype, originalname) {
  const ext = originalname.split('.').pop() ? `.${originalname.split('.').pop().toLowerCase()}` : ''
  const errors = []

  if (fieldname === 'pdf') {
    if (!ALLOWED_PDF_MIME.includes(mimetype)) errors.push('MIME invalide')
    if (!ALLOWED_PDF_EXT.includes(ext)) errors.push('Extension invalide')
  } else if (fieldname === 'cover') {
    if (!ALLOWED_IMAGE_MIME.includes(mimetype)) errors.push('MIME invalide')
    if (!ALLOWED_IMAGE_EXT.includes(ext)) errors.push('Extension invalide')
  } else {
    errors.push('Champ non autorisé')
  }
  return errors
}

describe('Upload admin — validation type fichier', () => {
  it('accepte un vrai PDF', () => {
    expect(simulateFileFilter('pdf', 'application/pdf', 'comic.pdf')).toHaveLength(0)
  })

  it('rejette un exe déguisé en pdf (mauvais MIME)', () => {
    expect(simulateFileFilter('pdf', 'application/octet-stream', 'virus.pdf')).toContain('MIME invalide')
  })

  it('rejette un PDF avec mauvaise extension', () => {
    expect(simulateFileFilter('pdf', 'application/pdf', 'comic.exe')).toContain('Extension invalide')
  })

  it('accepte une couverture JPEG', () => {
    expect(simulateFileFilter('cover', 'image/jpeg', 'cover.jpg')).toHaveLength(0)
  })

  it('accepte une couverture PNG', () => {
    expect(simulateFileFilter('cover', 'image/png', 'cover.png')).toHaveLength(0)
  })

  it('rejette un SVG comme couverture (non dans la liste)', () => {
    expect(simulateFileFilter('cover', 'image/svg+xml', 'cover.svg')).toContain('MIME invalide')
  })

  it('rejette un champ de fichier arbitraire', () => {
    expect(simulateFileFilter('evil_field', 'image/jpeg', 'photo.jpg')).toContain('Champ non autorisé')
  })
})
