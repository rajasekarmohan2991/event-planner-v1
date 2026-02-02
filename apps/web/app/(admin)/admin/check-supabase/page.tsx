'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

export default function SupabaseCheckPage() {
    const [checking, setChecking] = useState(true)
    const [result, setResult] = useState<any>(null)

    useEffect(() => {
        checkConfig()
    }, [])

    const checkConfig = async () => {
        try {
            setChecking(true)
            const res = await fetch('/api/check-supabase')
            const data = await res.json()
            setResult(data)
        } catch (error) {
            console.error('Check failed:', error)
        } finally {
            setChecking(false)
        }
    }

    const getStatusIcon = (check: any) => {
        if (check.success || check.valid) {
            return <CheckCircle className="w-5 h-5 text-green-500" />
        } else if (check.exists && !check.valid) {
            return <AlertCircle className="w-5 h-5 text-yellow-500" />
        } else {
            return <XCircle className="w-5 h-5 text-red-500" />
        }
    }

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0e1a]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Checking Supabase configuration...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0e1a] p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-[#111827] rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                            🔍 Supabase Configuration Check
                        </h1>
                        <button
                            onClick={checkConfig}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Recheck
                        </button>
                    </div>

                    {/* Overall Status */}
                    <div className={`p-4 rounded-lg mb-6 ${result?.ready
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                        }`}>
                        <p className={`font-semibold ${result?.ready ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'
                            }`}>
                            {result?.summary}
                        </p>
                    </div>

                    {/* Environment Info */}
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">Environment</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Mode:</strong> {result?.environment}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Checked at:</strong> {new Date(result?.timestamp).toLocaleString()}
                        </p>
                    </div>

                    {/* Checks */}
                    <div className="space-y-4">
                        {/* Supabase URL */}
                        <div className="p-4 bg-gray-50 dark:bg-[#1f2937] rounded-lg">
                            <div className="flex items-start gap-3">
                                {getStatusIcon(result?.checks?.supabaseUrl)}
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-50">
                                        NEXT_PUBLIC_SUPABASE_URL
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {result?.checks?.supabaseUrl?.message}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">
                                        {result?.checks?.supabaseUrl?.value}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Supabase Key */}
                        <div className="p-4 bg-gray-50 dark:bg-[#1f2937] rounded-lg">
                            <div className="flex items-start gap-3">
                                {getStatusIcon(result?.checks?.supabaseKey)}
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-50">
                                        NEXT_PUBLIC_SUPABASE_ANON_KEY
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {result?.checks?.supabaseKey?.message}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                        Length: {result?.checks?.supabaseKey?.length} characters
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                                        {result?.checks?.supabaseKey?.value}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Connection */}
                        <div className="p-4 bg-gray-50 dark:bg-[#1f2937] rounded-lg">
                            <div className="flex items-start gap-3">
                                {getStatusIcon(result?.checks?.connection)}
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-50">
                                        Supabase Connection
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {result?.checks?.connection?.message}
                                    </p>
                                    {result?.checks?.connection?.bucketsFound > 0 && (
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                            Found {result.checks.connection.bucketsFound} storage bucket(s)
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Uploads Bucket */}
                        <div className="p-4 bg-gray-50 dark:bg-[#1f2937] rounded-lg">
                            <div className="flex items-start gap-3">
                                {getStatusIcon(result?.checks?.uploadsBucket)}
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-50">
                                        "uploads" Bucket
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {result?.checks?.uploadsBucket?.message}
                                    </p>
                                    {result?.checks?.uploadsBucket?.exists && (
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                            Public: {result.checks.uploadsBucket.public ? 'Yes ✅' : 'No ❌'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* All Buckets */}
                        {result?.checks?.connection?.buckets && result.checks.connection.buckets.length > 0 && (
                            <div className="p-4 bg-gray-50 dark:bg-[#1f2937] rounded-lg">
                                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">
                                    All Storage Buckets
                                </h3>
                                <div className="space-y-1">
                                    {result.checks.connection.buckets.map((bucket: any) => (
                                        <div key={bucket.id} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                            <span className="font-mono">{bucket.name}</span>
                                            {bucket.public && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">PUBLIC</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Instructions */}
                    {!result?.ready && (
                        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <h3 className="font-semibold mb-2 text-yellow-900 dark:text-yellow-200">
                                📋 Next Steps
                            </h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800 dark:text-yellow-300">
                                {!result?.checks?.supabaseUrl?.valid && (
                                    <li>Add NEXT_PUBLIC_SUPABASE_URL to .env.local and Vercel</li>
                                )}
                                {!result?.checks?.supabaseKey?.valid && (
                                    <li>Add NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local and Vercel</li>
                                )}
                                {!result?.checks?.connection?.success && (
                                    <li>Verify your Supabase credentials are correct</li>
                                )}
                                {!result?.checks?.uploadsBucket?.exists && (
                                    <li>Create "uploads" bucket in Supabase Storage</li>
                                )}
                                {result?.checks?.uploadsBucket?.exists && !result?.checks?.uploadsBucket?.public && (
                                    <li>Make "uploads" bucket public in Supabase Storage settings</li>
                                )}
                                <li>After making changes, redeploy on Vercel and click "Recheck"</li>
                            </ul>
                        </div>
                    )}

                    {result?.ready && (
                        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <h3 className="font-semibold mb-2 text-green-900 dark:text-green-200">
                                ✅ Ready to Upload!
                            </h3>
                            <p className="text-sm text-green-800 dark:text-green-300">
                                Your Supabase storage is fully configured. You can now upload images in the event creation form!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
