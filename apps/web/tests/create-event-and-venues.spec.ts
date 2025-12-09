import { test, expect } from '@playwright/test'

const EMAIL = process.env.AUTH_EMAIL || 'superadmin@example.com'
const PASSWORD = process.env.AUTH_PASSWORD || 'Password123!'

async function login(page: any) {
  await page.goto('/auth/login')
  await page.locator('input[name="email"], input#email, input[type="email"]').fill(EMAIL)
  await page.locator('input[name="password"], input#password, input[type="password"]').fill(PASSWORD)
  await page.getByRole('button', { name: /sign in|log in|submit/i }).first().click()
  // Accept home, dashboard, or admin/super-admin paths as valid redirect targets
  await expect(page).toHaveURL(/(\/|\/dashboard|\/admin|\/super-admin.*)$/)
}

test('Create Event: Full flow', async ({ page }) => {
  test.slow()
  await login(page)
  
  // Open create event page
  await page.goto('/events/new')

  // Step 1: Basic Info
  await page.getByLabel(/Event Title/i).fill('Playwright Test Conference')
  await page.getByLabel(/Description/i).fill('A test event created by Playwright automation.')
  
  // Select event type
  await page.locator('button:has-text("Select event type")').click()
  await page.getByRole('option', { name: 'Conference' }).click()
  
  // Select category
  await page.locator('button:has-text("Select category")').click()
  await page.getByRole('option', { name: 'Technology' }).click()
  
  await page.getByLabel(/Expected Capacity/i).fill('100')
  
  // Click Next and wait for step transition
  await page.getByRole('button', { name: /Next/i }).click()
  
  // Step 2: Event Details
  // Verify we are on the next step by checking for a unique element
  await expect(page.getByText('Event Details from Step 1:')).toBeVisible()
  
  // Use placeholder as it's more reliable with the custom autocomplete wrapper
  await page.getByPlaceholder(/Type any city name/i).fill('Chennai')
  // Wait for debounced search if needed, or just proceed
  await page.waitForTimeout(1000) 
  // Select first suggestion if it appears
  const cityOption = page.locator('button:has-text("Chennai")').first()
  if (await cityOption.isVisible()) {
      await cityOption.click()
  }

  await page.getByPlaceholder(/Where is the event/i).fill('Convention Centre')
  await page.getByRole('button', { name: /Next/i }).click()

  // Step 3: Date & Time
  await expect(page.getByRole('heading', { name: 'Date & Time' })).toBeVisible()
  
  // Explicitly select a date (tomorrow to be safe)
  // Assuming shadcn Calendar / react-day-picker
  // Click the first available day that is NOT today (to ensure future) or just click a day.
  // We'll try clicking the day representing tomorrow.
  // Alternatively, just click the 15th or 20th to avoid edge cases.
  // Better: use the next available day.
  const days = page.locator('.rdp-day:not(.rdp-day_disabled):not(.rdp-day_outside)')
  if (await days.count() > 1) {
    await days.nth(1).click() // Click tomorrow
  } else {
    await days.first().click()
  }

  await page.getByRole('button', { name: /Next/i }).click()

  // Check for errors if it failed to advance
  const errorMessages = page.locator('.text-destructive')
  if (await errorMessages.count() > 0) {
    console.log('Step 3 Errors:', await errorMessages.allInnerTexts())
  }

  // Step 4: Media & Extras
  await expect(page.getByRole('heading', { name: 'Media & Extras' })).toBeVisible()
  // Skip optional fields
  await page.getByRole('button', { name: /Next/i }).click()

  // Step 5: Legal & Policy
  // Check for the step title from LegalStep content
  await expect(page.getByRole('heading', { name: 'Legal & Contact Information' })).toBeVisible()
  // Skip optional fields
  await page.getByRole('button', { name: /Next/i }).click()

  // Step 6: Review & Submit
  await expect(page.getByText('Review Your Event')).toBeVisible()
  await page.getByRole('button', { name: /Submit/i }).click()

  // Expect redirect to event page /events/[id]
  // Wait for URL to change to something containing /events/ but not /events/new
  await expect(page).toHaveURL(/\/events\/[a-zA-Z0-9-]+$/)
  await expect(page.getByText('Playwright Test Conference')).toBeVisible()

  // --- Test Delete (CRUD) ---
  // Navigate to Settings
  const eventUrl = page.url()
  await page.goto(`${eventUrl}/settings`)
  
  // Click Delete (Danger Zone)
  // Handle native confirmation dialog (window.confirm)
  page.once('dialog', dialog => {
    console.log('Dialog message:', dialog.message())
    dialog.accept()
  })
  
  await page.getByRole('button', { name: 'Delete Event' }).click()

  // Verify redirect to dashboard
  await expect(page).toHaveURL(/\/dashboard\/organizer/)
  
  // Verify event is removed
  await expect(page.getByText('Event deleted')).toBeVisible()
})

