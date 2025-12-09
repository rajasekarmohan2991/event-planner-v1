import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export type Notification = {
  id: string
  userId: bigint
  type: string
  title: string
  message: string
  link?: string | null
  isRead: boolean
  readAt?: Date | null
  isArchived: boolean
  createdAt: string
}

export function useNotifications() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = async () => {
    if (!session) return

    try {
      const res = await fetch('/api/user/notifications')
      if (!res.ok) throw new Error('Failed to fetch notifications')
      
      const data = await res.json()
      setNotifications(data.notifications)
      setUnreadCount(data.notifications.filter((n: Notification) => !n.isRead).length)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching notifications:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      })
      
      if (!res.ok) throw new Error('Failed to mark as read')
      
      // Update local state
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true })
      })
      
      if (!res.ok) throw new Error('Failed to mark all as read')
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date() })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  useEffect(() => {
    if (session) {
      fetchNotifications()
      // Poll every minute
      const interval = setInterval(fetchNotifications, 60000)
      return () => clearInterval(interval)
    }
  }, [session])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead
  }
}
