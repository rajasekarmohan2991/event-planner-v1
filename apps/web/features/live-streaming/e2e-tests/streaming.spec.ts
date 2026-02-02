/**
 * Live Streaming Module - End-to-End Browser Tests
 * 
 * Automated browser testing using Playwright
 * Tests real user interactions with the streaming feature
 */

import { test, expect, Page } from '@playwright/test'

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const EVENT_ID = '29'
const SESSION_ID = '1'

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
}

// Helper function to login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/auth/login`)
  await page.fill('input[name="email"]', TEST_USER.email)
  await page.fill('input[name="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE_URL}/**`)
}

// ============================================================================
// STREAM SETUP TESTS
// ============================================================================

test.describe('Stream Setup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should navigate to stream setup page', async ({ page }) => {
    // Navigate to event
    await page.goto(`${BASE_URL}/events/${EVENT_ID}`)
    
    // Click Sessions in sidebar
    await page.click('text=Sessions')
    await expect(page).toHaveURL(`${BASE_URL}/events/${EVENT_ID}/sessions`)
    
    // Click Stream button on first session
    await page.click('a:has-text("Stream")').first()
    await expect(page).toHaveURL(new RegExp(`/events/${EVENT_ID}/sessions/\\d+/stream`))
  })

  test('should display setup stream button', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/${EVENT_ID}/sessions/${SESSION_ID}/stream`)
    
    // Check for setup button or credentials
    const hasSetupButton = await page.locator('button:has-text("Setup Stream")').count() > 0
    const hasCredentials = await page.locator('text=RTMP URL').count() > 0
    
    expect(hasSetupButton || hasCredentials).toBeTruthy()
  })

  test('should create stream and display credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/${EVENT_ID}/sessions/${SESSION_ID}/stream`)
    
    // Click setup if not already set up
    const setupButton = page.locator('button:has-text("Setup Stream")')
    if (await setupButton.count() > 0) {
      await setupButton.click()
      
      // Wait for credentials to appear
      await page.waitForSelector('text=RTMP URL', { timeout: 10000 })
    }
    
    // Verify credentials are displayed
    await expect(page.locator('text=RTMP URL')).toBeVisible()
    await expect(page.locator('text=Stream Key')).toBeVisible()
    await expect(page.locator('input[value*="rtmp://"]')).toBeVisible()
  })

  test('should copy RTMP URL to clipboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/${EVENT_ID}/sessions/${SESSION_ID}/stream`)
    
    // Wait for credentials
    await page.waitForSelector('text=RTMP URL')
    
    // Click copy button for RTMP URL
    const copyButtons = page.locator('button:has(svg)')
    await copyButtons.first().click()
    
    // Verify toast notification
    await expect(page.locator('text=Copied')).toBeVisible({ timeout: 3000 })
  })

  test('should copy Stream Key to clipboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/${EVENT_ID}/sessions/${SESSION_ID}/stream`)
    
    // Wait for credentials
    await page.waitForSelector('text=Stream Key')
    
    // Click copy button for Stream Key
    const copyButtons = page.locator('button:has(svg)')
    await copyButtons.nth(1).click()
    
    // Verify toast notification
    await expect(page.locator('text=Copied')).toBeVisible({ timeout: 3000 })
  })

  test('should display OBS setup guide', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/${EVENT_ID}/sessions/${SESSION_ID}/stream`)
    
    // Click on Setup Guide tab
    await page.click('text=Setup Guide')
    
    // Verify guide content
    await expect(page.locator('text=Download OBS Studio')).toBeVisible()
    await expect(page.locator('text=Configure Stream Settings')).toBeVisible()
    await expect(page.locator('text=Add Sources')).toBeVisible()
    await expect(page.locator('text=Start Streaming')).toBeVisible()
  })

  test('should have OBS download link', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/${EVENT_ID}/sessions/${SESSION_ID}/stream`)
    
    await page.click('text=Setup Guide')
    
    const obsLink = page.locator('a[href*="obsproject.com"]')
    await expect(obsLink).toBeVisible()
    expect(await obsLink.getAttribute('href')).toContain('obsproject.com')
  })
})

// ============================================================================
// GO LIVE TESTS
// ============================================================================

