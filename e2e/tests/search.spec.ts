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
    await expect(page.getByPlaceholder('Titre, auteur, éditeur…')).toBeVisible({ timeout: 10_000 })
  })

  test('rechercher un comic déclenche une réponse', async ({ page }) => {
    await page.goto('/comics/search')
    await page.waitForLoadState('domcontentloaded')
    await dismissCookieBanner(page)
    const searchInput = page.getByPlaceholder('Titre, auteur, éditeur…')
    await expect(searchInput).toBeVisible({ timeout: 10_000 })
    await searchInput.fill('Batman')
    await page.keyboard.press('Enter')
    // Résultats OU état vide — les deux prouvent que la recherche a fonctionné
    await expect(
      page.locator('a[href*="/comics/"]').first()
        .or(page.getByText('AUCUN RÉSULTAT'))
    ).toBeVisible({ timeout: 20_000 })
  })

  test('cliquer sur un comic ouvre sa page de détail', async ({ page }) => {
    await page.goto('/comics/search')
    await page.waitForLoadState('domcontentloaded')
    await dismissCookieBanner(page)
    const searchInput = page.getByPlaceholder('Titre, auteur, éditeur…')
    await expect(searchInput).toBeVisible({ timeout: 10_000 })
    await searchInput.fill('Batman')
    await page.keyboard.press('Enter')
    // Ce test ne s'exécute que si des résultats existent (Marvel API configurée ou comics en DB)
    const firstComic = page.locator('a[href*="/comics/"]').first()
    const hasResults = await firstComic.isVisible({ timeout: 20_000 }).catch(() => false)
    if (!hasResults) {
      test.skip()
      return
    }
    await firstComic.click()
    await expect(page).toHaveURL(/\/comics\//, { timeout: 15_000 })
  })
})
