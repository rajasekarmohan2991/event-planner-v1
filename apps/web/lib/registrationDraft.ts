// Utility functions for managing registration drafts in database

export interface RegistrationDraftData {
  eventId: number
  type: string
  formData: any
  ticketPrice?: number
  promoCode?: string
}

/**
 * Save registration draft to database
 */
export async function saveRegistrationDraft(data: RegistrationDraftData): Promise<void> {
  try {
    await fetch('/api/registration-drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        sessionId: getSessionId()
      })
    })
  } catch (err) {
    console.error('Failed to save registration draft:', err)
  }
}

/**
 * Get registration draft from database
 */
export async function getRegistrationDraft(eventId: number): Promise<any | null> {
  try {
    const res = await fetch(`/api/registration-drafts?eventId=${eventId}`)
    if (res.ok) {
      const { draft } = await res.json()
      return draft
    }
  } catch (err) {
    console.error('Failed to load registration draft:', err)
  }
  return null
}

/**
 * Delete registration draft from database
 */
export async function deleteRegistrationDraft(draftId: string): Promise<void> {
  try {
    await fetch(`/api/registration-drafts?id=${draftId}`, {
      method: 'DELETE'
    })
  } catch (err) {
    console.error('Failed to delete registration draft:', err)
  }
}

/**
 * Get or create session ID for anonymous users
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  let sessionId = sessionStorage.getItem('anonymous-session-id')
  if (!sessionId) {
    sessionId = `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem('anonymous-session-id', sessionId)
  }
  return sessionId
}
