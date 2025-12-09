"use client"

import { useParams } from 'next/navigation'
import { CreditCard, Gift, Crown, Users, Mic, Building } from 'lucide-react'
import Link from 'next/link'

export default function DemoPage() {
  const params = useParams() as any
  const eventId = params?.id || '1'

  const demoScenarios = [
    {
      title: "Free Event",
      description: "Test free registration with ₹0 pricing",
      price: 0,
      icon: Gift,
      color: "green",
      link: `/events/${eventId}/register`,
      features: ["Instant QR generation", "No payment required", "Quick confirmation"]
    },
    {
      title: "Paid Event - ₹50",
      description: "Test with basic pricing",
      price: 50,
      icon: CreditCard,
      color: "blue",
      link: `/events/${eventId}/register?demoPrice=50`,
      features: ["Dummy payment form", "Card details simulation", "Payment processing"]
    },
    {
      title: "Premium Event - ₹200",
      description: "Test with higher pricing",
      price: 200,
      icon: Crown,
      color: "purple",
      link: `/events/${eventId}/register?demoPrice=200`,
      features: ["VIP pricing (₹600)", "Premium experience", "Full payment flow"]
    },
    {
      title: "Corporate Event - ₹500",
      description: "Test enterprise pricing",
      price: 500,
      icon: Building,
      color: "indigo",
      link: `/events/${eventId}/register?demoPrice=500`,
      features: ["Corporate rates", "Bulk registration", "Advanced features"]
    }
  ]

  const registrationTypes = [
    { type: "general", name: "General Registration", icon: Users, multiplier: 1 },
    { type: "vip", name: "VIP Registration", icon: Crown, multiplier: 3 },
    { type: "virtual", name: "Virtual Attendee", icon: Mic, multiplier: 0.5 },
    { type: "speaker", name: "Speaker Registration", icon: Mic, multiplier: 0 },
    { type: "exhibitor", name: "Exhibitor Registration", icon: Building, multiplier: 2 }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Event Registration Demo</h1>
          <p className="text-lg text-gray-600 mb-6">
            Test different pricing scenarios and registration flows
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800 text-sm">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="font-medium">Demo Mode Active</span>
          </div>
        </div>

        {/* Demo Scenarios */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Demo Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {demoScenarios.map((scenario, index) => {
              const IconComponent = scenario.icon
              const colorClasses = {
                green: "border-green-200 bg-green-50 text-green-800",
                blue: "border-blue-200 bg-blue-50 text-blue-800",
                purple: "border-purple-200 bg-purple-50 text-purple-800",
                indigo: "border-indigo-200 bg-indigo-50 text-indigo-800"
              }

              return (
                <Link
                  key={index}
                  href={scenario.link}
                  className="block p-6 bg-white rounded-xl shadow-lg border-2 border-gray-100 hover:border-indigo-300 hover:shadow-xl transition-all"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${colorClasses[scenario.color as keyof typeof colorClasses]}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{scenario.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
                  
                  <div className="text-2xl font-bold text-indigo-600 mb-4">
                    ₹{scenario.price}
                  </div>
                  
                  <ul className="space-y-1">
                    {scenario.features.map((feature, idx) => (
                      <li key={idx} className="text-xs text-gray-500 flex items-center gap-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Registration Types */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Registration Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {registrationTypes.map((type, index) => {
              const IconComponent = type.icon
              return (
                <div key={index} className="p-4 bg-white rounded-lg border border-gray-200 text-center">
                  <IconComponent className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900 text-sm mb-1">{type.name}</h4>
                  <p className="text-xs text-gray-500">
                    {type.multiplier === 0 ? 'Free' : `${type.multiplier}x base price`}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Test Links */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Test Links</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Registration Flow</h3>
              <div className="space-y-2">
                <Link href={`/events/${eventId}/register`} className="block px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors">
                  → Start Registration (Free)
                </Link>
                <Link href={`/events/${eventId}/register?demoPrice=100`} className="block px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors">
                  → Start Registration (₹100)
                </Link>
                <Link href={`/events/${eventId}/register?demoPrice=250`} className="block px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors">
                  → Start Registration (₹250)
                </Link>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Admin & Check-in</h3>
              <div className="space-y-2">
                <Link href={`/events/${eventId}/checkin/scanner`} className="block px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors">
                  → QR Code Scanner
                </Link>
                <Link href={`/admin/events`} className="block px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors">
                  → Admin Dashboard
                </Link>
                <Link href={`/events/${eventId}`} className="block px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors">
                  → Event Details
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Demo Instructions</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use any scenario above to test registration flow</li>
              <li>• Dummy payment forms are pre-filled for testing</li>
              <li>• QR codes are generated automatically for all scenarios</li>
              <li>• Use the scanner to test check-in functionality</li>
              <li>• All payments are simulated - no real charges</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
