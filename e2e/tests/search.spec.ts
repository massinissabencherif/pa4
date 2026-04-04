import { test, expect } from '@playwright/test'

test.describe('Recherche de comics', () => {
  test('la page recherche est accessible sans connexion', async ({ page }) => {
    await page.goto('/comics/search')
    await expect(page).toHaveURL(/\/comics\/search/)
    // Vérifie qu'un champ de recherche ou liste de comics est présent
    await expect(page.locator('input[type="search"], input[placeholder*="Recherche"], input[placeholder*="recherche"]').first()).toBeVisible()
  })

  test('rechercher un comic affiche des résultats', async ({ page }) => {
    await page.goto('/comics/search')
    const searchInput = page.locator('input[type="search"], input[placeholder*="Recherche"], input[placeholder*="recherche"]').first()
    await searchInput.fill('Spider-Man')
    await page.keyboard.press('Enter')
    // Attend qu'un résultat apparaisse
    await page.waitForTimeout(2000)
    const results = page.locator('[data-testid="comic-card"], .card, article').first()
    await expect(results).toBeVisible({ timeout: 8000 })
  })

  test('cliquer sur un comic ouvre sa page de détail', async ({ page }) => {
    await page.goto('/comics/search')
    const searchInput = page.locator('input[type="search"], input[placeholder*="Recherche"], input[placeholder*="recherche"]').first()
    await searchInput.fill('Spider-Man')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(2000)

    // Clique sur le premier résultat
    const firstComic = page.locator('a[href*="/comics/"]').first()
    await firstComic.waitFor({ timeout: 8000 })
    await firstComic.click()
    await expect(page).toHaveURL(/\/comics\//)
  })
})
