"use client"
import { useState } from 'react'
import { CreditCard, Lock } from 'lucide-react'

interface StripePaymentFormProps {
  amount: number
  currency?: string
  onSuccess?: (paymentIntentId: string) => void
  onError?: (error: string) => void
}

export default function StripePaymentForm({ 
  amount, 
  currency = 'inr',
  onSuccess,
  onError 
}: StripePaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency })
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      console.log('✅ Payment Intent Created:', data.paymentIntentId)
      onSuccess?.(data.paymentIntentId)
    } catch (error: any) {
      console.error('❌ Payment failed:', error)
      onError?.(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800 font-medium">🧪 Test Mode</p>
        <p className="text-xs text-blue-600 mt-1">
          Use card: <code className="bg-blue-100 px-2 py-1 rounded">4242 4242 4242 4242</code>
        </p>
        <p className="text-xs text-blue-600">Any future date, any CVC</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Card Number</label>
        <div className="relative">
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim())}
            placeholder="4242 4242 4242 4242"
            maxLength={19}
            className="w-full px-4 py-2 border rounded-lg pl-10"
            required
          />
          <CreditCard className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Expiry Date</label>
          <input
            type="text"
            value={expiry}
            onChange={(e) => {
              let val = e.target.value.replace(/\D/g, '')
              if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2, 4)
              setExpiry(val)
            }}
            placeholder="MM/YY"
            maxLength={5}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">CVC</label>
          <input
            type="text"
            value={cvc}
            onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
            placeholder="123"
            maxLength={4}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Lock className="w-4 h-4" />
        {loading ? 'Processing...' : `Pay ₹${amount.toFixed(2)}`}
      </button>

      <p className="text-xs text-gray-500 text-center">
        🔒 Secured by Stripe • Test mode enabled
      </p>
    </form>
  )
}
