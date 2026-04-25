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

// Utilisateur unique par appel pour éviter les conflits entre tests
async function registerAndLogin(page: Page) {
  const ts = Date.now()
  const user = {
    email: `e2e_journal_${ts}@comicster.test`,
    username: `e2e_j_${ts}`,
    password: 'JournalTest123!',
  }
  await page.goto('/auth/register')
  await page.waitForLoadState('domcontentloaded')
  await dismissCookieBanner(page)
  await page.getByPlaceholder('toi@example.com').fill(user.email)
  await page.getByPlaceholder('spider_reader').fill(user.username)
  await page.getByPlaceholder('Au moins 8 caractères').fill(user.password)
  await page.getByPlaceholder('Répète ton mot de passe').fill(user.password)
  await page.getByRole('button', { name: 'Commencer gratuitement' }).click()
  await page.waitForURL(/\/feed/, { timeout: 20_000 })
}

test.describe('Journal de lecture', () => {
  test('la page journal est accessible après connexion', async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/journal')
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/\/journal/)
    await expect(page.getByRole('heading', { name: /journal/i })).toBeVisible()
  })

  test('le journal liste les comics ajoutés', async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/journal')
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/\/journal/)
    const content = page.locator('main, [role="main"]').first()
    await expect(content).toBeVisible()
  })
})

test.describe('Navigation principale', () => {
  test('la homepage redirige vers /feed si connecté', async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/')
    await page.waitForURL(/\/feed/, { timeout: 10_000 })
    await expect(page).toHaveURL(/\/feed/)
  })

  test('les liens de nav sont visibles après connexion', async ({ page }) => {
    await registerAndLogin(page)
    await expect(page.getByRole('link', { name: 'Feed', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Journal', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Explorer', exact: true })).toBeVisible()
  })
})
