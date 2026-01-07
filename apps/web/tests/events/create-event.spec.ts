import { test, expect } from '@playwright/test'
import { login } from '../helpers/auth.helper'
import { generateEventData } from '../helpers/test-data'

test.describe('Event Management - Create Event', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('EVT-01: Navigate to create event page', async ({ page }) => {
    await page.goto('/events/new')
    await page.waitForLoadState('networkidle')
    
    // Should see event creation form
    await expect(page.getByText(/create.*event|new.*event|event.*title/i)).toBeVisible({ timeout: 10000 })
  })

  test('EVT-02 to EVT-07: Complete event creation flow', async ({ page }) => {
    test.slow() // This test takes longer
    
    const eventData = generateEventData()
    
    await page.goto('/events/new')
    await page.waitForLoadState('networkidle')
    
    // Step 1: Basic Info
    const titleInput = page.getByLabel(/event title/i)
    if (await titleInput.isVisible()) {
      await titleInput.fill(eventData.title)
    } else {
      // Fallback selector
      await page.locator('input[name="title"], input[placeholder*="title"]').first().fill(eventData.title)
    }
    
    const descInput = page.getByLabel(/description/i)
    if (await descInput.isVisible()) {
      await descInput.fill(eventData.description)
    }
    
    // Select event type if dropdown exists
    const typeSelect = page.locator('button:has-text("Select event type")')
    if (await typeSelect.isVisible().catch(() => false)) {
      await typeSelect.click()
      await page.getByRole('option', { name: eventData.type }).click()
    }
    
    // Select category if dropdown exists
    const categorySelect = page.locator('button:has-text("Select category")')
    if (await categorySelect.isVisible().catch(() => false)) {
      await categorySelect.click()
      await page.getByRole('option', { name: eventData.category }).click()
    }
    
    // Capacity
    const capacityInput = page.getByLabel(/capacity/i)
    if (await capacityInput.isVisible().catch(() => false)) {
      await capacityInput.fill(eventData.capacity)
    }
    
    // Click Next
    await page.getByRole('button', { name: /next/i }).click()
    await page.waitForTimeout(1000)
    
    // Step 2: Event Details (Location)
    const cityInput = page.getByPlaceholder(/city/i)
    if (await cityInput.isVisible().catch(() => false)) {
      await cityInput.fill(eventData.city)
      await page.waitForTimeout(1000)
      // Select from dropdown if appears
      const cityOption = page.locator(`button:has-text("${eventData.city}")`).first()
      if (await cityOption.isVisible().catch(() => false)) {
        await cityOption.click()
      }
    }
    
    const venueInput = page.getByPlaceholder(/venue|where/i)
    if (await venueInput.isVisible().catch(() => false)) {
      await venueInput.fill(eventData.venue)
    }
    
    await page.getByRole('button', { name: /next/i }).click()
    await page.waitForTimeout(1000)
    
    // Step 3: Date & Time
    const dateHeading = page.getByRole('heading', { name: /date.*time/i })
    if (await dateHeading.isVisible().catch(() => false)) {
      // Select a date from calendar
      const days = page.locator('.rdp-day:not(.rdp-day_disabled):not(.rdp-day_outside)')
      if (await days.count() > 1) {
        await days.nth(1).click()
      } else if (await days.count() > 0) {
        await days.first().click()
      }
    }
    
    await page.getByRole('button', { name: /next/i }).click()
    await page.waitForTimeout(1000)
    
    // Step 4: Media & Extras (skip optional)
    const mediaHeading = page.getByRole('heading', { name: /media|extras/i })
    if (await mediaHeading.isVisible().catch(() => false)) {
      await page.getByRole('button', { name: /next/i }).click()
      await page.waitForTimeout(1000)
    }
    
    // Step 5: Legal & Policy (skip optional)
    const legalHeading = page.getByRole('heading', { name: /legal|policy|contact/i })
    if (await legalHeading.isVisible().catch(() => false)) {
      await page.getByRole('button', { name: /next/i }).click()
      await page.waitForTimeout(1000)
    }
    
    // Step 6: Review & Submit
    const reviewText = page.getByText(/review.*event/i)
    if (await reviewText.isVisible().catch(() => false)) {
      await page.getByRole('button', { name: /submit|create/i }).click()
    }
    
    // Verify event created - should redirect to event page
    await expect(page).toHaveURL(/\/events\/[a-zA-Z0-9-]+/, { timeout: 20000 })
    
    // Verify event title visible
    await expect(page.getByText(eventData.title)).toBeVisible({ timeout: 10000 })
  })
})
