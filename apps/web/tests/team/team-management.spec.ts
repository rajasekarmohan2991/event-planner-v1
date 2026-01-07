import { test, expect } from '@playwright/test'
import { login } from '../helpers/auth.helper'
import { generateTeamMemberData } from '../helpers/test-data'

test.describe('Team Management', () => {
  
  const TEST_EVENT_ID = process.env.TEST_EVENT_ID || '30'
  
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('TEAM-01: View team members list', async ({ page }) => {
    await page.goto(`/events/${TEST_EVENT_ID}/team`)
    await page.waitForLoadState('networkidle')
    
    // Should see team page
    await expect(page.getByText(/team|members/i)).toBeVisible({ timeout: 15000 })
  })

  test('TEAM-02 to TEAM-04: Invite new team member', async ({ page }) => {
    const memberData = generateTeamMemberData()
    
    await page.goto(`/events/${TEST_EVENT_ID}/team`)
    await page.waitForLoadState('networkidle')
    
    // Click invite button
    const inviteBtn = page.getByRole('button', { name: /invite|add.*member/i })
    if (await inviteBtn.isVisible().catch(() => false)) {
      await inviteBtn.click()
      await page.waitForTimeout(1000)
    }
    
    // Fill email
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"], textarea[placeholder*="email"]').first()
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill(memberData.email)
    }
    
    // Select role if dropdown exists
    const roleSelect = page.locator('select[name="role"], button:has-text("Select role")')
    if (await roleSelect.isVisible().catch(() => false)) {
      await roleSelect.click()
      const roleOption = page.getByRole('option', { name: memberData.role })
      if (await roleOption.isVisible().catch(() => false)) {
        await roleOption.click()
      }
    }
    
    // Send invitation
    const sendBtn = page.getByRole('button', { name: /send|invite|add/i }).first()
    if (await sendBtn.isVisible().catch(() => false)) {
      await sendBtn.click()
      await page.waitForTimeout(2000)
    }
    
    // Verify success message or member in list
    const successMsg = page.getByText(/invited|success|sent/i)
    const memberEmail = page.getByText(memberData.email)
    
    const hasSuccess = await successMsg.isVisible().catch(() => false)
    const hasMember = await memberEmail.isVisible().catch(() => false)
    
    expect(hasSuccess || hasMember).toBe(true)
  })
})
