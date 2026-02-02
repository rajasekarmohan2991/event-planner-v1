"use client"

import { useState, useEffect } from 'react'
import { Bell, X, Check, AlertCircle, Info, CheckCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'

type NotificationType = 'success' | 'error' | 'warning' | 'info'

type Notification = {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
}

export default function NotificationBell() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Load notifications from database on mount
  useEffect(() => {
    if (session?.user) {
      fetch('/api/user/notifications')
        .then(res => res.json())
        .then(data => {
          if (data.notifications) {
            const parsed = data.notifications.map((n: any) => ({
              id: n.id,
              type: n.type,
              title: n.title,
              message: n.message,
              timestamp: new Date(n.createdAt),
              read: n.isRead,
              actionUrl: n.link
            }))
            setNotifications(parsed)
            setUnreadCount(parsed.filter((n: Notification) => !n.read).length)
          }
        })
        .catch(err => console.error('Failed to load notifications:', err))
    }
  }, [session])

  // Listen for custom notification events and save to database
  useEffect(() => {
    const handleNotification = async (event: CustomEvent<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      try {
        // Save to database
        const res = await fetch('/api/user/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: event.detail.type,
            title: event.detail.title,
            message: event.detail.message,
            link: event.detail.actionUrl
          })
        })
        
        if (res.ok) {
          const { notification } = await res.json()
          const newNotification: Notification = {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            timestamp: new Date(notification.createdAt),
            read: false,
            actionUrl: notification.link
          }
          
          setNotifications(prev => [newNotification, ...prev.slice(0, 19)])
          setUnreadCount(prev => prev + 1)
        }
      } catch (err) {
        console.error('Failed to save notification:', err)
      }
    }

    window.addEventListener('showNotification', handleNotification as EventListener)
    return () => window.removeEventListener('showNotification', handleNotification as EventListener)
  }, [])

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id })
      })
      
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true })
      })
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const removeNotification = (id: string) => {
    const notification = notifications.find(n => n.id === id)
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    // Note: We keep it in DB but hide from UI
  }

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'info': return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  if (!session) return null

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTime(notification.timestamp)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 text-gray-400 hover:text-blue-600"
                                title="Mark as read"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => removeNotification(notification.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Remove"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        {notification.actionUrl && (
                          <a
                            href={notification.actionUrl}
                            className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-800"
                            onClick={() => {
                              markAsRead(notification.id)
                              setIsOpen(false)
                            }}
                          >
                            View details →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Helper function to show notifications from anywhere in the app
export const showNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('showNotification', { detail: notification }))
  }
}
