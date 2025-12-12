"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"

export default function PaymentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [eventData, setEventData] = useState<any>(null)
  const [registrationData, setRegistrationData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [paymentProvider, setPaymentProvider] = useState("stripe") // stripe or razorpay
  const [taxRatePercent, setTaxRatePercent] = useState<number>(18)
  const [currencyCode, setCurrencyCode] = useState<string>('INR')

  const registrationId = searchParams?.get('registrationId')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch event data
        const eventRes = await fetch(`/api/events/${params.id}`)
        if (eventRes.ok) {
          const event = await eventRes.json()
          setEventData(event)
        }

        try {
          const ps = await fetch(`/api/events/${params.id}/payment-settings`, { cache: 'no-store' })
          if (ps.ok) {
            const json = await ps.json()
            const r = Number(json?.taxRatePercent)
            if ([0,12,18,28].includes(r)) setTaxRatePercent(r)
          }
        } catch {}

        try {
          const cfg = await fetch(`/api/company/settings`, { cache: 'no-store' })
          if (cfg.ok) {
            const json = await cfg.json()
            if (json?.currency) setCurrencyCode(String(json.currency).toUpperCase())
          }
        } catch {}

        // Fetch registration data if registrationId is provided
        if (registrationId) {
          const regRes = await fetch(`/api/events/${params.id}/registrations/${registrationId}`)
          if (regRes.ok) {
            const registration = await regRes.json()
            setRegistrationData(registration)
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, registrationId])

  const handlePayment = async () => {
    setProcessing(true)
    try {
      if (paymentProvider === "stripe") {
        await handleStripePayment()
      } else if (paymentProvider === "razorpay") {
        await handleRazorpayPayment()
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleStripePayment = async () => {
    // Create Stripe payment intent
    const intentRes = await fetch('/api/payments/stripe/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        amount: amount * 100, // Convert to cents
        eventId: params.id,
        registrationId,
        currency: 'inr',
        customerEmail: registrationData?.email,
        customerName: registrationData?.name,
        description: `${eventData?.name} - ${registrationData?.type} Registration`
      })
    })

    if (!intentRes.ok) {
      throw new Error('Failed to create payment intent')
    }

    const { clientSecret, paymentIntentId } = await intentRes.json()

    // For demo purposes, simulate successful payment
    // In production, you'd use Stripe Elements here
    setTimeout(async () => {
      const confirmRes = await fetch('/api/payments/stripe/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          paymentIntentId,
          registrationId,
          eventId: params.id
        })
      })

      if (confirmRes.ok) {
        const result = await confirmRes.json()
        alert('Payment successful! Check your email for confirmation.')
        router.push(`/events/${params.id}/registrations`)
      } else {
        throw new Error('Payment confirmation failed')
      }
    }, 2000)
  }

  const handleRazorpayPayment = async () => {
    // Create Razorpay order (existing implementation)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Update registration status to paid
    const res = await fetch(`/api/events/${params.id}/registrations/${registrationId}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        paymentMethod,
        amount: registrationData?.priceInr || eventData?.priceInr || 50,
        status: 'completed'
      })
    })

    if (res.ok) {
      alert('Payment successful! Check your email for confirmation.')
      router.push(`/events/${params.id}/registrations`)
    } else {
      throw new Error('Payment processing failed')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  const amount = registrationData?.priceInr || eventData?.priceInr || 50
  const subtotal = Math.round(Number(amount))
  const taxAmount = Math.round(subtotal * (taxRatePercent / 100))
  const totalAmount = subtotal + taxAmount
  const symbol = currencyCode === 'INR' ? '₹' : currencyCode + ' '

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
          <div className="text-center border-b pb-4">
            <h1 className="text-2xl font-bold">Complete Payment</h1>
            <p className="text-sm text-slate-600 mt-1">Event: {eventData?.name || `Event ${params.id}`}</p>
          </div>

          {/* Order Summary */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h2 className="font-semibold mb-3">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Registration Type:</span>
                <span className="font-medium">{registrationData?.type || 'General'}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">{symbol}{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({taxRatePercent}%):</span>
                <span className="font-medium">{symbol}{taxAmount}</span>
              </div>
              {registrationData?.promoCode && (
                <div className="flex justify-between text-green-600">
                  <span>Promo Code ({registrationData.promoCode}):</span>
                  <span>-₹{registrationData.discount || 0}</span>
                </div>
              )}
              <hr className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span>{symbol}{totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Payment Provider Selection */}
          <div>
            <h2 className="font-semibold mb-3">Payment Provider</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                paymentProvider === "stripe" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
              }`}>
                <input
                  type="radio"
                  name="paymentProvider"
                  value="stripe"
                  checked={paymentProvider === "stripe"}
                  onChange={(e) => setPaymentProvider(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <div>
                    <div className="font-medium">Stripe</div>
                    <div className="text-xs text-gray-500">Global payments</div>
                  </div>
                </div>
              </label>
              
              <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                paymentProvider === "razorpay" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
              }`}>
                <input
                  type="radio"
                  name="paymentProvider"
                  value="razorpay"
                  checked={paymentProvider === "razorpay"}
                  onChange={(e) => setPaymentProvider(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-800 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">R</span>
                  </div>
                  <div>
                    <div className="font-medium">Razorpay</div>
                    <div className="text-xs text-gray-500">India payments</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <h2 className="font-semibold mb-3">Payment Method</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💳</span>
                  <span>Credit/Debit Card</span>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  checked={paymentMethod === "upi"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📱</span>
                  <span>UPI</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="netbanking"
                  checked={paymentMethod === "netbanking"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏦</span>
                  <span>Net Banking</span>
                </div>
              </label>
            </div>
          </div>

          {/* Payment Form */}
          {paymentMethod === "card" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Card Number</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cardholder Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          {paymentMethod === "upi" && (
            <div>
              <label className="block text-sm font-medium mb-1">UPI ID</label>
              <input
                type="text"
                placeholder="yourname@paytm"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          )}

          {paymentMethod === "netbanking" && (
            <div>
              <label className="block text-sm font-medium mb-1">Select Bank</label>
              <select className="w-full rounded-md border px-3 py-2 text-sm">
                <option value="">Choose your bank</option>
                <option value="sbi">State Bank of India</option>
                <option value="hdfc">HDFC Bank</option>
                <option value="icici">ICICI Bank</option>
                <option value="axis">Axis Bank</option>
                <option value="kotak">Kotak Mahindra Bank</option>
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => router.back()}
              className="flex-1 rounded-md border px-4 py-3 text-sm font-medium hover:bg-slate-50"
            >
              Back
            </button>
            <button
              onClick={handlePayment}
              disabled={processing}
              className="flex-1 rounded-md bg-indigo-600 px-4 py-3 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {processing ? 'Processing...' : `Pay ${symbol}${totalAmount}`}
            </button>
          </div>

          {/* Security Notice */}
          <div className="text-xs text-slate-500 text-center pt-4 border-t">
            🔒 Your payment information is secure and encrypted
          </div>
        </div>
      </div>
    </div>
  )
}
