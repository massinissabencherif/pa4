import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../server.js'
import prisma from '../lib/prisma.js'

const PLACEMENTS = ['HOME', 'COMIC_DETAIL', 'GUIDES_LIST', 'GUIDE_DETAIL']

async function cleanup() {
  await prisma.adBanner.deleteMany({ where: { placement: { in: PLACEMENTS } } })
}

beforeEach(cleanup)
afterAll(async () => {
  await cleanup()
  await prisma.$disconnect()
})

describe('GET /ads', () => {
  it('refuse un placement manquant → 400', async () => {
    const res = await request(app).get('/ads')
    expect(res.status).toBe(400)
  })

  it('refuse un placement inconnu → 400', async () => {
    const res = await request(app).get('/ads?placement=SIDEBAR')
    expect(res.status).toBe(400)
  })

  it("status generic si aucune ligne n'existe pour l'emplacement (jamais configuré)", async () => {
    const res = await request(app).get('/ads?placement=HOME')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('generic')
  })

  it('status hidden si une ligne existe mais est explicitement désactivée', async () => {
    await prisma.adBanner.create({
      data: { placement: 'HOME', isActive: false },
    })
    const res = await request(app).get('/ads?placement=HOME')
    expect(res.body.status).toBe('hidden')
  })

  it('status generic si active mais sans image (encart réinitialisé)', async () => {
    await prisma.adBanner.create({
      data: { placement: 'HOME', isActive: true },
    })
    const res = await request(app).get('/ads?placement=HOME')
    expect(res.body.status).toBe('generic')
  })

  it('status ad avec le bon encart si active avec image, sans dates', async () => {
    await prisma.adBanner.create({
      data: { placement: 'COMIC_DETAIL', isActive: true, imageUrl: 'https://example.com/ad1.png', altText: 'ad1' },
    })
    const res = await request(app).get('/ads?placement=COMIC_DETAIL')
    expect(res.body.status).toBe('ad')
    expect(res.body.ad.altText).toBe('ad1')
  })

  it('status generic (pas hidden) si active+image mais fenêtre de diffusion passée', async () => {
    await prisma.adBanner.create({
      data: {
        placement: 'GUIDE_DETAIL',
        isActive: true,
        imageUrl: 'https://example.com/ad3.png',
        startAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    })
    const res = await request(app).get('/ads?placement=GUIDE_DETAIL')
    expect(res.body.status).toBe('generic')
  })

  it("status generic si active+image mais n'a pas encore commencé", async () => {
    await prisma.adBanner.create({
      data: {
        placement: 'HOME',
        isActive: true,
        imageUrl: 'https://example.com/ad4.png',
        startAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })
    const res = await request(app).get('/ads?placement=HOME')
    expect(res.body.status).toBe('generic')
  })

  it('status ad si la fenêtre de diffusion est en cours', async () => {
    await prisma.adBanner.create({
      data: {
        placement: 'HOME',
        isActive: true,
        imageUrl: 'https://example.com/ad5.png',
        altText: 'en_cours',
        startAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })
    const res = await request(app).get('/ads?placement=HOME')
    expect(res.body.status).toBe('ad')
    expect(res.body.ad.altText).toBe('en_cours')
  })

  it("une ligne désactivée n'empêche pas une autre ligne active de s'afficher", async () => {
    await prisma.adBanner.create({ data: { placement: 'HOME', isActive: false } })
    await prisma.adBanner.create({
      data: { placement: 'HOME', isActive: true, imageUrl: 'https://example.com/ad6.png', altText: 'active_row' },
    })
    const res = await request(app).get('/ads?placement=HOME')
    expect(res.body.status).toBe('ad')
    expect(res.body.ad.altText).toBe('active_row')
  })
})
