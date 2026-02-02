'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { motion } from 'framer-motion'

export function SocialSignUp() {
    const [isLoading, setIsLoading] = useState<string | null>(null)

    const handleSocialSignIn = async (provider: string) => {
        setIsLoading(provider)
        try {
            await signIn(provider, { callbackUrl: '/dashboard' })
        } catch (error) {
            console.error(`${provider} sign in error:`, error)
        } finally {
            setIsLoading(null)
        }
    }

    return (
        <div className="space-y-4">
            {/* Divider */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Or sign up using</span>
                </div>
            </div>

            {/* Social Sign Up Buttons */}
            <div className="grid grid-cols-1 gap-4">
                {/* Google */}
                <motion.button
                    type="button"
                    onClick={() => handleSocialSignIn('google')}
                    disabled={isLoading !== null}
                    className="flex items-center justify-center gap-3 px-6 py-3 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {isLoading === 'google' ? (
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            <span className="font-medium text-gray-700">Google</span>
                        </>
                    )}
                </motion.button>
            </div>
        </div>
    )
}

interface TermsCheckboxProps {
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    error?: string
}

export function TermsCheckbox({ checked, onCheckedChange, error }: TermsCheckboxProps) {
    return (
        <div className="space-y-2">
            <div className="flex items-start space-x-3">
                <Checkbox
                    id="terms"
                    checked={checked}
                    onCheckedChange={onCheckedChange}
                    className="mt-1"
                />
                <label
                    htmlFor="terms"
                    className="text-sm leading-relaxed text-gray-700 cursor-pointer"
                >
                    I agree to the{' '}
                    <Link
                        href="/terms-of-service"
                        target="_blank"
                        className="font-medium text-pink-600 hover:text-pink-700 hover:underline"
                    >
                        Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                        href="/privacy-policy"
                        target="_blank"
                        className="font-medium text-pink-600 hover:text-pink-700 hover:underline"
                    >
                        Privacy Policy
                    </Link>
                </label>
            </div>
            {error && (
                <p className="text-xs text-red-600 ml-7">{error}</p>
            )}
            <p className="text-xs text-gray-500 ml-7">
                Your data will be stored in INDIA data center.
            </p>
        </div>
    )
}
