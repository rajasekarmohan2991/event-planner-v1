// Service Worker for offline support and caching
// This improves performance and enables offline functionality

const CACHE_NAME = 'event-planner-v1'
const STATIC_CACHE = 'static-v1'
const DYNAMIC_CACHE = 'dynamic-v1'

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/offline',
    '/manifest.json',
    '/favicon.ico',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...')
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('[SW] Caching static assets')
            return cache.addAll(STATIC_ASSETS)
        })
    )
    self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...')
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
                    .map((key) => caches.delete(key))
            )
        })
    )
    return self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event
    const url = new URL(request.url)

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return
    }

    // Skip API requests (always fetch fresh)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful API responses for 30 seconds
                    if (response.ok) {
                        const clone = response.clone()
                        caches.open(DYNAMIC_CACHE).then((cache) => {
                            cache.put(request, clone)
                        })
                    }
                    return response
                })
                .catch(() => {
                    // Return cached version if offline
                    return caches.match(request)
                })
        )
        return
    }

    // For other requests: Cache-first strategy
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) {
                // Return cached version and update in background
                fetch(request).then((response) => {
                    if (response.ok) {
                        caches.open(DYNAMIC_CACHE).then((cache) => {
                            cache.put(request, response)
                        })
                    }
                })
                return cached
            }

            // Not in cache, fetch from network
            return fetch(request).then((response) => {
                if (response.ok) {
                    const clone = response.clone()
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, clone)
                    })
                }
                return response
            })
        })
    )
})

// Message event - handle cache updates
self.addEventListener('message', (event) => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting()
    }

    if (event.data.action === 'clearCache') {
        event.waitUntil(
            caches.keys().then((keys) => {
                return Promise.all(keys.map((key) => caches.delete(key)))
            })
        )
    }
})
