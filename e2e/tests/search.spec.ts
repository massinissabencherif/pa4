import { test, expect } from '@playwright/test'

test.describe('Recherche de comics', () => {
  test('la page recherche est accessible sans connexion', async ({ page }) => {
    await page.goto('/comics/search')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/comics\/search/)
    const searchInput = page.locator('input[type="search"], input[placeholder*="Recherche"], input[placeholder*="recherche"]').first()
    await expect(searchInput).toBeVisible()
  })

  test('rechercher un comic affiche des résultats', async ({ page }) => {
    await page.goto('/comics/search')
    await page.waitForLoadState('networkidle')
    const searchInput = page.locator('input[type="search"], input[placeholder*="Recherche"], input[placeholder*="recherche"]').first()
    await searchInput.fill('Spider-Man')
    await page.keyboard.press('Enter')
    const results = page.locator('a[href*="/comics/"]').first()
    await expect(results).toBeVisible({ timeout: 15_000 })
  })

  test('cliquer sur un comic ouvre sa page de détail', async ({ page }) => {
    await page.goto('/comics/search')
    await page.waitForLoadState('networkidle')
    const searchInput = page.locator('input[type="search"], input[placeholder*="Recherche"], input[placeholder*="recherche"]').first()
    await searchInput.fill('Spider-Man')
    await page.keyboard.press('Enter')
    const firstComic = page.locator('a[href*="/comics/"]').first()
    await firstComic.waitFor({ timeout: 15_000 })
    await firstComic.click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/comics\//)
  })
})
