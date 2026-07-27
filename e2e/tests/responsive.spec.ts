import { test, expect, Page } from '@playwright/test'

async function dismissCookieBanner(page: Page) {
  try {
    const btn = page.getByRole('button', { name: 'Refuser' })
    await btn.waitFor({ state: 'visible', timeout: 3000 })
    await btn.click()
  } catch {
    // pas de bannière, on continue
  }
}

// Ces pages sont la porte d'entrée du site pour un visiteur non connecté.
// La home avait un hero figé en `1fr 420px` : sur un écran de 390px elle
// réclamait ~950px, le texte était rogné et le panneau Tendances sortait
// de l'écran. Aucun test ne couvrait la largeur, d'où ce fichier.
const PAGES = ['/', '/auth/login', '/auth/register']

test.describe('Pages publiques — pas de débordement horizontal', () => {
  for (const viewport of [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 13', width: 390, height: 844 },
  ]) {
    test(`${viewport.name} (${viewport.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })

      for (const path of PAGES) {
        await page.goto(path)
        await page.waitForLoadState('domcontentloaded')
        await dismissCookieBanner(page)

        // le document lui-même ne scrolle pas latéralement
        const doc = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }))
        expect(doc.scrollWidth, `${path} déborde horizontalement`).toBeLessThanOrEqual(doc.clientWidth)

        // et aucun élément visible ne sort du cadre (bouton coupé, texte rogné)
        const offscreen = await page.evaluate(() => {
          const limit = document.documentElement.clientWidth
          return [...document.querySelectorAll('body *')]
            .filter((el) => {
              const r = el.getBoundingClientRect()
              return r.width > 0 && r.height > 0 && r.right > limit + 1
            })
            .map((el) => `<${el.tagName.toLowerCase()} class="${el.className}">`)
            .slice(0, 5)
        })
        expect(offscreen, `${path} a des éléments hors cadre`).toEqual([])
      }
    })
  }
})

test.describe('Home — réorganisation mobile', () => {
  test('le panneau Tendances passe sous le hero en mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await dismissCookieBanner(page)

    const cols = await page.locator('.hero-grid').evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length,
    )
    expect(cols, 'le hero doit être sur une seule colonne').toBe(1)

    // les cartes fonctionnalités s'empilent au lieu de s'écraser sur 4 colonnes
    const featCols = await page.locator('.features-grid').evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length,
    )
    expect(featCols).toBe(1)
  })

  test('le hero reste sur deux colonnes en desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await dismissCookieBanner(page)

    const cols = await page.locator('.hero-grid').evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length,
    )
    expect(cols).toBe(2)

    const featCols = await page.locator('.features-grid').evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length,
    )
    expect(featCols).toBe(4)
  })
})
