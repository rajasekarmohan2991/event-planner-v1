import { test, expect } from '@playwright/test'
import { login } from '../helpers/auth.helper'
import { generateSessionData, generateSpeakerData } from '../helpers/test-data'

test.describe('Sessions & Speakers Management', () => {
  
  // Use existing event ID or create one before tests
  const TEST_EVENT_ID = process.env.TEST_EVENT_ID || '30'
  
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('SESS-01 to SESS-06: Create and verify session', async ({ page }) => {
    const sessionData = generateSessionData()
    
    // Navigate to sessions page
    await page.goto(`/events/${TEST_EVENT_ID}/sessions`)
    await page.waitForLoadState('networkidle')
    
    // Wait for page to load
    await expect(page.getByText(/sessions/i)).toBeVisible({ timeout: 10000 })
    
    // Fill session form
    const titleInput = page.locator('input[placeholder*="title"], input[name="title"]').first()
    if (await titleInput.isVisible().catch(() => false)) {
      await titleInput.fill(sessionData.title)
    }
    
    // Description
    const descInput = page.locator('textarea[placeholder*="description"], textarea[name="description"]').first()
    if (await descInput.isVisible().catch(() => false)) {
      await descInput.fill(sessionData.description)
    }
    
    // Start time
    const startInput = page.locator('input[type="datetime-local"][name*="start"], input[name="startTime"]').first()
    if (await startInput.isVisible().catch(() => false)) {
      await startInput.fill(sessionData.startTime)
    }
    
    // End time
    const endInput = page.locator('input[type="datetime-local"][name*="end"], input[name="endTime"]').first()
    if (await endInput.isVisible().catch(() => false)) {
      await endInput.fill(sessionData.endTime)
    }
    
    // Room
    const roomInput = page.locator('input[placeholder*="room"], input[name="room"]').first()
    if (await roomInput.isVisible().catch(() => false)) {
      await roomInput.fill(sessionData.room)
    }
    
    // Submit
    const addBtn = page.getByRole('button', { name: /add.*session|create.*session|save/i })
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click()
      await page.waitForTimeout(2000)
    }
    
    // Verify session appears in list
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Check if session title is visible
    const sessionTitle = page.getByText(sessionData.title)
    await expect(sessionTitle).toBeVisible({ timeout: 10000 })
  })

  test('SPKR-01 to SPKR-05: Create and verify speaker', async ({ page }) => {
    const speakerData = generateSpeakerData()
    
    // Navigate to speakers page
    await page.goto(`/events/${TEST_EVENT_ID}/speakers`)
    await page.waitForLoadState('networkidle')
    
    // Wait for page to load
    await expect(page.getByText(/speakers/i)).toBeVisible({ timeout: 10000 })
    
    // Click add speaker button
    const addBtn = page.getByRole('button', { name: /add.*speaker|new.*speaker/i })
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click()
      await page.waitForTimeout(1000)
    }
    
    // Fill speaker form
    const nameInput = page.locator('input[placeholder*="name"], input[name="name"]').first()
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(speakerData.name)
    }
    
    // Title
    const titleInput = page.locator('input[placeholder*="title"], input[name="title"]').first()
    if (await titleInput.isVisible().catch(() => false)) {
      await titleInput.fill(speakerData.title)
    }
    
    // Bio
    const bioInput = page.locator('textarea[placeholder*="bio"], textarea[name="bio"]').first()
    if (await bioInput.isVisible().catch(() => false)) {
      await bioInput.fill(speakerData.bio)
    }
    
    // Email
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill(speakerData.email)
    }
    
    // Submit
    const saveBtn = page.getByRole('button', { name: /save|add|create/i }).first()
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click()
      await page.waitForTimeout(2000)
    }
    
    // Verify speaker appears in list
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    const speakerName = page.getByText(speakerData.name)
    await expect(speakerName).toBeVisible({ timeout: 10000 })
  })
})
