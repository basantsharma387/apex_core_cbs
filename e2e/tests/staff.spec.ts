import { test, expect, Page } from '@playwright/test'

const CREDS = { tenant: 'DEMO', email: 'admin@demo.bank', password: 'Demo@123' }

async function login(page: Page) {
  await page.goto('/login')
  await page.getByPlaceholder('e.g. DEMO').fill(CREDS.tenant)
  await page.getByPlaceholder('you@institution.com').fill(CREDS.email)
  await page.getByPlaceholder('••••••••').fill(CREDS.password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 15_000 })
}

test.describe('Staff portal — auth', () => {
  test.beforeEach(({ page }) => {
    page.on('pageerror', (e) => console.error('[pageerror]', e.message))
  })

  test('login page renders', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByPlaceholder('e.g. DEMO')).toBeVisible()
    await expect(page.getByPlaceholder('you@institution.com')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
  })

  test('wrong password stays on /login', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('e.g. DEMO').fill('DEMO')
    await page.getByPlaceholder('you@institution.com').fill('admin@demo.bank')
    await page.getByPlaceholder('••••••••').fill('WrongPass123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForTimeout(1500)
    await expect(page).toHaveURL(/\/login/)
  })

  test('login succeeds with seed credentials', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL(/\/dashboard/)
  })
})

test.describe('Staff portal — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (e) => console.error('[pageerror]', e.message))
    await login(page)
  })

  test('dashboard loads with seeded metrics', async ({ page }) => {
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('main')).toContainText(/\d/, { timeout: 15_000 })
  })

  test('ews/metrics returns success envelope', async ({ page }) => {
    const respPromise = page.waitForResponse(
      (r) => r.url().includes('/api/v1/ews/metrics') && r.status() === 200,
      { timeout: 15_000 }
    )
    await page.goto('/dashboard')
    const resp = await respPromise
    const body = await resp.json()
    expect(body.header.status).toBe('SUCCESS')
    expect(body.body).toHaveProperty('totalActive')
  })

  const navTargets = [
    { label: 'EWS Alerts',  url: /\/ews/,     expectText: /early warning|alerts?|risk/i },
    { label: 'AML Monitor', url: /\/aml/,     expectText: /aml|transaction|alerts?|compliance/i },
    { label: 'Documents',   url: /\/dms/,     expectText: /documents?|upload|kyc/i },
    { label: 'Loan Apps',   url: /\/los/,     expectText: /loan|application|origination/i },
    { label: 'Collections', url: /\/cms/,     expectText: /collection|case|recovery/i },
    { label: 'IFRS 9',      url: /\/ifrs9/,   expectText: /ifrs|ecl|stage|provision/i },
    { label: 'Reports',     url: /\/reports/, expectText: /report|generate|download/i },
    { label: 'Settings',    url: /\/settings/,expectText: /profile|security|notifications/i },
  ]

  for (const t of navTargets) {
    test(`navigate to ${t.label}`, async ({ page }) => {
      await page.getByRole('link', { name: t.label }).click()
      await page.waitForURL(t.url, { timeout: 10_000 })
      await expect(page.locator('main')).toContainText(t.expectText, { timeout: 10_000 })
    })
  }
})
