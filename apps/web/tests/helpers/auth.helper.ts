import { Page, expect } from '@playwright/test'

// Test credentials from environment - MUST be set before running tests
export const TEST_USER = {
  email: process.env.AUTH_EMAIL || '',
  password: process.env.AUTH_PASSWORD || ''
}

export const ADMIN_USER = {
  email: process.env.ADMIN_EMAIL || process.env.AUTH_EMAIL || '',
  password: process.env.ADMIN_PASSWORD || process.env.AUTH_PASSWORD || ''
}

// Validate credentials before tests
export function validateCredentials() {
  if (!TEST_USER.email || !TEST_USER.password) {
    throw new Error('AUTH_EMAIL and AUTH_PASSWORD environment variables must be set')
  }
}

/**
 * Login with provided credentials
 */
export async function login(page: Page, email?: string, password?: string) {
  const userEmail = email || TEST_USER.email
  const userPassword = password || TEST_USER.password

  await page.goto('/auth/login')
  
  // Wait for page to load
  await page.waitForLoadState('networkidle')
  
  // Fill email
  const emailInput = page.locator('input[name="email"], input#email, input[type="email"]').first()
  await expect(emailInput).toBeVisible({ timeout: 10000 })
  await emailInput.fill(userEmail)
  
  // Fill password
  const passInput = page.locator('input[name="password"], input#password, input[type="password"]').first()
  await expect(passInput).toBeVisible()
  await passInput.fill(userPassword)
  
  // Click submit
  const submitBtn = page.getByRole('button', { name: /sign in|log in|submit/i }).first()
  await submitBtn.click()
  
  // Wait for redirect (dashboard or home)
  await page.waitForURL(/\/(dashboard|admin|super-admin|events)?/, { timeout: 15000 })
}

/**
 * Logout current user
 */
export async function logout(page: Page) {
  // Try profile dropdown logout first
  const profileBtn = page.locator('button').filter({ has: page.locator('img[alt*="avatar"], span[class*="Avatar"]') }).first()
  
  if (await profileBtn.isVisible().catch(() => false)) {
    await profileBtn.click()
    const signOutBtn = page.getByRole('menuitem', { name: /sign out|logout/i })
    if (await signOutBtn.isVisible().catch(() => false)) {
      await signOutBtn.click()
      await page.waitForURL(/\/auth\/login/, { timeout: 10000 })
      return
    }
  }
  
  // Fallback: direct signout
  await page.goto('/api/auth/signout')
  await page.waitForLoadState('networkidle')
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  
  // Check for sign in link (not logged in) vs profile avatar (logged in)
  const signInLink = page.getByRole('link', { name: /sign in/i })
  return !(await signInLink.isVisible().catch(() => false))
}

/**
 * Ensure user is logged in before test
 */
export async function ensureLoggedIn(page: Page, email?: string, password?: string) {
  if (!(await isLoggedIn(page))) {
    await login(page, email, password)
  }
}
