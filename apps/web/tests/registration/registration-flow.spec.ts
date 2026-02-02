import { test, expect } from '@playwright/test'
import { login } from '../helpers/auth.helper'
import { generateRegistrationData } from '../helpers/test-data'

test.describe('Registration Flow', () => {
  
  const TEST_EVENT_ID = process.env.TEST_EVENT_ID || '30'
  
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('REG-01: Navigate to event registration page', async ({ page }) => {
    await page.goto(`/events/${TEST_EVENT_ID}/register`)
    await page.waitForLoadState('networkidle')
    
    // Should see registration form
    await expect(page.getByText(/register|registration/i)).toBeVisible({ timeout: 15000 })
  })

  test('REG-02 to REG-04: Complete registration flow', async ({ page }) => {
    const regData = generateRegistrationData()
    
    await page.goto(`/events/${TEST_EVENT_ID}/register`)
    await page.waitForLoadState('networkidle')
    
    // Fill first name
    const firstNameInput = page.locator('input[name="firstName"], input[placeholder*="first"]').first()
    if (await firstNameInput.isVisible().catch(() => false)) {
      await firstNameInput.fill(regData.firstName)
    }
    
    // Fill last name
    const lastNameInput = page.locator('input[name="lastName"], input[placeholder*="last"]').first()
    if (await lastNameInput.isVisible().catch(() => false)) {
      await lastNameInput.fill(regData.lastName)
    }
    
    // Fill email
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill(regData.email)
    }
    
    // Fill phone
    const phoneInput = page.locator('input[type="tel"], input[name="phone"]').first()
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill(regData.phone)
    }
    
    // Submit registration
    const submitBtn = page.getByRole('button', { name: /register|submit|confirm/i }).first()
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click()
      
      // Wait for response
      await page.waitForTimeout(5000)
    }
    
    // Verify success - either success message or redirect
    const successMsg = page.getByText(/success|confirmed|registered|thank you/i)
    const hasSuccess = await successMsg.isVisible().catch(() => false)
    
    // Or check for redirect to confirmation page
    const isConfirmPage = page.url().includes('confirm') || page.url().includes('success')
    
    expect(hasSuccess || isConfirmPage).toBe(true)
  })

  test('REG-06: View registrations list (Organizer)', async ({ page }) => {
    await page.goto(`/events/${TEST_EVENT_ID}/registrations`)
    await page.waitForLoadState('networkidle')
    
    // Should see registrations page
    await expect(page.getByText(/registrations/i)).toBeVisible({ timeout: 15000 })
  })
})
