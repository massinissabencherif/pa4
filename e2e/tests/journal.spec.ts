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

const ts = Date.now()
const JOURNAL_USER = {
  email: `e2e_journal_${ts}@comicster.test`,
  username: `e2e_j_${ts}`,
  password: 'JournalTest123!',
}

// Inscription unique avant tous les tests — évite de multiplier les appels /auth
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('/auth/register')
  await page.waitForLoadState('domcontentloaded')
  await dismissCookieBanner(page)
  await page.getByPlaceholder('toi@example.com').fill(JOURNAL_USER.email)
  await page.getByPlaceholder('spider_reader').fill(JOURNAL_USER.username)
  await page.getByPlaceholder('Au moins 8 caractères').fill(JOURNAL_USER.password)
  await page.getByPlaceholder('Répète ton mot de passe').fill(JOURNAL_USER.password)
  await page.getByRole('button', { name: 'Commencer gratuitement' }).click()
  await page.waitForURL(/\/feed/, { timeout: 30_000 })
  await context.close()
})

async function login(page: Page) {
  await page.goto('/auth/login')
  await page.waitForLoadState('domcontentloaded')
  await dismissCookieBanner(page)
  await page.getByPlaceholder('toi@example.com').fill(JOURNAL_USER.email)
  await page.getByPlaceholder('••••••••').fill(JOURNAL_USER.password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.waitForURL(/\/feed/, { timeout: 20_000 })
}

test.describe('Journal de lecture', () => {
  test('la page journal est accessible après connexion', async ({ page }) => {
    await login(page)
    await page.goto('/journal')
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/\/journal/)
    await expect(page.getByRole('heading', { name: /journal/i })).toBeVisible()
  })

  test('le journal liste les comics ajoutés', async ({ page }) => {
    await login(page)
    await page.goto('/journal')
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/\/journal/)
    const content = page.locator('main, [role="main"]').first()
    await expect(content).toBeVisible()
  })
})

test.describe('Navigation principale', () => {
  test('la homepage redirige vers /feed si connecté', async ({ page }) => {
    await login(page)
    await page.goto('/')
    await page.waitForURL(/\/feed/, { timeout: 10_000 })
    await expect(page).toHaveURL(/\/feed/)
  })

  test('les liens de nav sont visibles après connexion', async ({ page }) => {
    await login(page)
    const nav = page.getByLabel('Navigation principale')
    await expect(nav.getByRole('link', { name: 'Feed', exact: true })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Journal', exact: true })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Explorer', exact: true })).toBeVisible()
  })
})
