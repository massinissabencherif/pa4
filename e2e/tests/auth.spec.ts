import { test, expect } from '@playwright/test'

const timestamp = Date.now()
const TEST_USER = {
  email: `e2e_${timestamp}@comicster.test`,
  username: `e2e_user_${timestamp}`,
  password: 'E2eTest123!',
}

test.describe('Inscription', () => {
  test('affiche le formulaire d\'inscription', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page.getByRole('heading', { name: 'Créer un compte' })).toBeVisible()
    await expect(page.getByPlaceholder('toi@example.com')).toBeVisible()
    await expect(page.getByPlaceholder('spider_reader')).toBeVisible()
    await expect(page.getByPlaceholder('Au moins 8 caractères')).toBeVisible()
    await expect(page.getByPlaceholder('Répète ton mot de passe')).toBeVisible()
  })

  test('bloque si les mots de passe ne correspondent pas', async ({ page }) => {
    await page.goto('/auth/register')
    await page.getByPlaceholder('toi@example.com').fill(TEST_USER.email)
    await page.getByPlaceholder('spider_reader').fill(TEST_USER.username)
    await page.getByPlaceholder('Au moins 8 caractères').fill(TEST_USER.password)
    await page.getByPlaceholder('Répète ton mot de passe').fill('DifferentPass999!')
    await page.getByRole('button', { name: 'Commencer gratuitement' }).click()
    await expect(page.getByText('Les mots de passe ne correspondent pas')).toBeVisible()
    // Doit rester sur la page register
    await expect(page).toHaveURL(/\/auth\/register/)
  })

  test('crée un compte et redirige vers /feed', async ({ page }) => {
    await page.goto('/auth/register')
    await page.getByPlaceholder('toi@example.com').fill(TEST_USER.email)
    await page.getByPlaceholder('spider_reader').fill(TEST_USER.username)
    await page.getByPlaceholder('Au moins 8 caractères').fill(TEST_USER.password)
    await page.getByPlaceholder('Répète ton mot de passe').fill(TEST_USER.password)
    await page.getByRole('button', { name: 'Commencer gratuitement' }).click()
    await page.waitForURL(/\/feed/, { timeout: 10_000 })
    await expect(page).toHaveURL(/\/feed/)
  })
})

test.describe('Connexion', () => {
  test('affiche le formulaire de connexion', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByRole('heading', { name: /univers comics/i })).toBeVisible()
    await expect(page.getByPlaceholder('toi@example.com')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
  })

  test('affiche une erreur avec de mauvais identifiants', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByPlaceholder('toi@example.com').fill('inexistant@test.com')
    await page.getByPlaceholder('••••••••').fill('MauvaisMotDePasse123!')
    await page.getByRole('button', { name: 'Se connecter' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('connecte et redirige vers /feed', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByPlaceholder('toi@example.com').fill(TEST_USER.email)
    await page.getByPlaceholder('••••••••').fill(TEST_USER.password)
    await page.getByRole('button', { name: 'Se connecter' }).click()
    await page.waitForURL(/\/feed/, { timeout: 10_000 })
    await expect(page).toHaveURL(/\/feed/)
  })

  test('déconnexion redirige vers /', async ({ page }) => {
    // Login d'abord
    await page.goto('/auth/login')
    await page.getByPlaceholder('toi@example.com').fill(TEST_USER.email)
    await page.getByPlaceholder('••••••••').fill(TEST_USER.password)
    await page.getByRole('button', { name: 'Se connecter' }).click()
    await page.waitForURL(/\/feed/)

    // Déconnexion
    await page.getByRole('button', { name: 'Déconnexion' }).click()
    await expect(page).toHaveURL(/\/$|\/auth\/login/)
  })
})
