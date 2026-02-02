/**
 * Service Worker Registration
 * Registers and manages the service worker for offline support
 */

'use client'

import { useEffect } from 'react'

export function useServiceWorker() {
    useEffect(() => {
        if (
            typeof window !== 'undefined' &&
            'serviceWorker' in navigator &&
            process.env.NODE_ENV === 'production'
        ) {
            registerServiceWorker()
        }
    }, [])
}

async function registerServiceWorker() {
    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
        })

        console.log('✅ Service Worker registered:', registration.scope)

        // Check for updates every hour
        setInterval(() => {
            registration.update()
        }, 60 * 60 * 1000)

        // Handle updates
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing

            if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New service worker available
                        console.log('🔄 New version available! Reload to update.')

                        // Optionally show a notification to the user
                        if (confirm('New version available! Reload to update?')) {
                            window.location.reload()
                        }
                    }
                })
            }
        })
    } catch (error) {
        console.error('❌ Service Worker registration failed:', error)
    }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications')
        return false
    }

    if (Notification.permission === 'granted') {
        return true
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
    }

    return false
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications() {
    const registration = await navigator.serviceWorker.ready

    try {
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        })

        // Send subscription to server
        await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription),
        })

        console.log('✅ Push notification subscription successful')
        return subscription
    } catch (error) {
        console.error('❌ Push notification subscription failed:', error)
        return null
    }
}
