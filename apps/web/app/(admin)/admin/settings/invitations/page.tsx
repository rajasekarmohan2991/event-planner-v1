'use client'

export const dynamic = 'force-dynamic'

export default function InvitationsPage() {
  return (
    <div className="p-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">
          🚧 User Invitations - Under Maintenance
        </h2>
        <p className="text-yellow-700">
          This page is temporarily unavailable while we fix some technical issues. 
          Please use the development mode or check back later.
        </p>
        <div className="mt-4">
          <p className="text-sm text-yellow-600">
            <strong>Alternative:</strong> You can still invite users manually via email.
          </p>
        </div>
      </div>
    </div>
  )
}
