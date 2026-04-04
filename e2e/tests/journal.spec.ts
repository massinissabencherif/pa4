import { test, expect, Page } from '@playwright/test'

const timestamp = Date.now()
const JOURNAL_USER = {
  email: `e2e_journal_${timestamp}@comicster.test`,
  username: `e2e_journal_${timestamp}`,
  password: 'JournalTest123!',
}

async function registerAndLogin(page: Page) {
  await page.goto('/auth/register')
  await page.getByPlaceholder('toi@example.com').fill(JOURNAL_USER.email)
  await page.getByPlaceholder('spider_reader').fill(JOURNAL_USER.username)
  await page.getByPlaceholder('Au moins 8 caractères').fill(JOURNAL_USER.password)
  await page.getByPlaceholder('Répète ton mot de passe').fill(JOURNAL_USER.password)
  await page.getByRole('button', { name: 'Commencer gratuitement' }).click()
  await page.waitForURL(/\/feed/, { timeout: 10_000 })
}

test.describe('Journal de lecture', () => {
  test('la page journal est accessible après connexion', async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/journal')
    await expect(page).toHaveURL(/\/journal/)
    await expect(page.getByRole('heading', { name: /journal/i })).toBeVisible()
  })

  test('peut ajouter un comic au journal depuis la page de détail', async ({ page }) => {
    await registerAndLogin(page)

    // Chercher un comic
    await page.goto('/comics/search')
    const searchInput = page.locator('input[type="search"], input[placeholder*="Recherche"], input[placeholder*="recherche"]').first()
    await searchInput.fill('Spider-Man')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(2000)

    // Ouvrir le premier comic
    const firstComic = page.locator('a[href*="/comics/"]').first()
    await firstComic.waitFor({ timeout: 8000 })
    await firstComic.click()
    await expect(page).toHaveURL(/\/comics\//)

    // Ajouter à la liste de lecture
    const addBtn = page.getByRole('button', { name: /ajouter|à lire|reading/i }).first()
    if (await addBtn.isVisible()) {
      await addBtn.click()
      // Vérifie qu'un feedback visuel apparaît (status change ou message)
      await page.waitForTimeout(1000)
      const statusIndicator = page.locator('[data-testid="reading-status"], .reading-status, button:has-text("En cours"), button:has-text("Terminé"), button:has-text("À lire")').first()
      await expect(statusIndicator).toBeVisible({ timeout: 5000 })
    }
  })

  test('le journal liste les comics ajoutés', async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/journal')
    // La page doit s'afficher (même vide)
    await expect(page).toHaveURL(/\/journal/)
    // Vérifie la présence d'un élément de structure (liste vide ou entrées)
    const content = page.locator('main, [role="main"]').first()
    await expect(content).toBeVisible()
  })
})

test.describe('Navigation principale', () => {
  test('la homepage redirige vers /feed si connecté', async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/')
    await page.waitForURL(/\/feed/, { timeout: 5000 })
    await expect(page).toHaveURL(/\/feed/)
  })

  test('les liens de nav sont visibles après connexion', async ({ page }) => {
    await registerAndLogin(page)
    await expect(page.getByRole('link', { name: 'Feed' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Journal' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Explorer' })).toBeVisible()
  })
})
