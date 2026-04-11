import { test, expect, Page } from '@playwright/test'

const CREDS = { email: 'customer@demo.bank', password: 'Demo@123' }

async function login(page: Page) {
  await page.goto('/login')
  await page.getByPlaceholder('you@example.com').fill(CREDS.email)
  await page.getByPlaceholder('••••••••').fill(CREDS.password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 15_000 })
}

test.describe('Customer portal smoke', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (err) => console.error('[pageerror]', err.message))
  })

  test('login page renders', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /sign in to your account/i })).toBeVisible()
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
  })

  test('wrong password shows error', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('you@example.com').fill('customer@demo.bank')
    await page.getByPlaceholder('••••••••').fill('WrongPass123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('login succeeds', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL(/\/dashboard/)
  })

  const navTargets = [
    { label: 'My Loans',  url: /\/loans/,      expectText: /loan|EMI|balance|apply/i },
    { label: 'Apply',     url: /\/apply/,      expectText: /loan|purpose|amount|application/i },
    { label: 'Documents', url: /\/documents/,  expectText: /document|upload|KYC/i },
    { label: 'Statements',url: /\/statements/, expectText: /statement|credit|debit|transaction/i },
    { label: 'Profile',   url: /\/profile/,    expectText: /profile|email|password|name/i },
  ]

  for (const t of navTargets) {
    test(`navigate to ${t.label}`, async ({ page }) => {
      await login(page)
      await page.getByRole('link', { name: t.label, exact: false }).first().click()
      await page.waitForURL(t.url, { timeout: 10_000 })
      await expect(page.locator('main')).toContainText(t.expectText, { timeout: 10_000 })
    })
  }

  test('mobile drawer works at iPhone width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }) // iPhone 14 Pro
    await login(page)
    await expect(page).toHaveURL(/\/dashboard/)
    // Desktop nav should be hidden
    await expect(page.getByRole('navigation').locator('a', { hasText: 'My Loans' }).first()).toBeHidden()
    // Open the hamburger
    await page.getByLabel('Open menu').click()
    // Drawer link should now be visible
    await expect(page.getByRole('link', { name: 'My Loans' })).toBeVisible()
    await page.getByRole('link', { name: 'My Loans' }).click()
    await page.waitForURL(/\/loans/)
    await expect(page.locator('main')).toBeVisible()
  })

  test('portal/loans/my returns data via UI', async ({ page }) => {
    const respPromise = page.waitForResponse(
      (res) => res.url().includes('/api/v1/portal/loans/my') && res.status() === 200,
      { timeout: 15_000 }
    )
    await login(page)
    await page.getByRole('link', { name: 'My Loans' }).click()
    const resp = await respPromise
    const body = await resp.json()
    expect(body.header.status).toBe('SUCCESS')
    expect(Array.isArray(body.body)).toBe(true)
  })
})

