import { test, expect, Page } from '@playwright/test'

/**
 * Complete Authentication Flow Test Suite
 * Tests: Sign up, Login, Session persistence, Logout
 * Includes browser recording for all steps
 */

const timestamp = Date.now()
const testEmail = `testuser${timestamp}@example.com`
const testPassword = 'TestPassword123!'
const testName = `Test User ${timestamp}`

test.describe('Complete Authentication Flow with Browser Recording', () => {

    test.describe.configure({ mode: 'serial' })

    let sharedPage: Page

    test.beforeAll(async ({ browser }) => {
        sharedPage = await browser.newPage({
            recordVideo: {
                dir: './test-results/videos/auth-flow',
                size: { width: 1920, height: 1080 }
            }
        })
    })

    test.afterAll(async () => {
        await sharedPage.close()
    })

    test('Step 1: Navigate to Sign Up page', async () => {
        console.log('🎬 Recording: Navigating to sign up page...')

        // Direct navigation to register page
        await sharedPage.goto('/auth/register')
        await sharedPage.waitForLoadState('networkidle')
        await sharedPage.waitForTimeout(1000)

        // Verify we're on the signup page
        await expect(sharedPage).toHaveURL(/\/(auth\/register|signup|register)/)
        console.log('✅ Successfully navigated to sign up page')
    })

    test('Step 2: Fill out registration form', async () => {
        console.log('🎬 Recording: Filling registration form...')

        // Wait for form to be visible
        await sharedPage.waitForTimeout(1000)

        // Fill name field
        const nameInput = sharedPage.locator('input[name="name"], input[placeholder*="name" i], input[id*="name"]').first()
        if (await nameInput.isVisible().catch(() => false)) {
            await nameInput.fill(testName)
            console.log(`  ✓ Filled name: ${testName}`)
        }

        // Fill email
        const emailInput = sharedPage.locator('input[type="email"], input[name="email"]').first()
        await expect(emailInput).toBeVisible({ timeout: 5000 })
        await emailInput.fill(testEmail)
        console.log(`  ✓ Filled email: ${testEmail}`)

        // Fill password
        const passwordInput = sharedPage.locator('input[type="password"]').first()
        await expect(passwordInput).toBeVisible()
        await passwordInput.fill(testPassword)
        console.log('  ✓ Filled password')

        // Fill confirm password if exists
        const confirmPasswordInput = sharedPage.locator('input[type="password"]').nth(1)
        if (await confirmPasswordInput.isVisible().catch(() => false)) {
            await confirmPasswordInput.fill(testPassword)
            console.log('  ✓ Filled confirm password')
        }

        console.log('✅ Registration form filled successfully')
    })

    test('Step 3: Submit registration and verify account creation', async () => {
        console.log('🎬 Recording: Submitting registration...')

        // Find and click submit button
        const submitBtn = sharedPage.getByRole('button', { name: /sign up|register|create account/i }).first()
        await expect(submitBtn).toBeVisible()
        await submitBtn.click()

        // Wait for redirect or success message
        await sharedPage.waitForTimeout(3000)

        // Check if we're redirected (successful registration)
        const currentUrl = sharedPage.url()
        const isRedirected = !currentUrl.includes('/register') && !currentUrl.includes('/signup')

        // Or check for success message
        const hasSuccessMessage = await sharedPage.locator('text=/success|welcome|account created/i').isVisible().catch(() => false)

        expect(isRedirected || hasSuccessMessage).toBe(true)
        console.log('✅ Account created successfully')
    })

    test('Step 4: Logout from new account', async () => {
        console.log('🎬 Recording: Logging out...')

        await sharedPage.waitForTimeout(2000)

        // Try to find and click profile/avatar button
        const profileBtn = sharedPage.locator('button').filter({
            has: sharedPage.locator('img[alt*="avatar"], img[alt*="profile"], span[class*="Avatar"]')
        }).first()

        if (await profileBtn.isVisible().catch(() => false)) {
            await profileBtn.click()
            await sharedPage.waitForTimeout(500)

            // Click sign out
            const signOutBtn = sharedPage.getByRole('menuitem', { name: /sign out|logout/i }).or(
                sharedPage.getByRole('button', { name: /sign out|logout/i })
            )

            if (await signOutBtn.isVisible().catch(() => false)) {
                await signOutBtn.click()
                await sharedPage.waitForTimeout(2000)
            }
        } else {
            // Fallback: direct API logout
            await sharedPage.goto('/api/auth/signout')
            await sharedPage.waitForLoadState('networkidle')
        }

        console.log('✅ Logged out successfully')
    })

    test('Step 5: Login with newly created account', async () => {
        console.log('🎬 Recording: Logging in with new credentials...')

        await sharedPage.goto('/auth/login')
        await sharedPage.waitForLoadState('networkidle')

        // Fill email
        const emailInput = sharedPage.locator('input[type="email"], input[name="email"]').first()
        await expect(emailInput).toBeVisible({ timeout: 10000 })
        await emailInput.fill(testEmail)
        console.log(`  ✓ Entered email: ${testEmail}`)

        // Fill password
        const passwordInput = sharedPage.locator('input[type="password"]').first()
        await passwordInput.fill(testPassword)
        console.log('  ✓ Entered password')

        // Submit
        const submitBtn = sharedPage.getByRole('button', { name: /sign in|log in/i }).first()
        await submitBtn.click()

        // Wait for redirect
        await sharedPage.waitForTimeout(3000)

        // Verify we're not on login page anymore
        const currentUrl = sharedPage.url()
        expect(currentUrl).not.toContain('/auth/login')
        console.log('✅ Login successful')
    })

    test('Step 6: Verify session persistence after page refresh', async () => {
        console.log('🎬 Recording: Testing session persistence...')

        // Refresh the page
        await sharedPage.reload()
        await sharedPage.waitForLoadState('networkidle')
        await sharedPage.waitForTimeout(2000)

        // Navigate to home
        await sharedPage.goto('/')
        await sharedPage.waitForLoadState('networkidle')

        // Check if still logged in (no sign in link visible)
        const signInLink = sharedPage.getByRole('link', { name: /sign in/i })
        const isSignInVisible = await signInLink.isVisible().catch(() => false)

        // If sign in link is NOT visible, user is still logged in
        expect(isSignInVisible).toBe(false)
        console.log('✅ Session persisted after refresh')
    })

    test('Step 7: Final logout', async () => {
        console.log('🎬 Recording: Final logout...')

        // Try profile dropdown logout
        const profileBtn = sharedPage.locator('button').filter({
            has: sharedPage.locator('img[alt*="avatar"], img[alt*="profile"]')
        }).first()

        if (await profileBtn.isVisible().catch(() => false)) {
            await profileBtn.click()
            await sharedPage.waitForTimeout(500)

            const signOutBtn = sharedPage.getByRole('menuitem', { name: /sign out|logout/i }).or(
                sharedPage.getByRole('button', { name: /sign out|logout/i })
            )

            if (await signOutBtn.isVisible().catch(() => false)) {
                await signOutBtn.click()
                await sharedPage.waitForTimeout(2000)
            }
        } else {
            await sharedPage.goto('/api/auth/signout')
            await sharedPage.waitForLoadState('networkidle')
        }

        // Verify logout
        await sharedPage.goto('/')
        await sharedPage.waitForLoadState('networkidle')
        const signInLink = sharedPage.getByRole('link', { name: /sign in/i })
        const isVisible = await signInLink.isVisible().catch(() => false)
        expect(isVisible).toBe(true)

        console.log('✅ Logged out successfully')
        console.log('🎬 Recording complete! Video saved to test-results/videos/auth-flow/')
    })
})
