"use client"



export function PageLoader({ text }: { text?: string }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                {/* Event Planner - Small and clear */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-pink-600 flex items-center justify-center">
                        <span className="text-white font-bold">E</span>
                    </div>
                    <span className="font-semibold text-gray-800">Event Planner</span>
                </div>

                {/* Loading indicator */}
                <div className="flex items-center gap-2">
                    {text && <p className="text-sm text-gray-700 font-medium">{text}</p>}
                    <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                </div>
            </div>
        </div>
    )
}
