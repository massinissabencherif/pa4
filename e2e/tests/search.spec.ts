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

test.describe('Recherche de comics', () => {
  test('la page recherche est accessible sans connexion', async ({ page }) => {
    await page.goto('/comics/search')
    await page.waitForLoadState('domcontentloaded')
    await dismissCookieBanner(page)
    await expect(page).toHaveURL(/\/comics\/search/)
    await expect(page.getByPlaceholder('Titre, auteur…')).toBeVisible({ timeout: 10_000 })
  })

  test('rechercher un comic affiche des résultats', async ({ page }) => {
    await page.goto('/comics/search')
    await page.waitForLoadState('domcontentloaded')
    await dismissCookieBanner(page)
    const searchInput = page.getByPlaceholder('Titre, auteur…')
    await expect(searchInput).toBeVisible({ timeout: 10_000 })
    await searchInput.fill('Batman')
    await page.keyboard.press('Enter')
    const results = page.locator('a[href*="/comics/"]').first()
    await expect(results).toBeVisible({ timeout: 20_000 })
  })

  test('cliquer sur un comic ouvre sa page de détail', async ({ page }) => {
    await page.goto('/comics/search')
    await page.waitForLoadState('domcontentloaded')
    await dismissCookieBanner(page)
    const searchInput = page.getByPlaceholder('Titre, auteur…')
    await expect(searchInput).toBeVisible({ timeout: 10_000 })
    await searchInput.fill('Batman')
    await page.keyboard.press('Enter')
    const firstComic = page.locator('a[href*="/comics/"]').first()
    await firstComic.waitFor({ timeout: 20_000 })
    await firstComic.click()
    await expect(page).toHaveURL(/\/comics\//, { timeout: 15_000 })
  })
})
