// Notification utility functions
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface NotificationData {
  type: NotificationType
  title: string
  message: string
  actionUrl?: string
}

// Show notification from anywhere in the app
export const showNotification = (notification: NotificationData) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('showNotification', { detail: notification }))
  }
}

// Predefined notification templates
export const notifications = {
  registrationReceived: (eventName: string, attendeeName: string) => ({
    type: 'success' as NotificationType,
    title: 'New Registration',
    message: `${attendeeName} registered for ${eventName}`,
    actionUrl: `/events/registrations`
  }),

  eventUpdated: (eventName: string) => ({
    type: 'info' as NotificationType,
    title: 'Event Updated',
    message: `${eventName} has been updated successfully`,
    actionUrl: `/events`
  }),

  registrationApproved: (attendeeName: string) => ({
    type: 'success' as NotificationType,
    title: 'Registration Approved',
    message: `${attendeeName}'s registration has been approved`,
  }),

  systemError: (message: string) => ({
    type: 'error' as NotificationType,
    title: 'System Error',
    message: message,
  }),

  bulkAction: (action: string, count: number) => ({
    type: 'success' as NotificationType,
    title: 'Bulk Action Complete',
    message: `${action} completed for ${count} registrations`,
  })
}
