import { test, expect } from '@playwright/test'
import { login, logout, TEST_USER, validateCredentials } from '../helpers/auth.helper'

test.describe('Authentication - Login', () => {
  
  test.beforeAll(() => {
    // Skip all tests if credentials not set
    if (!TEST_USER.email || !TEST_USER.password) {
      console.warn('⚠️ AUTH_EMAIL and AUTH_PASSWORD not set. Skipping auth tests.')
    }
  })

  test('AUTH-01: Login with valid credentials', async ({ page }) => {
    test.skip(!TEST_USER.email || !TEST_USER.password, 'Credentials not set')
    
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    
    // Fill email
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    await expect(emailInput).toBeVisible({ timeout: 10000 })
    await emailInput.fill(TEST_USER.email)
    
    // Fill password
    const passInput = page.locator('input[type="password"], input[name="password"]').first()
    await passInput.fill(TEST_USER.password)
    
    // Submit
    await page.getByRole('button', { name: /sign in|log in/i }).first().click()
    
    // Should redirect to dashboard or home (not stay on login)
    await page.waitForTimeout(3000)
    const currentUrl = page.url()
    expect(currentUrl).not.toContain('/auth/login')
  })

  test('AUTH-02: Login with invalid email', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    await emailInput.fill('invalid@nonexistent.com')
    
    const passInput = page.locator('input[type="password"], input[name="password"]').first()
    await passInput.fill('SomePassword123!')
    
    await page.getByRole('button', { name: /sign in|log in/i }).first().click()
    
    // Should show error message or stay on login page
    await page.waitForTimeout(3000)
    const hasError = await page.locator('text=/invalid|error|incorrect|failed/i').isVisible().catch(() => false)
    const stayedOnLogin = page.url().includes('/auth/login')
    expect(hasError || stayedOnLogin).toBe(true)
  })

  test('AUTH-03: Login with invalid password', async ({ page }) => {
    test.skip(!TEST_USER.email, 'Credentials not set')
    
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    await emailInput.fill(TEST_USER.email)
    
    const passInput = page.locator('input[type="password"], input[name="password"]').first()
    await passInput.fill('WrongPassword123!')
    
    await page.getByRole('button', { name: /sign in|log in/i }).first().click()
    
    // Should show error message or stay on login page
    await page.waitForTimeout(3000)
    const hasError = await page.locator('text=/invalid|error|incorrect|failed/i').isVisible().catch(() => false)
    const stayedOnLogin = page.url().includes('/auth/login')
    expect(hasError || stayedOnLogin).toBe(true)
  })

  test('AUTH-04: Login with empty fields shows validation', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    
    // Click submit without filling fields
    await page.getByRole('button', { name: /sign in|log in/i }).first().click()
    
    // Should show validation error or remain on login page
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('AUTH-05: Logout functionality', async ({ page }) => {
    test.skip(!TEST_USER.email || !TEST_USER.password, 'Credentials not set')
    
    // First login
    await login(page)
    
    // Wait for redirect
    await page.waitForTimeout(3000)
    
    // Logout
    await logout(page)
    
    // Verify logged out - should see login page or sign in link
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const signInLink = page.getByRole('link', { name: /sign in/i })
    const isVisible = await signInLink.isVisible().catch(() => false)
    expect(isVisible).toBe(true)
  })

  test('AUTH-06: Session persistence after page refresh', async ({ page }) => {
    test.skip(!TEST_USER.email || !TEST_USER.password, 'Credentials not set')
    
    await login(page)
    
    // Wait for login to complete
    await page.waitForTimeout(3000)
    
    // Refresh page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Should still be logged in (no sign in link visible)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const signInLink = page.getByRole('link', { name: /sign in/i })
    const isSignInVisible = await signInLink.isVisible().catch(() => false)
    
    // If sign in is visible, user is logged out (test fails)
    // If sign in is not visible, user is still logged in (test passes)
    expect(isSignInVisible).toBe(false)
  })
})
