import { test, expect } from '@playwright/test'

// Credentials are read from environment variables
// AUTH_EMAIL, AUTH_PASSWORD, BASE_URL (optional)
const EMAIL = process.env.AUTH_EMAIL || ''
const PASSWORD = process.env.AUTH_PASSWORD || ''

if (!EMAIL || !PASSWORD) {
  // eslint-disable-next-line no-console
  console.warn('[auth.spec] AUTH_EMAIL or AUTH_PASSWORD not set. Provide them via env when running tests.')
}

async function login(page: any) {
  await page.goto('/')
  // Click Sign In in the header
  const signInLink = page.getByRole('link', { name: /sign in/i })
  if (await signInLink.isVisible().catch(() => false)) {
    await signInLink.click()
  } else {
    // Fallback to direct route
    await page.goto('/auth/login')
  }

  // Fill credentials form (NextAuth Credentials)
  const emailInput = page.locator('input[name="email"], input#email, input[type="email"]')
  const passInput = page.locator('input[name="password"], input#password, input[type="password"]')

  await expect(emailInput).toBeVisible()
  await emailInput.fill(EMAIL)
  await expect(passInput).toBeVisible()
  await passInput.fill(PASSWORD)

  const submit = page.getByRole('button', { name: /sign in|log in|submit/i }).first()
  await submit.click()

  // Expect redirect back to home and that Sign In link disappears
  await expect(page).toHaveURL(/\/?$/)
  await expect(page.getByRole('link', { name: /sign in/i })).toHaveCount(0)
}

async function logout(page: any) {
  // Robust logout: go to login page which shows a sign-out CTA when already authenticated
  await page.goto('/auth/login')
  const switchBtn = page.getByRole('button', { name: /sign out and switch account/i })
  if (await switchBtn.isVisible().catch(() => false)) {
    await switchBtn.click()
    // After signOut, NextAuth redirects back to /auth/login
    await page.waitForURL(/\/auth\/login(\?.*)?$/, { timeout: 15000 }).catch(() => {})
  } else {
    // Fallback to NextAuth signout endpoint
    await page.goto('/api/auth/signout')
  }

  // After logout, go to home and verify header has Sign In link
  await page.goto('/')
  await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible({ timeout: 15000 })
}

test('login and logout 5 times', async ({ page }) => {
  test.slow()
  for (let i = 0; i < 5; i++) {
    await login(page)
    await logout(page)
  }
})
