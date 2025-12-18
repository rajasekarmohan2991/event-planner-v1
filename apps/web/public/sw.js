/**
 * Service Worker for Offline Support and Advanced Caching
 * Provides offline functionality and aggressive caching strategies
 */

const CACHE_NAME = 'event-planner-v1'
const RUNTIME_CACHE = 'event-planner-runtime'
const IMAGE_CACHE = 'event-planner-images'

// Assets to cache on install
const PRECACHE_ASSETS = [
    '/',
    '/dashboard',
    '/events',
    '/offline',
]

// Install event - precache critical assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Precaching assets')
            return cache.addAll(PRECACHE_ASSETS)
        })
    )
    self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE && name !== IMAGE_CACHE)
                    .map((name) => caches.delete(name))
            )
        })
    )
    self.clients.claim()
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event
    const url = new URL(request.url)

    // Skip non-GET requests
    if (request.method !== 'GET') return

    // API requests - Network first, fallback to cache
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request, RUNTIME_CACHE))
        return
    }

    // Images - Cache first, fallback to network
    if (request.destination === 'image') {
        event.respondWith(cacheFirst(request, IMAGE_CACHE))
        return
    }

    // Static assets - Cache first
    if (
        url.pathname.startsWith('/_next/static/') ||
        url.pathname.startsWith('/images/') ||
        url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/)
    ) {
        event.respondWith(cacheFirst(request, CACHE_NAME))
        return
    }

    // HTML pages - Network first with cache fallback
    event.respondWith(networkFirst(request, RUNTIME_CACHE))
})

/**
 * Network First Strategy
 * Try network, fallback to cache, show offline page if both fail
 */
async function networkFirst(request, cacheName) {
    try {
        const response = await fetch(request)

        // Cache successful responses
        if (response.ok) {
            const cache = await caches.open(cacheName)
            cache.put(request, response.clone())
        }

        return response
    } catch (error) {
        // Network failed, try cache
        const cached = await caches.match(request)

        if (cached) {
            return cached
        }

        // Both failed, return offline page for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/offline')
        }

        // Return error response
        return new Response('Network error', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
        })
    }
}

/**
 * Cache First Strategy
 * Try cache, fallback to network
 */
async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request)

    if (cached) {
        return cached
    }

    try {
        const response = await fetch(request)

        if (response.ok) {
            const cache = await caches.open(cacheName)
            cache.put(request, response.clone())
        }

        return response
    } catch (error) {
        return new Response('Network error', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
        })
    }
}

/**
 * Stale While Revalidate Strategy
 * Return cached response immediately, update cache in background
 */
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName)
    const cached = await cache.match(request)

    const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
            cache.put(request, response.clone())
        }
        return response
    })

    return cached || fetchPromise
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-registrations') {
        event.waitUntil(syncRegistrations())
    }
})

async function syncRegistrations() {
    // Implement background sync logic here
    console.log('[SW] Syncing offline registrations')
}

// Push notifications
self.addEventListener('push', (event) => {
    const data = event.data?.json() || {}

    event.waitUntil(
        self.registration.showNotification(data.title || 'Event Planner', {
            body: data.body || 'You have a new notification',
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data: data.url,
        })
    )
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()

    if (event.notification.data) {
        event.waitUntil(
            clients.openWindow(event.notification.data)
        )
    }
})
