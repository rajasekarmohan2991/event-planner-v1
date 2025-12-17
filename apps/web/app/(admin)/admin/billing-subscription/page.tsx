'use client'

import BillingSettings from '@/components/admin/BillingSettings'

export const dynamic = 'force-dynamic'

export default function BillingSubscriptionPage() {
    return (
        <div className="p-6">
            <BillingSettings />
        </div>
    )
}