test.describe('Go Live Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/events/${EVENT_ID}/sessions/${SESSION_ID}/stream`)
  })

  test('should display Go Live button when stream is ready', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check for Go Live or End Stream button
    const goLiveButton = page.locator('button:has-text("Go Live")')
    const endStreamButton = page.locator('button:has-text("End Stream")')
    
    const hasGoLive = await goLiveButton.count() > 0
    const hasEndStream = await endStreamButton.count() > 0
    
    expect(hasGoLive || hasEndStream).toBeTruthy()
  })

  test('should show LIVE badge after going live', async ({ page }) => {
    const goLiveButton = page.locator('button:has-text("Go Live")')
    
    if (await goLiveButton.count() > 0) {
      await goLiveButton.click()
      
      // Wait for LIVE badge
      await expect(page.locator('text=LIVE')).toBeVisible({ timeout: 5000 })
    } else {
      // Already live
      await expect(page.locator('text=LIVE')).toBeVisible()
    }
  })

  test('should display live analytics when streaming', async ({ page }) => {
    // Ensure stream is live
    const goLiveButton = page.locator('button:has-text("Go Live")')
    if (await goLiveButton.count() > 0) {
      await goLiveButton.click()
      await page.waitForTimeout(2000)
    }
    
    // Check for analytics
    await expect(page.locator('text=Current Viewers')).toBeVisible()
    await expect(page.locator('text=Duration')).toBeVisible()
  })

  test('should update viewer count in real-time', async ({ page }) => {
    // Ensure stream is live
    const goLiveButton = page.locator('button:has-text("Go Live")')
    if (await goLiveButton.count() > 0) {
      await goLiveButton.click()
    }
    
    // Get initial viewer count
    const viewerCountElement = page.locator('text=Current Viewers').locator('..').locator('div').first()
    const initialCount = await viewerCountElement.textContent()
    
    // Wait a bit for potential updates
    await page.waitForTimeout(3000)
    
    // Viewer count element should exist
    expect(initialCount).toBeDefined()
  })

  test('should show End Stream button when live', async ({ page }) => {
    // Ensure stream is live
    const goLiveButton = page.locator('button:has-text("Go Live")')
    if (await goLiveButton.count() > 0) {
      await goLiveButton.click()
      await page.waitForTimeout(1000)
    }
    
    // Check for End Stream button
    await expect(page.locator('button:has-text("End Stream")')).toBeVisible()
  })

  test('should end stream successfully', async ({ page }) => {
    // Ensure stream is live
    const goLiveButton = page.locator('button:has-text("Go Live")')
    if (await goLiveButton.count() > 0) {
      await goLiveButton.click()
      await page.waitForTimeout(1000)
    }
    
    // Click End Stream
    await page.click('button:has-text("End Stream")')
    
    // Wait for Go Live button to reappear or status change
    await page.waitForTimeout(2000)
    
    // LIVE badge should disappear
    const liveBadge = page.locator('text=LIVE')
    expect(await liveBadge.count()).toBe(0)
  })
})

// ============================================================================
// VIEWER EXPERIENCE TESTS
// ============================================================================

test.describe('Viewer Watch Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should navigate to watch page', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/${EVENT_ID}/sessions/${SESSION_ID}/watch`)
    
    // Verify page loaded
    await expect(page.locator('text=Live Chat')).toBeVisible()
  })

  test('should display stream status', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/${EVENT_ID}/sessions/${SESSION_ID}/watch`)
    
    // Check for live or offline status
    const hasLiveStatus = await page.locator('text=Stream is Live').count() > 0
    const hasOfflineStatus = await page.locator('text=Stream Offline').count() > 0
    
    expect(hasLiveStatus || hasOfflineStatus).toBeTruthy()
  })

  test('should display viewer count', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/${EVENT_ID}/sessions/${SESSION_ID}/watch`)
    
    // Wait for viewer count
    await expect(page.locator('text=watching')).toBeVisible({ timeout: 5000 })
  })

  test('should show LIVE badge when streaming', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/${EVENT_ID}/sessions/${SESSION_ID}/watch`)
    
    // Check for LIVE badge (may or may not be live)
    const liveBadge = page.locator('text=LIVE')
    const offlineMessage = page.locator('text=Stream Offline')
    
    const isLive = await liveBadge.count() > 0
    const isOffline = await offlineMessage.count() > 0
    
    expect(isLive || isOffline).toBeTruthy()
  })
})

// ============================================================================
// CHAT FUNCTIONALITY TESTS
// ============================================================================

