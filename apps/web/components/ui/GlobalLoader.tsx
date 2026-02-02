'use client'

export default function GlobalLoader() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                {/* Event Planner Logo */}
                <div className="animate-pulse">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="10" y="10" width="60" height="60" rx="12" fill="#DB2777" />
                        <text x="40" y="52" fontSize="40" fontWeight="bold" fill="white" textAnchor="middle">E</text>
                    </svg>
                </div>

                {/* Loading spinner */}
                <div className="flex gap-2">
                    <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    )
}
