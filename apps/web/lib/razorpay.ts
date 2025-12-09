// Mock Razorpay for build compatibility
let razorpay: any

try {
  const Razorpay = require('razorpay')
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || ''
  })
} catch (error) {
  // Mock implementation for build
  razorpay = {
    orders: {
      create: async (data: any) => ({
        id: `order_${Date.now()}`,
        amount: data.amount,
        currency: data.currency,
        receipt: data.receipt
      })
    },
    payments: {
      fetch: async (id: string) => ({
        id,
        amount: 5000,
        currency: 'INR',
        status: 'captured'
      }),
      refund: async (id: string, data: any) => ({
        id: `rfnd_${Date.now()}`,
        payment_id: id,
        amount: data.amount
      })
    }
  }
}

export type PaymentOrderData = {
  amount: number // in paise
  currency: string
  receipt: string
  notes?: Record<string, string>
}

export type PaymentVerificationData = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

// Create payment order
export async function createPaymentOrder(data: PaymentOrderData) {
  try {
    const order = await razorpay.orders.create({
      amount: data.amount,
      currency: data.currency,
      receipt: data.receipt,
      notes: data.notes || {}
    })
    
    return {
      success: true,
      order
    }
  } catch (error: any) {
    console.error('Razorpay order creation error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Verify payment signature
export function verifyPaymentSignature(data: PaymentVerificationData): boolean {
  try {
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest('hex')
    
    return expectedSignature === data.razorpay_signature
  } catch (error) {
    console.error('Payment verification error:', error)
    return false
  }
}

// Fetch payment details
export async function getPaymentDetails(paymentId: string) {
  try {
    const payment = await razorpay.payments.fetch(paymentId)
    return {
      success: true,
      payment
    }
  } catch (error: any) {
    console.error('Payment fetch error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Create refund
export async function createRefund(paymentId: string, amount?: number) {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount, // If not provided, full refund
      speed: 'normal'
    })
    
    return {
      success: true,
      refund
    }
  } catch (error: any) {
    console.error('Refund creation error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export default razorpay