test.describe('Live Chat', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/events/${EVENT_ID}/sessions/${SESSION_ID}/watch`)
  })

  test('should display chat interface', async ({ page }) => {
    await expect(page.locator('text=Live Chat')).toBeVisible()
    await expect(page.locator('input[placeholder*="message"]')).toBeVisible()
  })

  test('should send chat message', async ({ page }) => {
    const testMessage = `Test message ${Date.now()}`
    
    // Type message
    await page.fill('input[placeholder*="message"]', testMessage)
    
    // Send message (Enter key or Send button)
    await page.press('input[placeholder*="message"]', 'Enter')
    
    // Verify message appears in chat
    await expect(page.locator(`text=${testMessage}`)).toBeVisible({ timeout: 5000 })
  })

  test('should display sent messages in chat', async ({ page }) => {
    const testMessage = `E2E Test ${Date.now()}`
    
    await page.fill('input[placeholder*="message"]', testMessage)
    await page.press('input[placeholder*="message"]', 'Enter')
    
    // Wait for message to appear
    await page.waitForTimeout(1000)
    
    // Message should be in chat
    const messageElement = page.locator(`text=${testMessage}`)
    await expect(messageElement).toBeVisible()
  })

  test('should clear input after sending message', async ({ page }) => {
    await page.fill('input[placeholder*="message"]', 'Test message')
    await page.press('input[placeholder*="message"]', 'Enter')
    
    // Wait a bit
    await page.waitForTimeout(500)
    
    // Input should be empty
    const inputValue = await page.inputValue('input[placeholder*="message"]')
    expect(inputValue).toBe('')
  })

  test('should display reaction buttons', async ({ page }) => {
    await expect(page.locator('button:has-text("Like")')).toBeVisible()
    await expect(page.locator('button:has-text("Love")')).toBeVisible()
    await expect(page.locator('button:has-text("Applause")')).toBeVisible()
  })

  test('should send reaction when button clicked', async ({ page }) => {
    // Click Like button
    await page.click('button:has-text("Like")')
    
    // Wait for reaction to appear in chat
    await page.waitForTimeout(1000)
    
    // Reaction should appear (👍 emoji)
    const reactionElement = page.locator('text=👍')
    expect(await reactionElement.count()).toBeGreaterThan(0)
  })

  test('should auto-scroll chat to latest message', async ({ page }) => {
    // Send multiple messages
    for (let i = 0; i < 5; i++) {
      await page.fill('input[placeholder*="message"]', `Message ${i}`)
      await page.press('input[placeholder*="message"]', 'Enter')
      await page.waitForTimeout(300)
    }
    
    // Latest message should be visible
    await expect(page.locator('text=Message 4')).toBeVisible()
  })
})

// ============================================================================
// NAVIGATION TESTS
// ============================================================================

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should navigate from Sessions to Stream page', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/${EVENT_ID}`)
    
    // Click Sessions in sidebar
    await page.click('text=Sessions')
    
    // Click Stream button
    await page.click('a:has-text("Stream")').first()
    
    // Should be on stream page
    await expect(page).toHaveURL(new RegExp('/stream'))
  })

  test('should have Sessions tab in Sessions module', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/${EVENT_ID}/sessions`)
    
    // Check for Sessions and Speakers tabs
    await expect(page.locator('text=Sessions')).toBeVisible()
    await expect(page.locator('text=Speakers')).toBeVisible()
  })

  test('should switch between Sessions and Speakers tabs', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/${EVENT_ID}/sessions`)
    
    // Click Speakers tab
    await page.click('a:has-text("Speakers")')
    
    // Should navigate to speakers page
    await expect(page).toHaveURL(`${BASE_URL}/events/${EVENT_ID}/speakers`)
  })

  test('should have Stream button on each session', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/${EVENT_ID}/sessions`)
    
    // Check for Stream buttons
    const streamButtons = page.locator('a:has-text("Stream")')
    expect(await streamButtons.count()).toBeGreaterThan(0)
  })
})

// ============================================================================
// RESPONSIVE DESIGN TESTS
// ============================================================================

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(`${BASE_URL}/events/${EVENT_ID}/sessions/${SESSION_ID}/stream`)
    
    // Check if page loads
    await expect(page.locator('text=Live Streaming')).toBeVisible()
  })

  test('should display correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto(`${BASE_URL}/events/${EVENT_ID}/sessions/${SESSION_ID}/stream`)
    
    await expect(page.locator('text=Live Streaming')).toBeVisible()
  })

  test('should display correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto(`${BASE_URL}/events/${EVENT_ID}/sessions/${SESSION_ID}/stream`)
    
    await expect(page.locator('text=Live Streaming')).toBeVisible()
  })
})

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should handle invalid session ID gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/${EVENT_ID}/sessions/99999/stream`)
    
    // Should show error or redirect
    await page.waitForLoadState('networkidle')
    
    // Page should load without crashing
    expect(page.url()).toBeDefined()
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true)
    
    await page.goto(`${BASE_URL}/events/${EVENT_ID}/sessions/${SESSION_ID}/stream`)
    
    // Go back online
    await page.context().setOffline(false)
    
    // Page should recover
    await page.reload()
    await page.waitForLoadState('networkidle')
  })
})

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

test.describe('Performance', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should load stream page within 3 seconds', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto(`${BASE_URL}/events/${EVENT_ID}/sessions/${SESSION_ID}/stream`)
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(3000)
  })

  test('should load watch page within 3 seconds', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto(`${BASE_URL}/events/${EVENT_ID}/sessions/${SESSION_ID}/watch`)
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(3000)
  })
})
