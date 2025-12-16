export type SMSResult = { success: boolean; messageId?: string; error?: any }
export type WAResult = { success: boolean; id?: string; error?: any }

// Multiple SMS provider support
type SMSProvider = 'textbelt' | 'twilio' | 'smsmode'

// Ensure phone number is E.164; fallback to DEFAULT_SMS_COUNTRY_CODE (e.g. +91)
function normalizePhone(to: string): string {
  const s = String(to || '').trim()
  if (!s) return s
  let digits = s.replace(/[^\d+]/g, '')
  if (digits.startsWith('00')) digits = '+' + digits.slice(2)
  if (digits.startsWith('+')) return digits
  // Common cases: local 10-digit (IN) or 91XXXXXXXXXX
  const cc = process.env.DEFAULT_SMS_COUNTRY_CODE || '+91'
  if (digits.length === 10) return `${cc}${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  return digits.startsWith('+') ? digits : `+${digits}`
}

function getSMSProvider(): SMSProvider {
  // Allow forcing a specific provider via env variable
  const forcedProvider = process.env.SMS_PROVIDER as SMSProvider
  if (forcedProvider && ['textbelt', 'twilio', 'smsmode'].includes(forcedProvider)) {
    console.log(`📱 Using forced SMS provider: ${forcedProvider}`)
    return forcedProvider
  }
  
  // Check which provider is configured
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_SMS_FROM) {
    return 'twilio'
  }
  if (process.env.SMSMODE_API_KEY && process.env.SMSMODE_SENDER) {
    return 'smsmode'
  }
  // Default to TextBelt (free, no config needed)
  return 'textbelt'
}

async function sendWithTextBelt(to: string, body: string): Promise<SMSResult> {
  try {
    const toNormalized = normalizePhone(to)
    console.log('📱 TextBelt - Sending SMS to:', toNormalized)
    
    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: toNormalized,
        message: body,
        key: process.env.TEXTBELT_API_KEY || 'textbelt' // Free tier key is VERY LIMITED; use env for paid key
      })
    })

    const result = await response.json()
    
    console.log('📱 TextBelt response:', result)
    
    if (result.success) {
      console.log('✅ SMS sent successfully via TextBelt')
      return { success: true, messageId: result.textId || 'textbelt-sent' }
    } else {
      console.error('❌ TextBelt error:', result.error)
      console.warn('⚠️ TextBelt FREE tier is VERY LIMITED. Configure Twilio for reliable SMS delivery.')
      console.warn('⚠️ Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM in .env')
      return { success: false, error: result.error || 'TextBelt API error - Quota exceeded or country not supported' }
    }
  } catch (error) {
    console.error('❌ TextBelt send failed:', error)
    return { success: false, error }
  }
}

async function sendWithTwilio(to: string, body: string): Promise<SMSResult> {
  try {
    console.log('📱 Twilio - Attempting to send SMS')
    const toNormalized = normalizePhone(to)
    console.log('📱 Twilio - To:', toNormalized)
    console.log('📱 Twilio - From:', process.env.TWILIO_SMS_FROM)
    console.log('📱 Twilio - Account SID configured:', !!process.env.TWILIO_ACCOUNT_SID)
    console.log('📱 Twilio - Auth Token configured:', !!process.env.TWILIO_AUTH_TOKEN)
    if (!process.env.TWILIO_SMS_FROM) {
      console.error('❌ TWILIO_SMS_FROM not configured')
      return { success: false, error: 'TWILIO_SMS_FROM not configured' }
    }
    
    // Dynamic import to avoid build errors if twilio not installed
    const twilio = await import('twilio')
    const client = twilio.default(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
    
    const message = await client.messages.create({
      to: toNormalized,
      from: process.env.TWILIO_SMS_FROM!,
      body
    })
    
    console.log('✅ Twilio - SMS sent successfully:', message.sid)
    return { success: true, messageId: message.sid }
  } catch (error: any) {
    console.error('❌ Twilio send failed:', error)
    console.error('❌ Twilio error details:', {
      code: error.code,
      message: error.message,
      moreInfo: error.moreInfo
    })
    
    // If trial account restriction, try TextBelt fallback
    if (error.message && error.message.includes('free SMS are disabled')) {
      console.log('⚠️ Twilio trial restriction detected, falling back to TextBelt...')
      return await sendWithTextBelt(to, body)
    }
    
    return { success: false, error: error.message || error }
  }
}

async function sendWithSMSMode(to: string, body: string): Promise<SMSResult> {
  try {
    const apiKey = process.env.SMSMODE_API_KEY!
    const sender = process.env.SMSMODE_SENDER!
    
    const cleanTo = normalizePhone(to)
    const url = 'https://api.smsmode.com/http/1.6/'
    
    const params = new URLSearchParams({
      accessToken: apiKey,
      message: body,
      numero: cleanTo,
      emetteur: sender,
      classe_msg: '4'
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    })

    const responseText = await response.text()
    
    if (response.ok && responseText.includes('0')) {
      const parts = responseText.split(' ')
      const messageId = parts.length > 1 ? parts[1] : responseText
      return { success: true, messageId: messageId.trim() }
    } else {
      console.error('SMSMode API error:', responseText)
      return { success: false, error: `SMSMode API error: ${responseText}` }
    }
  } catch (error) {
    console.error('SMSMode send failed', error)
    return { success: false, error }
  }
}

async function sendWhatsAppWithTwilio(to: string, body: string): Promise<WAResult> {
  try {
    console.log('📱 Twilio WhatsApp - Attempting to send message')
    const toNormalized = normalizePhone(to)
    // Twilio WhatsApp requires 'whatsapp:' prefix
    const toWhatsApp = `whatsapp:${toNormalized}`
    // Default to sandbox number if not set
    const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'

    console.log(`📱 Sending WhatsApp from ${fromWhatsApp} to ${toWhatsApp}`)

    // Dynamic import to avoid build errors if twilio not installed
    const twilio = await import('twilio')
    const client = twilio.default(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

    const message = await client.messages.create({
      to: toWhatsApp,
      from: fromWhatsApp,
      body
    })

    console.log('✅ Twilio WhatsApp sent:', message.sid)
    return { success: true, id: message.sid }
  } catch (error: any) {
    console.error('❌ Twilio WhatsApp error:', error)
    return { success: false, error: error.message || error }
  }
}

export async function sendSMS(to: string, body: string): Promise<SMSResult> {
  const provider = getSMSProvider()
  
  console.log(`📱 Sending SMS via ${provider.toUpperCase()}...`)
  
  switch (provider) {
    case 'twilio':
      return sendWithTwilio(to, body)
    case 'smsmode':
      return sendWithSMSMode(to, body)
    case 'textbelt':
    default:
      return sendWithTextBelt(to, body)
  }
}

export async function sendWhatsApp(to: string, body: string): Promise<WAResult> {
  // Check if Twilio is configured
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    return sendWhatsAppWithTwilio(to, body)
  }

  // Fallback / Error
  console.warn('WhatsApp sending not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM.')
  return { 
    success: false, 
    error: 'WhatsApp not configured. Please set Twilio credentials.' 
  }
}

export function buildShareLink(eventId: string, kind: 'rsvp' | 'register' = 'rsvp') {
  const base = process.env.NEXTAUTH_URL || 'http://localhost:3001'
  if (kind === 'register') return `${base}/events/${eventId}/register?utm=share`
  return `${base}/events/${eventId}/rsvp?utm=share`
}
