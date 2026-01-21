"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, CheckCircle, Loader2, QrCode } from 'lucide-react'

export default function PaymentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registrationId = searchParams?.get('registrationId')
  const [processing, setProcessing] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [qrCode, setQrCode] = useState<string>('')
  const [checkInUrl, setCheckInUrl] = useState<string>('')
  const [registrationData, setRegistrationData] = useState<any>(null)
  const [showDummyPayment, setShowDummyPayment] = useState(true)
  const [dummyCardData, setDummyCardData] = useState({
    cardNumber: '4111 1111 1111 1111',
    expiryDate: '12/28',
    cvv: '123',
    cardholderName: 'John Doe'
  })

  useEffect(() => {
    // Load registration data
    const data = localStorage.getItem('pendingRegistration')
    if (data) {
      const parsedData = JSON.parse(data)
      setRegistrationData(parsedData)
      // Set QR code if already available from registration
      if (parsedData.qrCode) {
        setQrCode(parsedData.qrCode)
        setCheckInUrl(parsedData.checkInUrl)
      }
    }
  }, [])

  const handlePayment = async () => {
    setProcessing(true)

    const amount = registrationData?.dataJson?.finalAmount || 0

    // For free events (₹0), skip payment simulation
    if (amount === 0) {
      setTimeout(() => {
        const response = registrationData
        if (response) {
          setQrCode(response.qrCode)
          setCheckInUrl(response.checkInUrl)
          setPaymentComplete(true)
          localStorage.removeItem('pendingRegistration')
        }
        setProcessing(false)
      }, 500) // Quick processing for free events
    } else {
      // Simulate payment processing for paid events
      setTimeout(async () => {
        try {
          // Confirm payment with backend to update Order status
          await fetch(`/api/events/${params.id}/registrations/payment-confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              registrationId: registrationId || registrationData?.id,
              amount: amount,
              paymentMethod: showDummyPayment ? 'DEMO_CARD' : 'DEMO_UPI'
            })
          })

          const response = registrationData

          if (response) {
            setQrCode(response.qrCode)
            setCheckInUrl(response.checkInUrl)
            setPaymentComplete(true)

            // Clear pending registration
            localStorage.removeItem('pendingRegistration')
          }
        } catch (error) {
          console.error('Payment failed:', error)
          alert('Payment failed. Please try again.')
        } finally {
          setProcessing(false)
        }
      }, 2000)
    }
  }

  const downloadQRCode = async () => {
    if (!qrCode) return

    try {
      // QR code is already a data URL from the backend
      const link = document.createElement('a')
      link.href = qrCode
      link.download = `event-ticket-${registrationId || Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading QR code:', error)
      alert('Unable to download QR code. Please take a screenshot instead.')
    }
  }

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-center">
            <CheckCircle className="w-20 h-20 text-white mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
            <p className="text-green-100">Your registration is complete</p>
          </div>

          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Event Ticket</h2>
              <p className="text-gray-600">Show this QR code at the event entrance</p>
            </div>

            {/* QR Code Display */}
            <div className="flex justify-center mb-8">
              <div className="border-4 border-green-600 rounded-2xl p-6 bg-white shadow-lg">
                {qrCode ? (
                  <img
                    src={qrCode}
                    alt="Event Ticket QR Code"
                    className="w-64 h-64"
                  />
                ) : (
                  <div className="w-64 h-64 bg-gray-100 flex items-center justify-center rounded-lg">
                    <p className="text-gray-500 text-sm">QR Code not available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Registration Details */}
            {registrationData && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-lg mb-4">Registration Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">
                      {registrationData.dataJson?.firstName || registrationData.firstName || 'N/A'} {registrationData.dataJson?.lastName || registrationData.lastName || ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{registrationData.dataJson?.email || registrationData.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{registrationData.dataJson?.phone || registrationData.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{registrationData.type || 'General'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registration ID:</span>
                    <span className="font-medium">{registrationData.id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium">₹{((registrationData.dataJson?.finalAmount || 0) / 100).toFixed(2)}</span>
                  </div>
                </div>

                {/* Debug Info (for demo purposes) */}
                <details className="mt-4">
                  <summary className="text-xs text-gray-500 cursor-pointer">Debug Info (Demo)</summary>
                  <pre className="text-xs text-gray-400 mt-2 p-2 bg-gray-100 rounded overflow-auto">
                    {JSON.stringify(registrationData, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={downloadQRCode}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <QrCode className="w-5 h-5" />
                Download QR Code
              </button>

              <button
                onClick={() => router.push(`/events/${params.id}`)}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Back to Event
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>📧 Check your email:</strong> A confirmation email with your ticket has been sent to your email address.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center">
          <CreditCard className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            {(registrationData?.dataJson?.finalAmount || 0) === 0 ? 'Complete Registration' : 'Complete Payment'}
          </h1>
          <p className="text-indigo-100">
            {(registrationData?.dataJson?.finalAmount || 0) === 0 ? 'Confirm your free event registration' : 'Secure your event registration'}
          </p>
        </div>

        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Payment Summary</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {(() => {
                const ticketPrice = registrationData?.dataJson?.ticketPrice || registrationData?.dataJson?.finalAmount || 0
                const promoDiscount = registrationData?.dataJson?.promoCode
                  ? (ticketPrice - (registrationData?.dataJson?.finalAmount || ticketPrice))
                  : 0
                const subtotal = ticketPrice - promoDiscount

                // Calculate convenience fee (2.5% of subtotal)
                const convenienceFee = Math.round(subtotal * 0.025)

                // Calculate GST (18% of subtotal + convenience fee)
                const taxableAmount = subtotal + convenienceFee
                const gst = Math.round(taxableAmount * 0.18)

                // Final total
                const total = subtotal + convenienceFee + gst

                return (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Event Registration ({registrationData?.type || 'General'})</span>
                      <span className="font-semibold">₹{(ticketPrice / 100).toFixed(2)}</span>
                    </div>
                    {registrationData?.dataJson?.promoCode && (
                      <div className="flex justify-between text-green-600">
                        <span className="flex items-center gap-2">
                          <span className="text-xs bg-green-100 px-2 py-1 rounded font-mono">{registrationData.dataJson.promoCode}</span>
                          Promo Discount
                        </span>
                        <span className="font-semibold">-₹{(promoDiscount / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Convenience Fee (2.5%)</span>
                      <span className="font-semibold">₹{(convenienceFee / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">GST (18%)</span>
                      <span className="font-semibold">₹{(gst / 100).toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between text-lg">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-indigo-600">₹{(total / 100).toFixed(2)}</span>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>

          {(registrationData?.dataJson?.finalAmount || 0) > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3">Payment Method</h3>

              {/* Demo Methods Section */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-xs font-medium text-yellow-800">Demo Payment Methods</span>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center p-4 border-2 border-indigo-600 rounded-lg cursor-pointer bg-indigo-50">
                    <input
                      type="radio"
                      name="payment"
                      className="mr-3"
                      defaultChecked
                      onChange={() => setShowDummyPayment(true)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">💳 Credit/Debit Card (Demo)</div>
                      <div className="text-xs text-gray-500">Test with dummy card details - No real charges</div>
                    </div>
                  </label>
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300">
                    <input
                      type="radio"
                      name="payment"
                      className="mr-3"
                      onChange={() => setShowDummyPayment(false)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">📱 UPI (Demo)</div>
                      <div className="text-xs text-gray-500">Simulate UPI payment - Test mode</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Original Methods Section */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium text-green-800">Production Payment Methods</span>
                </div>
                <div className="space-y-2 opacity-60">
                  <div className="flex items-center p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      className="mr-3"
                      disabled
                    />
                    <div className="flex-1">
                      <div className="font-medium">💳 Stripe Payment Gateway</div>
                      <div className="text-xs text-gray-500">Secure card payments (Production only)</div>
                    </div>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Coming Soon</span>
                  </div>
                  <div className="flex items-center p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      className="mr-3"
                      disabled
                    />
                    <div className="flex-1">
                      <div className="font-medium">🏦 Razorpay Gateway</div>
                      <div className="text-xs text-gray-500">UPI, Cards, Net Banking (Production only)</div>
                    </div>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Coming Soon</span>
                  </div>
                  <div className="flex items-center p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      className="mr-3"
                      disabled
                    />
                    <div className="flex-1">
                      <div className="font-medium">💰 PayPal</div>
                      <div className="text-xs text-gray-500">International payments (Production only)</div>
                    </div>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Coming Soon</span>
                  </div>
                </div>
              </div>

              {/* Demo Payment Forms */}
              {showDummyPayment ? (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium text-yellow-800">Demo Card Payment Form</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Card Number</label>
                      <input
                        type="text"
                        value={dummyCardData.cardNumber}
                        onChange={(e) => setDummyCardData({ ...dummyCardData, cardNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label>
                        <input
                          type="text"
                          value={dummyCardData.expiryDate}
                          onChange={(e) => setDummyCardData({ ...dummyCardData, expiryDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="MM/YY"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">CVV</label>
                        <input
                          type="text"
                          value={dummyCardData.cvv}
                          onChange={(e) => setDummyCardData({ ...dummyCardData, cvv: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="123"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={dummyCardData.cardholderName}
                        onChange={(e) => setDummyCardData({ ...dummyCardData, cardholderName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                    <strong>Demo Mode:</strong> This is a test payment form. No real charges will be made.
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium text-yellow-800">Demo UPI Payment</span>
                  </div>

                  <div className="text-center space-y-4">
                    <div className="text-6xl">📱</div>
                    <div>
                      <p className="font-medium text-gray-900">Scan QR Code with UPI App</p>
                      <p className="text-sm text-gray-600">Or use UPI ID: demo@paytm</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-4xl">🔲</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Demo UPI QR Code</p>
                    </div>

                    <div className="text-xs text-gray-600 space-y-1">
                      <p><strong>Amount:</strong> ₹{((registrationData?.dataJson?.finalAmount || 0) / 100).toFixed(2)}</p>
                      <p><strong>Merchant:</strong> Event Planner Demo</p>
                      <p><strong>Reference:</strong> REG-{registrationId}</p>
                    </div>
                  </div>

                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                    <strong>Demo Mode:</strong> This is a simulated UPI payment. No real transaction will occur.
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {(registrationData?.dataJson?.finalAmount || 0) === 0 ? 'Confirming Registration...' : 'Processing Payment...'}
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                {(registrationData?.dataJson?.finalAmount || 0) === 0
                  ? 'Confirm Free Registration'
                  : `Pay ₹${((registrationData?.dataJson?.finalAmount || 0) / 100).toFixed(2)}`
                }
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            🔒 Your payment is secure and encrypted
          </p>
        </div>
      </div>
    </div>
  )
}
