import { test, expect } from '@playwright/test'
import { login, logout, TEST_USER } from '../helpers/auth.helper'

test.describe('Authentication - Login', () => {
  
  test('AUTH-01: Login with valid credentials', async ({ page }) => {
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
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/(dashboard|events|admin)/, { timeout: 15000 })
  })

  test('AUTH-02: Login with invalid email', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    await emailInput.fill('invalid@nonexistent.com')
    
    const passInput = page.locator('input[type="password"], input[name="password"]').first()
    await passInput.fill('SomePassword123!')
    
    await page.getByRole('button', { name: /sign in|log in/i }).first().click()
    
    // Should show error message
    await expect(page.locator('text=/invalid|error|incorrect|failed/i')).toBeVisible({ timeout: 10000 })
  })

  test('AUTH-03: Login with invalid password', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    await emailInput.fill(TEST_USER.email)
    
    const passInput = page.locator('input[type="password"], input[name="password"]').first()
    await passInput.fill('WrongPassword123!')
    
    await page.getByRole('button', { name: /sign in|log in/i }).first().click()
    
    // Should show error message
    await expect(page.locator('text=/invalid|error|incorrect|failed/i')).toBeVisible({ timeout: 10000 })
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
    // First login
    await login(page)
    
    // Verify logged in
    await expect(page).toHaveURL(/\/(dashboard|events|admin)/, { timeout: 15000 })
    
    // Logout
    await logout(page)
    
    // Verify logged out - should see login page or sign in link
    await page.goto('/')
    const signInLink = page.getByRole('link', { name: /sign in/i })
    await expect(signInLink).toBeVisible({ timeout: 10000 })
  })

  test('AUTH-06: Session persistence after page refresh', async ({ page }) => {
    await login(page)
    
    // Refresh page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Should still be logged in (no sign in link visible)
    await page.goto('/')
    const signInLink = page.getByRole('link', { name: /sign in/i })
    const isSignInVisible = await signInLink.isVisible().catch(() => false)
    
    expect(isSignInVisible).toBe(false)
  })
})
