import { test, expect, Page, Response } from '@playwright/test'

const CREDS = { tenant: 'DEMO', email: 'admin@demo.bank', password: 'Demo@123' }

async function login(page: Page) {
  await page.goto('/login')
  await page.getByPlaceholder('e.g. DEMO').fill(CREDS.tenant)
  await page.getByPlaceholder('you@institution.com').fill(CREDS.email)
  await page.getByPlaceholder('••••••••').fill(CREDS.password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 20_000 })
}

async function expectApiEnvelope(resp: Response) {
  expect(resp.status()).toBe(200)
  const body = await resp.json()
  expect(body).toHaveProperty('header')
  expect(body.header.status).toBe('SUCCESS')
  expect(body).toHaveProperty('body')
  return body
}

test.describe('Staff · No page errors across all modules', () => {
  test('every module loads without runtime errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))

    await login(page)

    const paths = ['/dashboard', '/ews', '/aml', '/dms', '/los', '/cms', '/ifrs9', '/alm', '/reports', '/settings']
    for (const p of paths) {
      await page.goto(p)
      await expect(page.locator('main')).toBeVisible()
      // Wait a moment for React Query to settle
      await page.waitForTimeout(400)
    }

    expect(errors, `Page errors: ${errors.join(' | ')}`).toEqual([])
  })
})

test.describe('Staff · DMS — upload flow', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('DMS page loads with metrics and approval queue', async ({ page }) => {
    const docsResp = page.waitForResponse(r => r.url().includes('/api/v1/dms/documents') && r.status() === 200)
    await page.goto('/dms')
    await expectApiEnvelope(await docsResp)

    await expect(page.getByText(/Upload document/i)).toBeVisible()
    await expect(page.getByText(/Approval queue/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Submit document/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Save as draft/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Verify.*approval/i })).toBeVisible()
  })

  test('Submit without a file shows error banner', async ({ page }) => {
    await page.goto('/dms')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /Submit document/i }).click()
    // Client-side throws "Please choose a file" and writes banner
    await expect(page.getByText(/choose a file|upload failed/i)).toBeVisible({ timeout: 5_000 })
  })
})

test.describe('Staff · LOS — wizard navigation', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('wizard advances through steps and reaches credit-score action', async ({ page }) => {
    await page.goto('/los')
    await expect(page.getByText(/Customer Details/i)).toBeVisible()

    // Step 0 → Step 1 using the local Next button (no POST yet)
    await page.getByRole('button', { name: /Next.*Financial Info/i }).click()
    await expect(page.getByText(/Financial Info/i).first()).toBeVisible()

    // Step 1 → Step 2 (Documents)
    await page.getByRole('button', { name: /Next.*Documents/i }).click()
    await expect(page.getByText(/Upload KYC documents/i)).toBeVisible()

    // Step 2 shows "Run credit score" button instead of Next
    await expect(page.getByRole('button', { name: /Run credit score/i })).toBeVisible()
  })
})

test.describe('Staff · CMS — NBA filter + case drawer', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('cases API returns SUCCESS envelope', async ({ page }) => {
    const casesResp = page.waitForResponse(r => r.url().includes('/api/v1/collection/cases') && r.status() === 200)
    await page.goto('/cms')
    const body = await expectApiEnvelope(await casesResp)
    expect(body.body).toHaveProperty('items')
    expect(Array.isArray(body.body.items)).toBe(true)
  })

  test('NBA filter card is clickable and toggles', async ({ page }) => {
    await page.goto('/cms')
    await page.waitForLoadState('networkidle')
    // NBA panel label buttons
    const fieldVisit = page.getByRole('button', { name: /Field visit/i })
    await expect(fieldVisit).toBeVisible()
    await fieldVisit.click()
    // After click, a Clear control appears
    await expect(page.getByRole('button', { name: /^Clear$/ })).toBeVisible()
    await page.getByRole('button', { name: /^Clear$/ }).click()
    await expect(page.getByRole('button', { name: /^Clear$/ })).toBeHidden()
  })
})

