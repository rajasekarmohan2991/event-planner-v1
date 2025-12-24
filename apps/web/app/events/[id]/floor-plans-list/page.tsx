'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function FloorPlansListPage() {
    const params = useParams()
    const eventId = params?.id as string
    const [plans, setPlans] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/events/${eventId}/floor-plans-direct`)
                if (res.ok) {
                    const data = await res.json()
                    console.log('Direct API response:', data)
                    if (data.floorPlans) {
                        setPlans(data.floorPlans)
                    }
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        if (eventId) load()
    }, [eventId])

    if (loading) return <div className="p-8">Loading floor plans...</div>

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Floor Plans (Direct View)</h1>
                <p className="text-sm text-gray-600">Event ID: {eventId}</p>
                <p className="text-sm text-gray-600 mt-2">Found {plans.length} floor plan(s)</p>
            </div>

            {plans.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <p className="text-gray-500">No floor plans found</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {plans.map((plan) => (
                        <div key={plan.id} className="border rounded-lg p-6 bg-white shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                                    <p className="text-sm text-gray-600 mt-1">ID: {plan.id}</p>
                                    <p className="text-sm text-gray-600">Created: {new Date(plan.createdAt).toLocaleString()}</p>
                                    <p className="text-sm text-gray-600">Status: {plan.status}</p>
                                    {plan.totalCapacity > 0 && (
                                        <p className="text-sm text-gray-600 mt-2">
                                            Capacity: {plan.totalCapacity}
                                            {plan.vipCapacity > 0 && ` (VIP: ${plan.vipCapacity})`}
                                            {plan.premiumCapacity > 0 && ` (Premium: ${plan.premiumCapacity})`}
                                            {plan.generalCapacity > 0 && ` (General: ${plan.generalCapacity})`}
                                        </p>
                                    )}
                                </div>
                                <Link
                                    href={`/events/${eventId}/design/floor-plan?planId=${plan.id}`}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                                >
                                    View/Edit
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-8">
                <Link
                    href={`/events/${eventId}/design`}
                    className="text-indigo-600 hover:text-indigo-700 text-sm"
                >
                    ← Back to Design & Branding
                </Link>
            </div>
        </div>
    )
}
