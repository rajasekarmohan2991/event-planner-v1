"use client"

import Image from 'next/image'

export function PageLoader({ text }: { text?: string }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                {/* Ayphen Logo */}
                <div className="relative w-48 h-18 animate-pulse">
                    <Image
                        src="/images/ayphen-logo.png"
                        alt="Ayphen Technologies"
                        width={192}
                        height={72}
                        className="object-contain"
                        priority
                    />
                </div>

                {/* Loading indicator */}
                <div className="flex items-center gap-2">
                    {text && <p className="text-sm text-gray-600 font-medium">{text}</p>}
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
