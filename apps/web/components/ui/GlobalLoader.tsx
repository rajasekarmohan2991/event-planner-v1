'use client'

export default function GlobalLoader() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                {/* Ayphen Technologies Logo */}
                <div className="animate-pulse">
                    <svg width="200" height="80" viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Pink Circle with 'a' */}
                        <circle cx="30" cy="40" r="25" fill="#E91E63" />
                        <text x="30" y="50" fontSize="32" fontWeight="bold" fill="white" textAnchor="middle">a</text>

                        {/* "yphen" text */}
                        <text x="65" y="48" fontSize="28" fontWeight="600" fill="#333">yphen</text>

                        {/* "Technologies" text */}
                        <text x="65" y="62" fontSize="10" fill="#666">Technologies</text>
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
