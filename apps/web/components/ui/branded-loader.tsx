"use client"

import Image from 'next/image'
import { cn } from "@/lib/utils"

interface BrandedLoaderProps {
    text?: string
    className?: string
}

export function BrandedLoader({ text = "Loading...", className }: BrandedLoaderProps) {
    return (
        <div className={cn("flex h-full min-h-[50vh] w-full flex-col items-center justify-center gap-6 p-8", className)}>
            <div className="relative flex flex-col items-center justify-center gap-6">
                {/* Ayphen Logo - Smaller and clearer */}
                <div className="relative w-40 h-16">
                    <Image
                        src="/images/ayphen-logo.png"
                        alt="Ayphen Technologies"
                        fill
                        className="object-contain"
                        priority
                        quality={100}
                    />
                </div>

                {/* Loading text with animated dots */}
                <div className="flex flex-col items-center gap-3">
                    <p className="text-sm text-gray-700 font-medium">{text}</p>
                    <div className="flex gap-1.5">
                        <span className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                </div>
            </div>
        </div>
    )
}
