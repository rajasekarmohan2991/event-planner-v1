'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export default function DiagnosticsPage() {
    const { data: session } = useSession()
    const [dbStats, setDbStats] = useState<any>(null)
    const [apiTest, setApiTest] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        loadDiagnostics()
    }, [])

    const loadDiagnostics = async () => {
        try {
            setLoading(true)

            // Check database
            const dbRes = await fetch('/api/debug/events')
            const dbData = await dbRes.json()
            setDbStats(dbData)

            // Test events API
            const apiRes = await fetch('/api/events')
            const apiData = await apiRes.json()
            setApiTest(apiData)
        } catch (error) {
            console.error('Diagnostics error:', error)
        } finally {
            setLoading(false)
        }
    }

    const createTestEvent = async () => {
        try {
            setCreating(true)
            const res = await fetch('/api/admin/create-test-event', {
                method: 'POST'
            })
            const data = await res.json()

            if (res.ok) {
                alert('✅ Test event created! Refreshing...')
                loadDiagnostics()
            } else {
                alert('❌ Failed: ' + data.error)
            }
        } catch (error) {
            alert('❌ Error: ' + error)
        } finally {
            setCreating(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p>Running diagnostics...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0e1a] p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white dark:bg-[#111827] rounded-lg shadow p-6">
                    <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-50">
                        🔍 System Diagnostics
                    </h1>

                    {/* Session Info */}
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h2 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">Current Session</h2>
                        <pre className="text-sm overflow-auto text-gray-700 dark:text-gray-300">
                            {JSON.stringify(session, null, 2)}
                        </pre>
                    </div>

                    {/* Database Stats */}
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h2 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">Database Statistics</h2>
                        <div className="space-y-2 text-gray-700 dark:text-gray-300">
                            <p><strong>Total Events:</strong> {dbStats?.totalEvents || 0}</p>
                            <p><strong>Message:</strong> {dbStats?.message}</p>

                            {dbStats?.eventsByStatus && (
                                <div>
                                    <strong>Events by Status:</strong>
                                    <ul className="ml-4 mt-1">
                                        {dbStats.eventsByStatus.map((s: any) => (
                                            <li key={s.status}>
                                                {s.status}: {s._count.status}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {dbStats?.sampleEvents && dbStats.sampleEvents.length > 0 && (
                                <div>
                                    <strong>Sample Events:</strong>
                                    <pre className="text-xs mt-1 overflow-auto">
                                        {JSON.stringify(dbStats.sampleEvents, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* API Test */}
                    <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <h2 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">API Response (/api/events)</h2>
                        <div className="space-y-2 text-gray-700 dark:text-gray-300">
                            <p><strong>Events Returned:</strong> {apiTest?.events?.length || 0}</p>
                            <p><strong>Total Elements:</strong> {apiTest?.totalElements || 0}</p>

                            {apiTest?._performance && (
                                <p><strong>Response Time:</strong> {apiTest._performance.duration}ms</p>
                            )}

                            {apiTest?.events && apiTest.events.length > 0 && (
                                <div>
                                    <strong>Events:</strong>
                                    <pre className="text-xs mt-1 overflow-auto max-h-60">
                                        {JSON.stringify(apiTest.events, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            onClick={loadDiagnostics}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            🔄 Refresh Diagnostics
                        </button>

                        <button
                            onClick={createTestEvent}
                            disabled={creating}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {creating ? 'Creating...' : '➕ Create Test Event'}
                        </button>
                    </div>

                    {/* Instructions */}
                    <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">📋 What to Check:</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                            <li><strong>Session:</strong> Verify your role is SUPER_ADMIN</li>
                            <li><strong>Database:</strong> Check if events exist</li>
                            <li><strong>API:</strong> Check if events are returned</li>
                            <li><strong>If no events:</strong> Click "Create Test Event"</li>
                            <li><strong>After creating:</strong> Go to /admin/events to verify</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
