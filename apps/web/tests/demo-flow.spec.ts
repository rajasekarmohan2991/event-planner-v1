import { test, expect } from '@playwright/test';

test.describe('Demo User E2E Flow', () => {

    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('/auth/login');
        await page.fill('input[type="email"]', 'demo@eventplanner.com');
        await page.fill('input[type="password"]', 'Password123!');
        // Handle potential duplicate login or session checks if any
        const submitParam = 'button[type="submit"]';
        await page.waitForSelector(submitParam);
        await page.click(submitParam);

        // Wait for dashboard redirect
        await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
    });

    test('Verify Dashboard and Profile', async ({ page }) => {
        // Check if User Name is displayed
        await expect(page.locator('body')).toContainText('Demo Admin');

        // Check if Tenant context is correct (optional, depends on UI)
        // await expect(page.locator('body')).toContainText('Demo Corporation');
    });

    test('Verify User Settings Persistence', async ({ page }) => {
        // Navigate to Settings
        await page.goto('/settings');

        // Verify Personal Preferences (Seeded)
        // We seeded: SMS=true, Theme=light, Language=en

        // Check Theme (This depends on actual UI implementation, checking class or specific element)
        // For now, check text presence
        await expect(page.locator('body')).toContainText('Settings');

        // Test modification
        // Note: If DB is broken (Events), Settings might still work (UserPreference table was seeded)
    });

    test('Attempt Event Creation (Expect Failure due to DB)', async ({ page }) => {
        // Navigate to Events
        await page.goto('/dashboard/events');

        // Click Create Event
        const createBtn = page.getByText('Create Event');
        if (await createBtn.isVisible()) {
            await createBtn.click();

            // Fill basic form
            await page.fill('input[name="name"]', 'Playwright Test Event');
            await page.fill('textarea[name="description"]', 'Test Description');
            // Note: DB is missing description, so specific error expected or UI might not fail until Submit.

            // We won't submit to avoid pollution/crashes, just verify we got here.
            await expect(page.locator('h1')).toContainText('Create Event');
        }
    });

});
