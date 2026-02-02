'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { XCircle } from 'lucide-react'

export default function InvitationRejectedPage() {
    const searchParams = useSearchParams()
    const message = searchParams.get('message') || 'You have declined the invitation'

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <XCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl">Invitation Declined</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-gray-600 mb-4">{message}</p>
                    <p className="text-sm text-gray-500">
                        You have successfully declined the event team invitation. You can close this page.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
