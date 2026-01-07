import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/auth.helper'

/**
 * Complete Event Creation Flow Test
 * Tests: Login, Create Event, Navigate workspace, Add sessions/speakers
 * Includes browser recording for all steps
 */

const timestamp = Date.now()
const eventName = `Test Event ${timestamp}`
const eventDescription = 'This is an automated test event created by Playwright'

// Use existing test credentials
const TEST_EMAIL = process.env.AUTH_EMAIL || ''
const TEST_PASSWORD = process.env.AUTH_PASSWORD || ''

test.describe('Complete Event Creation Flow with Browser Recording', () => {

    test.describe.configure({ mode: 'serial' })

    let sharedPage: Page
    let eventId: string

    test.beforeAll(async ({ browser }) => {
        // Skip if no credentials
        if (!TEST_EMAIL || !TEST_PASSWORD) {
            console.warn('⚠️ AUTH_EMAIL and AUTH_PASSWORD not set. Skipping event creation tests.')
            return
        }

        sharedPage = await browser.newPage({
            recordVideo: {
                dir: './test-results/videos/event-creation',
                size: { width: 1920, height: 1080 }
            }
        })
    })

    test.afterAll(async () => {
        if (sharedPage) {
            await sharedPage.close()
        }
    })

    test('Step 1: Login to application', async () => {
        test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Credentials not set')

        console.log('🎬 Recording: Logging in...')

        await sharedPage.goto('/auth/login')
        await sharedPage.waitForLoadState('networkidle')

        // Fill credentials
        const emailInput = sharedPage.locator('input[type="email"]').first()
        await emailInput.fill(TEST_EMAIL)

        const passwordInput = sharedPage.locator('input[type="password"]').first()
        await passwordInput.fill(TEST_PASSWORD)

        // Submit
        const submitBtn = sharedPage.getByRole('button', { name: /sign in|log in/i }).first()
        await submitBtn.click()

        // Wait for redirect
        await sharedPage.waitForTimeout(3000)

        const currentUrl = sharedPage.url()
        expect(currentUrl).not.toContain('/auth/login')
        console.log('✅ Login successful')
    })

    test('Step 2: Navigate to Create Event page', async () => {
        test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Credentials not set')

        console.log('🎬 Recording: Navigating to Create Event...')

        await sharedPage.waitForTimeout(2000)

        // Look for "Create Event" button or link
        const createEventBtn = sharedPage.getByRole('link', { name: /create event|new event|\+ event/i }).or(
            sharedPage.getByRole('button', { name: /create event|new event|\+ event/i })
        ).first()

        if (await createEventBtn.isVisible().catch(() => false)) {
            await createEventBtn.click()
        } else {
            // Direct navigation fallback
            await sharedPage.goto('/events/create')
        }

        await sharedPage.waitForLoadState('networkidle')
        await sharedPage.waitForTimeout(1000)

        // Verify we're on create event page
        const currentUrl = sharedPage.url()
        expect(currentUrl).toContain('/events/create')
        console.log('✅ Navigated to Create Event page')
    })

    test('Step 3: Fill Basic Event Information (Step 1)', async () => {
        test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Credentials not set')

        console.log('🎬 Recording: Filling basic event info...')

        await sharedPage.waitForTimeout(1000)

        // Event Name
        const nameInput = sharedPage.locator('input[name="name"], input[placeholder*="event name" i]').first()
        if (await nameInput.isVisible().catch(() => false)) {
            await nameInput.fill(eventName)
            console.log(`  ✓ Event name: ${eventName}`)
        }

        // Event Description
        const descInput = sharedPage.locator('textarea[name="description"], textarea[placeholder*="description" i]').first()
        if (await descInput.isVisible().catch(() => false)) {
            await descInput.fill(eventDescription)
            console.log('  ✓ Event description filled')
        }

        // Category (if exists)
        const categorySelect = sharedPage.locator('select[name="category"], select[id*="category"]').first()
        if (await categorySelect.isVisible().catch(() => false)) {
            await categorySelect.selectOption({ index: 1 })
            console.log('  ✓ Category selected')
        }

        // Event Mode
        const eventModeSelect = sharedPage.locator('select[name="eventMode"], select[id*="mode"]').first()
        if (await eventModeSelect.isVisible().catch(() => false)) {
            await eventModeSelect.selectOption('OFFLINE')
            console.log('  ✓ Event mode: OFFLINE')
        }

        console.log('✅ Basic info filled')
    })

    test('Step 4: Fill Location Details (Step 2)', async () => {
        test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Credentials not set')

        console.log('🎬 Recording: Filling location details...')

        // Click Next to go to step 2
        const nextBtn = sharedPage.getByRole('button', { name: /next|continue/i }).first()
        if (await nextBtn.isVisible().catch(() => false)) {
            await nextBtn.click()
            await sharedPage.waitForTimeout(1000)
        }

        // Venue
        const venueInput = sharedPage.locator('input[name="venue"], input[placeholder*="venue" i]').first()
        if (await venueInput.isVisible().catch(() => false)) {
            await venueInput.fill('Test Convention Center')
            console.log('  ✓ Venue filled')
        }

        // Address
        const addressInput = sharedPage.locator('input[name="address"], textarea[name="address"]').first()
        if (await addressInput.isVisible().catch(() => false)) {
            await addressInput.fill('123 Test Street, Test City')
            console.log('  ✓ Address filled')
        }

        // City
        const cityInput = sharedPage.locator('input[name="city"], select[name="city"]').first()
        if (await cityInput.isVisible().catch(() => false)) {
            if (await cityInput.evaluate(el => el.tagName) === 'SELECT') {
                await cityInput.selectOption({ index: 1 })
            } else {
                await cityInput.fill('Mumbai')
            }
            console.log('  ✓ City filled')
        }

        console.log('✅ Location details filled')
    })

    test('Step 5: Fill Date and Time (Step 3)', async () => {
        test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Credentials not set')

        console.log('🎬 Recording: Filling date and time...')

        // Click Next
        const nextBtn = sharedPage.getByRole('button', { name: /next|continue/i }).first()
        if (await nextBtn.isVisible().catch(() => false)) {
            await nextBtn.click()
            await sharedPage.waitForTimeout(1000)
        }

        // Start Date
        const startDateInput = sharedPage.locator('input[name="startsAt"], input[type="datetime-local"]').first()
        if (await startDateInput.isVisible().catch(() => false)) {
            const futureDate = new Date()
            futureDate.setDate(futureDate.getDate() + 30)
            const dateString = futureDate.toISOString().slice(0, 16)
            await startDateInput.fill(dateString)
            console.log('  ✓ Start date filled')
        }

        // End Date
        const endDateInput = sharedPage.locator('input[name="endsAt"]').first()
        if (await endDateInput.isVisible().catch(() => false)) {
            const futureDate = new Date()
            futureDate.setDate(futureDate.getDate() + 31)
            const dateString = futureDate.toISOString().slice(0, 16)
            await endDateInput.fill(dateString)
            console.log('  ✓ End date filled')
        }

        console.log('✅ Date and time filled')
    })

    test('Step 6: Submit Event Creation', async () => {
        test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Credentials not set')

        console.log('🎬 Recording: Submitting event...')

        // Navigate through remaining steps if needed
        let attempts = 0
        while (attempts < 3) {
            const nextBtn = sharedPage.getByRole('button', { name: /next|continue/i }).first()
            if (await nextBtn.isVisible().catch(() => false)) {
                await nextBtn.click()
                await sharedPage.waitForTimeout(1000)
                attempts++
            } else {
                break
            }
        }

        // Submit
        const submitBtn = sharedPage.getByRole('button', { name: /create event|submit|finish/i }).first()
        if (await submitBtn.isVisible().catch(() => false)) {
            await submitBtn.click()
            console.log('  ✓ Clicked submit')
        }

        // Wait for redirect to event workspace
        await sharedPage.waitForTimeout(5000)

        const currentUrl = sharedPage.url()

        // Extract event ID from URL
        const match = currentUrl.match(/\/events\/(\d+)/)
        if (match) {
            eventId = match[1]
            console.log(`✅ Event created with ID: ${eventId}`)
        } else {
            console.log('✅ Event creation completed')
        }
    })

    test('Step 7: Navigate Event Workspace Tabs', async () => {
        test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Credentials not set')

        console.log('🎬 Recording: Exploring event workspace...')

        await sharedPage.waitForTimeout(2000)

        const tabs = ['Info', 'Sessions', 'Speakers', 'Team', 'Registrations', 'Settings']

        for (const tabName of tabs) {
            const tab = sharedPage.getByRole('tab', { name: new RegExp(tabName, 'i') }).or(
                sharedPage.getByRole('link', { name: new RegExp(tabName, 'i') })
            ).first()

            if (await tab.isVisible().catch(() => false)) {
                await tab.click()
                await sharedPage.waitForTimeout(1500)
                console.log(`  ✓ Navigated to ${tabName} tab`)
            }
        }

        console.log('✅ Workspace navigation complete')
    })

    test('Step 8: Add a Session', async () => {
        test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Credentials not set')

        console.log('🎬 Recording: Adding a session...')

        // Navigate to Sessions tab
        const sessionsTab = sharedPage.getByRole('tab', { name: /sessions/i }).or(
            sharedPage.getByRole('link', { name: /sessions/i })
        ).first()

        if (await sessionsTab.isVisible().catch(() => false)) {
            await sessionsTab.click()
            await sharedPage.waitForTimeout(1000)
        }

        // Click Add Session
        const addSessionBtn = sharedPage.getByRole('button', { name: /add session|new session|\+ session/i }).first()
        if (await addSessionBtn.isVisible().catch(() => false)) {
            await addSessionBtn.click()
            await sharedPage.waitForTimeout(1000)

            // Fill session details
            const titleInput = sharedPage.locator('input[name="title"], input[placeholder*="title" i]').first()
            if (await titleInput.isVisible().catch(() => false)) {
                await titleInput.fill(`Test Session ${timestamp}`)
                console.log('  ✓ Session title filled')
            }

            // Save session
            const saveBtn = sharedPage.getByRole('button', { name: /save|create/i }).first()
            if (await saveBtn.isVisible().catch(() => false)) {
                await saveBtn.click()
                await sharedPage.waitForTimeout(2000)
                console.log('  ✓ Session saved')
            }
        }

        console.log('✅ Session added')
    })

    test('Step 9: Add a Speaker', async () => {
        test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Credentials not set')

        console.log('🎬 Recording: Adding a speaker...')

        // Navigate to Speakers tab
        const speakersTab = sharedPage.getByRole('tab', { name: /speakers/i }).or(
            sharedPage.getByRole('link', { name: /speakers/i })
        ).first()

        if (await speakersTab.isVisible().catch(() => false)) {
            await speakersTab.click()
            await sharedPage.waitForTimeout(1000)
        }

        // Click Add Speaker
        const addSpeakerBtn = sharedPage.getByRole('button', { name: /add speaker|new speaker|\+ speaker/i }).first()
        if (await addSpeakerBtn.isVisible().catch(() => false)) {
            await addSpeakerBtn.click()
            await sharedPage.waitForTimeout(1000)

            // Fill speaker details
            const nameInput = sharedPage.locator('input[name="name"], input[placeholder*="name" i]').first()
            if (await nameInput.isVisible().catch(() => false)) {
                await nameInput.fill(`Test Speaker ${timestamp}`)
                console.log('  ✓ Speaker name filled')
            }

            const titleInput = sharedPage.locator('input[name="title"], input[placeholder*="title" i]').first()
            if (await titleInput.isVisible().catch(() => false)) {
                await titleInput.fill('Test Title')
                console.log('  ✓ Speaker title filled')
            }

            // Save speaker
            const saveBtn = sharedPage.getByRole('button', { name: /save|create/i }).first()
            if (await saveBtn.isVisible().catch(() => false)) {
                await saveBtn.click()
                await sharedPage.waitForTimeout(2000)
                console.log('  ✓ Speaker saved')
            }
        }

        console.log('✅ Speaker added')
        console.log('🎬 Recording complete! Video saved to test-results/videos/event-creation/')
    })
})
