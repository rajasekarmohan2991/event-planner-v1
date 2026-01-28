'use client'

import { useEffect, useState } from 'react'

export default function DemoPage() {
    const [floorPlans, setFloorPlans] = useState<any[]>([])
    const [registrations, setRegistrations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            // Load floor plans
            const fpRes = await fetch('/api/events/22/floor-plans-direct')
            if (fpRes.ok) {
                const fpData = await fpRes.json()
                setFloorPlans(fpData.floorPlans || [])
            }

            // Load registrations
            const regRes = await fetch('/api/events/22/registrations-emergency')
            if (regRes.ok) {
                const regData = await regRes.json()
                setRegistrations(regData.registrations || [])
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading demo data...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 text-center">Event Management System Demo</h1>

                {/* Floor Plans Section */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-rose-600">
                        📐 Floor Plans ({floorPlans.length})
                    </h2>
                    {floorPlans.length === 0 ? (
                        <p className="text-gray-500">No floor plans yet</p>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {floorPlans.map((plan) => (
                                <div key={plan.id} className="border rounded-lg p-4 hover:shadow-md transition">
                                    <h3 className="font-semibold text-lg mb-2">{plan.name}</h3>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p>📅 Created: {new Date(plan.createdAt).toLocaleDateString()}</p>
                                        <p>📊 Status: {plan.status}</p>
                                        <p>🎫 Total Capacity: {plan.totalCapacity}</p>
                                        {plan.vipCapacity > 0 && <p>⭐ VIP: {plan.vipCapacity}</p>}
                                        {plan.premiumCapacity > 0 && <p>💎 Premium: {plan.premiumCapacity}</p>}
                                        {plan.generalCapacity > 0 && <p>🎟️ General: {plan.generalCapacity}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Registrations Section */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-bold mb-4 text-green-600">
                        ✅ Registrations ({registrations.length})
                    </h2>
                    {registrations.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 mb-4">No registrations yet</p>
                            <a
                                href="/events/22/register"
                                className="inline-block px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                            >
                                Create Test Registration
                            </a>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Name</th>
                                        <th className="px-4 py-2 text-left">Email</th>
                                        <th className="px-4 py-2 text-left">Phone</th>
                                        <th className="px-4 py-2 text-left">Type</th>
                                        <th className="px-4 py-2 text-left">Status</th>
                                        <th className="px-4 py-2 text-left">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registrations.map((reg) => (
                                        <tr key={reg.id} className="border-t hover:bg-gray-50">
                                            <td className="px-4 py-2">{reg.firstName} {reg.lastName}</td>
                                            <td className="px-4 py-2">{reg.email}</td>
                                            <td className="px-4 py-2">{reg.phone}</td>
                                            <td className="px-4 py-2">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                    {reg.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                                    {reg.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-600">
                                                {new Date(reg.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="mt-8 flex gap-4 justify-center">
                    <a
                        href="/events/22/register"
                        className="px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium"
                    >
                        📝 New Registration
                    </a>
                    <a
                        href="/events/22/design/floor-plan"
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                    >
                        📐 Create Floor Plan
                    </a>
                    <button
                        onClick={loadData}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                    >
                        🔄 Refresh Data
                    </button>
                </div>

                {/* Debug Info */}
                <div className="mt-8 p-4 bg-gray-100 rounded text-xs text-gray-600">
                    <p>✅ Floor Plans API: /api/events/22/floor-plans-direct</p>
                    <p>✅ Registrations API: /api/events/22/registrations-emergency</p>
                    <p>📊 Last Updated: {new Date().toLocaleTimeString()}</p>
                </div>
            </div>
        </div>
    )
}
