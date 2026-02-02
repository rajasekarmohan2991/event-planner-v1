// Unregister all service workers
// This script runs on every page load to ensure no service workers are active

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
            registration.unregister().then((success) => {
                if (success) {
                    console.log('[SW Cleanup] Service worker unregistered successfully')
                }
            })
        }
    })
}

export { }
