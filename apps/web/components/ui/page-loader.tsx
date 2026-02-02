"use client"



export function PageLoader({ text }: { text?: string }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                {/* Modern Pulse Ring Loader */}
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 opacity-20 animate-ping"></div>
                    <div className="absolute inset-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 opacity-40 animate-pulse"></div>
                    <div className="absolute inset-3 rounded-full bg-gradient-to-r from-pink-600 to-purple-700 flex items-center justify-center shadow-2xl">
                        <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                </div>

                {/* Loading text */}
                {text && <p className="text-sm text-gray-700 font-medium">{text}</p>}
            </div>
        </div>
    )
}
