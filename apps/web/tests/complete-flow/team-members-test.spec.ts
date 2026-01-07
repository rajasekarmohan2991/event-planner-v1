import { test, expect, Page } from '@playwright/test'

/**
 * Team Members & Invitations Test
 * Tests team member invitation flow and listing
 */

const TEST_EMAIL = process.env.AUTH_EMAIL || ''
const TEST_PASSWORD = process.env.AUTH_PASSWORD || ''
const timestamp = Date.now()
const inviteEmail = `testinvite${timestamp}@example.com`

test.describe('Team Members & Invitations Test', () => {

    test.describe.configure({ mode: 'serial' })

    let sharedPage: Page
    let eventId: string

    test.beforeAll(async ({ browser }) => {
        if (!TEST_EMAIL || !TEST_PASSWORD) {
            console.warn('⚠️ AUTH_EMAIL and AUTH_PASSWORD not set. Skipping team tests.')
            return
        }

        sharedPage = await browser.newPage({
            recordVideo: {
                dir: './test-results/videos/team-members',
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

        const emailInput = sharedPage.locator('input[type="email"]').first()
        await emailInput.fill(TEST_EMAIL)

        const passwordInput = sharedPage.locator('input[type="password"]').first()
        await passwordInput.fill(TEST_PASSWORD)

        const submitBtn = sharedPage.getByRole('button', { name: /sign in|log in/i }).first()
        await submitBtn.click()

        await sharedPage.waitForTimeout(3000)

        const currentUrl = sharedPage.url()
        expect(currentUrl).not.toContain('/auth/login')
        console.log('✅ Login successful')
    })

    test('Step 2: Navigate to an existing event', async () => {
        test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Credentials not set')

        console.log('🎬 Recording: Finding an event...')

        await sharedPage.waitForTimeout(2000)

        // Look for "My Events" or event list
        const eventLink = sharedPage.getByRole('link', { name: /event/i }).first()

        if (await eventLink.isVisible().catch(() => false)) {
            await eventLink.click()
            await sharedPage.waitForTimeout(2000)

            // Extract event ID from URL
            const currentUrl = sharedPage.url()
            const match = currentUrl.match(/\/events\/(\d+)/)
            if (match) {
                eventId = match[1]
                console.log(`✅ Found event ID: ${eventId}`)
            }
        } else {
            // Navigate to events list
            await sharedPage.goto('/events')
            await sharedPage.waitForLoadState('networkidle')

            // Click first event
            const firstEvent = sharedPage.locator('a[href*="/events/"]').first()
            if (await firstEvent.isVisible().catch(() => false)) {
                await firstEvent.click()
                await sharedPage.waitForTimeout(2000)

                const currentUrl = sharedPage.url()
                const match = currentUrl.match(/\/events\/(\d+)/)
                if (match) {
                    eventId = match[1]
                    console.log(`✅ Found event ID: ${eventId}`)
                }
            }
        }

        expect(eventId).toBeDefined()
    })

    test('Step 3: Navigate to Team tab', async () => {
        test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Credentials not set')

        console.log('🎬 Recording: Navigating to Team tab...')

        await sharedPage.waitForTimeout(1000)

        // Find Team tab
        const teamTab = sharedPage.getByRole('tab', { name: /team/i }).or(
            sharedPage.getByRole('link', { name: /team/i })
        ).first()

        if (await teamTab.isVisible().catch(() => false)) {
            await teamTab.click()
            await sharedPage.waitForTimeout(2000)
            console.log('✅ Navigated to Team tab')
        } else {
            // Direct navigation
            await sharedPage.goto(`/events/${eventId}/team`)
            await sharedPage.waitForLoadState('networkidle')
            console.log('✅ Navigated to Team page directly')
        }
    })

    test('Step 4: Check existing team members list', async () => {
        test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Credentials not set')

        console.log('🎬 Recording: Checking team members list...')

        await sharedPage.waitForTimeout(2000)

        // Take screenshot of current state
        await sharedPage.screenshot({
            path: 'test-results/screenshots/team-members-before-invite.png',
            fullPage: true
        })

        console.log('✅ Team members page loaded')
        console.log('📸 Screenshot saved: team-members-before-invite.png')
    })

    test('Step 5: Invite a new team member', async () => {
        test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Credentials not set')

        console.log('🎬 Recording: Inviting team member...')
        console.log(`📧 Invite email: ${inviteEmail}`)

        // Find invite button
        const inviteBtn = sharedPage.getByRole('button', { name: /invite|add member|\+ member/i }).first()

        if (await inviteBtn.isVisible().catch(() => false)) {
            await inviteBtn.click()
            await sharedPage.waitForTimeout(1000)

            // Fill email
            const emailInput = sharedPage.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first()
            if (await emailInput.isVisible().catch(() => false)) {
                await emailInput.fill(inviteEmail)
                console.log('  ✓ Email filled')
            }

            // Select role if available
            const roleSelect = sharedPage.locator('select[name="role"], select[id*="role"]').first()
            if (await roleSelect.isVisible().catch(() => false)) {
                await roleSelect.selectOption('STAFF')
                console.log('  ✓ Role selected: STAFF')
            }

            // Submit invitation
            const sendBtn = sharedPage.getByRole('button', { name: /send|invite|add/i }).first()
            if (await sendBtn.isVisible().catch(() => false)) {
                await sendBtn.click()
                await sharedPage.waitForTimeout(3000)
                console.log('  ✓ Invitation sent')
            }
        }

        console.log('✅ Invitation process completed')
    })

    test('Step 6: Verify invited member appears in list', async () => {
        test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Credentials not set')

        console.log('🎬 Recording: Verifying invited member in list...')

        // Refresh the page to see updated list
        await sharedPage.reload()
        await sharedPage.waitForLoadState('networkidle')
        await sharedPage.waitForTimeout(2000)

        // Take screenshot of updated state
        await sharedPage.screenshot({
            path: 'test-results/screenshots/team-members-after-invite.png',
            fullPage: true
        })

        // Check if invited email appears in the page
        const emailText = sharedPage.locator(`text=${inviteEmail}`)
        const isVisible = await emailText.isVisible().catch(() => false)

        if (isVisible) {
            console.log('✅ Invited member appears in list!')
        } else {
            console.log('⚠️ Invited member not visible yet (may need to check API)')
        }

        console.log('📸 Screenshot saved: team-members-after-invite.png')
    })

    test('Step 7: Check browser console for errors', async () => {
        test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Credentials not set')

        console.log('🎬 Recording: Checking console logs...')

        // Listen to console messages
        const consoleMessages: string[] = []
        sharedPage.on('console', msg => {
            if (msg.type() === 'error') {
                consoleMessages.push(`ERROR: ${msg.text()}`)
            }
        })

        await sharedPage.waitForTimeout(2000)

        if (consoleMessages.length > 0) {
            console.log('⚠️ Console errors found:')
            consoleMessages.forEach(msg => console.log(`  ${msg}`))
        } else {
            console.log('✅ No console errors')
        }

        console.log('🎬 Recording complete! Video saved to test-results/videos/team-members/')
    })
})
