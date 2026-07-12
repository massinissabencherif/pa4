import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../server.js'
import prisma from '../lib/prisma.js'

const MARK = 'ads_test_'

async function cleanup() {
  await prisma.adBanner.deleteMany({ where: { altText: { startsWith: MARK } } })
}

beforeAll(cleanup)
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

  it("renvoie ad: null s'il n'y a aucun encart actif", async () => {
    const res = await request(app).get('/ads?placement=HOME')
    expect(res.status).toBe(200)
    expect(res.body.ad).toBeNull()
  })

  it('renvoie un encart actif sans dates (diffusion illimitée)', async () => {
    await prisma.adBanner.create({
      data: {
        imageUrl: 'https://example.com/ad1.png',
        altText: `${MARK}sans_dates`,
        placement: 'COMIC_DETAIL',
        isActive: true,
      },
    })

    const res = await request(app).get('/ads?placement=COMIC_DETAIL')
    expect(res.status).toBe(200)
    expect(res.body.ad).not.toBeNull()
    expect(res.body.ad.altText).toBe(`${MARK}sans_dates`)
  })

  it('exclut un encart inactif', async () => {
    await prisma.adBanner.deleteMany({ where: { placement: 'GUIDES_LIST', altText: { startsWith: MARK } } })
    await prisma.adBanner.create({
      data: {
        imageUrl: 'https://example.com/ad2.png',
        altText: `${MARK}inactif`,
        placement: 'GUIDES_LIST',
        isActive: false,
      },
    })

    const res = await request(app).get('/ads?placement=GUIDES_LIST')
    expect(res.body.ad).toBeNull()
  })

  it('exclut un encart dont la fenêtre de diffusion est passée', async () => {
    await prisma.adBanner.deleteMany({ where: { placement: 'GUIDE_DETAIL', altText: { startsWith: MARK } } })
    await prisma.adBanner.create({
      data: {
        imageUrl: 'https://example.com/ad3.png',
        altText: `${MARK}expire`,
        placement: 'GUIDE_DETAIL',
        isActive: true,
        startAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    })

    const res = await request(app).get('/ads?placement=GUIDE_DETAIL')
    expect(res.body.ad).toBeNull()
  })

  it("exclut un encart qui n'a pas encore commencé", async () => {
    await prisma.adBanner.deleteMany({ where: { placement: 'HOME', altText: { startsWith: MARK } } })
    await prisma.adBanner.create({
      data: {
        imageUrl: 'https://example.com/ad4.png',
        altText: `${MARK}pas_commence`,
        placement: 'HOME',
        isActive: true,
        startAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    const res = await request(app).get('/ads?placement=HOME')
    expect(res.body.ad).toBeNull()
  })

  it('inclut un encart dont la fenêtre de diffusion est en cours', async () => {
    await prisma.adBanner.deleteMany({ where: { placement: 'HOME', altText: { startsWith: MARK } } })
    await prisma.adBanner.create({
      data: {
        imageUrl: 'https://example.com/ad5.png',
        altText: `${MARK}en_cours`,
        placement: 'HOME',
        isActive: true,
        startAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    const res = await request(app).get('/ads?placement=HOME')
    expect(res.body.ad).not.toBeNull()
    expect(res.body.ad.altText).toBe(`${MARK}en_cours`)
  })
})
