"use client"

import { useEffect, useState } from 'react'
import { QrCode, Download, Mail, User, Calendar, Tag } from 'lucide-react'

type Registration = {
  id: string
  eventId: number
  dataJson?: {
    email?: string
    firstName?: string
    lastName?: string
    phone?: string
    company?: string
    jobTitle?: string
    type?: string
    registeredAt?: string
  }
  // Enhanced fields from API
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  company?: string
  jobTitle?: string
  type: string
  createdAt: string
  registeredAt?: string
}

export default function RegistrationListPage({ params }: { params: { id: string } }) {
  const [rows, setRows] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState<number>(0)
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null)

  useEffect(() => {
    let aborted = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/events/${params.id}/registrations`, { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
        
        if (!res.ok) {
          console.error('Failed to fetch registrations:', res.status)
          if (!aborted) { setRows([]); setTotal(0) }
          return
        }
        
        const data = await res.json()
        console.log('📋 Registration list data:', data)
        
        if (!aborted) {
          // Handle new response format with registrations array
          if (data.registrations && Array.isArray(data.registrations)) {
            setRows(data.registrations)
            setTotal(data.pagination?.total || data.registrations.length)
          } else if (Array.isArray(data)) {
            // Fallback for old format
            setRows(data)
            setTotal(data.length)
          } else {
            setRows([])
            setTotal(0)
          }
        }
      } catch (error) {
        console.error('Error loading registrations:', error)
        if (!aborted) { setRows([]); setTotal(0) }
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    load()
    return () => { aborted = true }
  }, [params.id])

  const generateQRCode = (registration: Registration) => {
    const qrData = {
      registrationId: registration.id,
      eventId: registration.eventId,
      email: registration.email || registration.dataJson?.email || '',
      name: `${registration.firstName || registration.dataJson?.firstName || ''} ${registration.lastName || registration.dataJson?.lastName || ''}`,
      type: registration.type,
      timestamp: registration.createdAt
    }
    return Buffer.from(JSON.stringify(qrData)).toString('base64')
  }

  const getQRCodeImageUrl = (registration: Registration) => {
    const qrCode = generateQRCode(registration)
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`
  }

  const downloadQRCode = (registration: Registration) => {
    const qrCodeUrl = getQRCodeImageUrl(registration)
    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `ticket-${registration.id}.png`
    link.click()
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Event Registrations</h1>
          <p className="text-sm text-gray-600 mt-1">Event ID: {params.id} • Total Registrations: {total}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <QrCode className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No registrations yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by sharing your event registration link.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map(registration => (
            <div key={registration.id} className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-indigo-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {registration.firstName || registration.dataJson?.firstName || ''} {registration.lastName || registration.dataJson?.lastName || ''}
                      </h3>
                      <p className="text-xs text-gray-500">ID: {registration.id}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {registration.type}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {registration.email || registration.dataJson?.email || ''}
                  </div>
                  {(registration.company || registration.dataJson?.company) && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Tag className="h-4 w-4 mr-2" />
                      {registration.company || registration.dataJson?.company}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(registration.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* QR Code */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-center mb-3">
                    <img 
                      src={getQRCodeImageUrl(registration)} 
                      alt="QR Code" 
                      className="w-32 h-32 border-2 border-indigo-200 rounded-lg"
                    />
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadQRCode(registration)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </button>
                    <button
                      onClick={() => setSelectedReg(registration)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
                    >
                      <QrCode className="h-4 w-4 mr-1" />
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      {selectedReg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReg(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Event Ticket</h3>
              <p className="text-sm text-gray-600 mb-4">
                {selectedReg.firstName || selectedReg.dataJson?.firstName || ''} {selectedReg.lastName || selectedReg.dataJson?.lastName || ''}
              </p>
              <img 
                src={getQRCodeImageUrl(selectedReg)} 
                alt="QR Code" 
                className="w-64 h-64 mx-auto border-4 border-indigo-600 rounded-lg mb-4"
              />
              <div className="text-left bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm"><strong>Registration ID:</strong> {selectedReg.id}</p>
                <p className="text-sm"><strong>Email:</strong> {selectedReg.email || selectedReg.dataJson?.email || ''}</p>
                <p className="text-sm"><strong>Type:</strong> {selectedReg.type}</p>
                <p className="text-sm"><strong>Date:</strong> {new Date(selectedReg.createdAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelectedReg(null)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
