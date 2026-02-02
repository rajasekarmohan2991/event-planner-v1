'use server'

export type SmsResult = { success: true; messageId: string } | { success: false; error: any }

// Import the multi-provider SMS function
import { sendSMS } from './messaging'

export async function sendSms(to: string, message: string): Promise<SmsResult> {
  try {
    console.log('[SMS] Sending via multi-provider system...')
    const result = await sendSMS(to, message)
    
    if (result.success) {
      return { success: true, messageId: result.messageId || 'sent' }
    } else {
      return { success: false, error: result.error }
    }
  } catch (error) {
    console.error('[SMS] Failed to send', error)
    return { success: false, error }
  }
}