test.describe('Staff · IFRS9 — wired to real service', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('summary + staging APIs return SUCCESS and no mocks leak through', async ({ page }) => {
    const summaryResp = page.waitForResponse(r => r.url().includes('/api/v1/ifrs9/summary') && r.status() === 200)
    const stagingResp = page.waitForResponse(r => r.url().includes('/api/v1/ifrs9/staging') && r.status() === 200)
    await page.goto('/ifrs9')
    await expectApiEnvelope(await summaryResp)
    await expectApiEnvelope(await stagingResp)

    // Page must not still show the old hardcoded mock customer names
    const html = await page.content()
    expect(html).not.toContain('Tshering Dorji')
    expect(html).not.toContain('Karma Wangchuk')
    expect(html).not.toContain('Pema Choden')
  })

  test('Run ECL Batch + Export CSV buttons are present and wired', async ({ page }) => {
    await page.goto('/ifrs9')
    await expect(page.getByRole('button', { name: /Run ECL Batch/i })).toBeEnabled()
    await expect(page.getByRole('button', { name: /Export CSV/i })).toBeVisible()
  })
})

test.describe('Staff · Settings — tenant', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('tenant tab loads org details from /auth/tenant', async ({ page }) => {
    const tenantResp = page.waitForResponse(r => r.url().includes('/api/v1/auth/tenant') && r.status() === 200)
    await page.goto('/settings')
    await page.getByRole('button', { name: /Organisation/i }).click()
    const body = await expectApiEnvelope(await tenantResp)
    expect(body.body).toHaveProperty('name')
    expect(body.body).toHaveProperty('code')
  })

  test('admin sees Edit organisation button', async ({ page }) => {
    await page.goto('/settings')
    await page.getByRole('button', { name: /Organisation/i }).click()
    // Seed user is an admin, so edit CTA must appear
    await expect(page.getByRole('button', { name: /Edit organisation/i })).toBeVisible()
  })
})

test.describe('Staff · ALM — new module end-to-end', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('sidebar link navigates to /alm', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('link', { name: /ALM.*FTP/i }).click()
    await page.waitForURL(/\/alm/, { timeout: 10_000 })
    await expect(page.locator('main')).toContainText(/Asset-Liability|ALM|Treasury/i)
  })

  test('all 4 ALM endpoints return SUCCESS envelope', async ({ page }) => {
    const summaryP  = page.waitForResponse(r => r.url().includes('/api/v1/alm/summary')       && r.status() === 200)
    const gapP      = page.waitForResponse(r => r.url().includes('/api/v1/alm/liquidity-gap') && r.status() === 200)
    const irrbbP    = page.waitForResponse(r => r.url().includes('/api/v1/alm/irrbb')         && r.status() === 200)
    const ftpP      = page.waitForResponse(r => r.url().includes('/api/v1/alm/ftp-curve')     && r.status() === 200)

    await page.goto('/alm')

    const summary = await expectApiEnvelope(await summaryP)
    const gap     = await expectApiEnvelope(await gapP)
    const irrbb   = await expectApiEnvelope(await irrbbP)
    const ftp     = await expectApiEnvelope(await ftpP)

    expect(summary.body).toHaveProperty('lcr')
    expect(summary.body).toHaveProperty('nsfr')
    expect(Array.isArray(gap.body.items)).toBe(true)
    expect(Array.isArray(irrbb.body.scenarios)).toBe(true)
    expect(Array.isArray(ftp.body.items)).toBe(true)
  })

  test('LCR and NSFR stats render as percentages', async ({ page }) => {
    await page.goto('/alm')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('LCR', { exact: true })).toBeVisible()
    await expect(page.getByText('NSFR', { exact: true })).toBeVisible()
    // Both should render a % number (not a placeholder dash)
    await expect(page.locator('main')).toContainText(/\d+%/)
  })

  test('IRRBB shock simulator triggers /alm/simulate', async ({ page }) => {
    await page.goto('/alm')
    await page.waitForLoadState('networkidle')

    const simP = page.waitForResponse(
      r => r.url().includes('/api/v1/alm/simulate') && r.request().method() === 'POST',
      { timeout: 10_000 }
    )
    await page.getByRole('button', { name: /Run simulation/i }).click()
    const resp = await simP
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body.header.status).toBe('SUCCESS')
    expect(body.body).toHaveProperty('deltaNII')
    expect(body.body).toHaveProperty('deltaEVE')
    expect(body.body).toHaveProperty('pctOfCapital')

    // Banner with simulation result should appear
    await expect(page.getByText(/Custom shock.*NII.*EVE/i)).toBeVisible({ timeout: 5_000 })
  })
})
