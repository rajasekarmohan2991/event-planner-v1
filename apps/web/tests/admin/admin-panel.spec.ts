import { test, expect } from '@playwright/test'
import { login, ADMIN_USER } from '../helpers/auth.helper'

test.describe('Admin Panel', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login with admin credentials
    await login(page, ADMIN_USER.email, ADMIN_USER.password)
  })

  test('ADM-01: Access admin dashboard', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    
    // Should see admin dashboard or redirect to admin page
    const adminText = page.getByText(/admin|dashboard|overview/i)
    await expect(adminText).toBeVisible({ timeout: 15000 })
  })

  test('ADM-03: View all events', async ({ page }) => {
    await page.goto('/admin/events')
    await page.waitForLoadState('networkidle')
    
    // Should see events list
    await expect(page.getByText(/events/i)).toBeVisible({ timeout: 15000 })
  })

  test('ADM-04: View all users', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')
    
    // Should see users list
    await expect(page.getByText(/users/i)).toBeVisible({ timeout: 15000 })
  })

  test('ADM-05: Access settings page', async ({ page }) => {
    await page.goto('/admin/settings')
    await page.waitForLoadState('networkidle')
    
    // Should see settings page
    await expect(page.getByText(/settings/i)).toBeVisible({ timeout: 15000 })
  })
})
