import { test, expect } from '@playwright/test'
import { login } from '../helpers/auth.helper'
import { generateSponsorData, generateVendorData } from '../helpers/test-data'

test.describe('Sponsors & Vendors Management', () => {
  
  const TEST_EVENT_ID = process.env.TEST_EVENT_ID || '30'
  
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('SPNSR-01 to SPNSR-04: Create and verify sponsor', async ({ page }) => {
    const sponsorData = generateSponsorData()
    
    await page.goto(`/events/${TEST_EVENT_ID}/sponsors`)
    await page.waitForLoadState('networkidle')
    
    // Should see sponsors page
    await expect(page.getByText(/sponsors/i)).toBeVisible({ timeout: 15000 })
    
    // Click add sponsor button
    const addBtn = page.getByRole('button', { name: /add.*sponsor|new.*sponsor/i })
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click()
      await page.waitForTimeout(1000)
    }
    
    // Fill sponsor form
    const nameInput = page.locator('input[placeholder*="name"], input[name="name"]').first()
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(sponsorData.name)
    }
    
    // Tier/Level
    const tierSelect = page.locator('select[name="tier"], button:has-text("Select tier")')
    if (await tierSelect.isVisible().catch(() => false)) {
      await tierSelect.click()
      const tierOption = page.getByRole('option', { name: sponsorData.tier })
      if (await tierOption.isVisible().catch(() => false)) {
        await tierOption.click()
      }
    }
    
    // Contact email
    const emailInput = page.locator('input[type="email"], input[name="contactEmail"]').first()
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill(sponsorData.contactEmail)
    }
    
    // Submit
    const saveBtn = page.getByRole('button', { name: /save|add|create/i }).first()
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click()
      await page.waitForTimeout(2000)
    }
    
    // Verify sponsor appears
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    const sponsorName = page.getByText(sponsorData.name)
    await expect(sponsorName).toBeVisible({ timeout: 10000 })
  })

  test('VNDR-01 to VNDR-04: Create and verify vendor', async ({ page }) => {
    const vendorData = generateVendorData()
    
    await page.goto(`/events/${TEST_EVENT_ID}/vendors`)
    await page.waitForLoadState('networkidle')
    
    // Should see vendors page
    await expect(page.getByText(/vendors/i)).toBeVisible({ timeout: 15000 })
    
    // Click add vendor button
    const addBtn = page.getByRole('button', { name: /add.*vendor|new.*vendor/i })
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click()
      await page.waitForTimeout(1000)
    }
    
    // Fill vendor form
    const nameInput = page.locator('input[placeholder*="name"], input[name="name"]').first()
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(vendorData.name)
    }
    
    // Category
    const categorySelect = page.locator('select[name="category"], button:has-text("Select category")')
    if (await categorySelect.isVisible().catch(() => false)) {
      await categorySelect.click()
      const catOption = page.getByRole('option', { name: vendorData.category })
      if (await catOption.isVisible().catch(() => false)) {
        await catOption.click()
      }
    }
    
    // Contact email
    const emailInput = page.locator('input[type="email"], input[name="contactEmail"]').first()
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill(vendorData.contactEmail)
    }
    
    // Budget
    const budgetInput = page.locator('input[name="budget"], input[placeholder*="budget"]').first()
    if (await budgetInput.isVisible().catch(() => false)) {
      await budgetInput.fill(vendorData.budget)
    }
    
    // Submit
    const saveBtn = page.getByRole('button', { name: /save|add|create/i }).first()
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click()
      await page.waitForTimeout(2000)
    }
    
    // Verify vendor appears
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    const vendorName = page.getByText(vendorData.name)
    await expect(vendorName).toBeVisible({ timeout: 10000 })
  })
})
