'use client'

import { AlertCircle, User, Phone, Mail, FileText, Shield } from 'lucide-react'

interface EventTermsAndManagerProps {
  termsAndConditions?: string
  disclaimer?: string
  eventManagerName?: string
  eventManagerContact?: string
  eventManagerEmail?: string
}

export function EventTermsAndManager({
  termsAndConditions,
  disclaimer,
  eventManagerName,
  eventManagerContact,
  eventManagerEmail
}: EventTermsAndManagerProps) {
  const hasManagerInfo = eventManagerName || eventManagerContact || eventManagerEmail
  const hasTermsInfo = termsAndConditions || disclaimer

  if (!hasManagerInfo && !hasTermsInfo) return null

  return (
    <div className="space-y-6 mt-8">
      {/* Event Manager Highlighted Section */}
      {hasManagerInfo && (
        <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Event Manager</h3>
              <p className="text-sm text-gray-600">Contact for event-related queries</p>
            </div>
          </div>
          
          <div className="space-y-3 bg-white/80 backdrop-blur-sm rounded-xl p-4">
            {eventManagerName && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Name</p>
                  <p className="text-base font-semibold text-gray-900">{eventManagerName}</p>
                </div>
              </div>
            )}
            
            {eventManagerContact && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Contact Number</p>
                  <a 
                    href={`tel:${eventManagerContact}`}
                    className="text-base font-semibold text-green-600 hover:text-green-700 transition-colors"
                  >
                    {eventManagerContact}
                  </a>
                </div>
              </div>
            )}
            
            {eventManagerEmail && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Email</p>
                  <a 
                    href={`mailto:${eventManagerEmail}`}
                    className="text-base font-semibold text-blue-600 hover:text-blue-700 transition-colors break-all"
                  >
                    {eventManagerEmail}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Terms and Conditions */}
      {termsAndConditions && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Terms & Conditions</h3>
          </div>
          <div className="prose prose-sm max-w-none text-gray-700">
            <div className="whitespace-pre-wrap">{termsAndConditions}</div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      {disclaimer && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Disclaimer
              </h3>
              <div className="prose prose-sm max-w-none text-gray-700">
                <div className="whitespace-pre-wrap">{disclaimer}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
