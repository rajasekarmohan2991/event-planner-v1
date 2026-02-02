// Stripe integration for Event Planner
let Stripe: any

try {
  Stripe = require('stripe')
} catch (error) {
  console.warn('Stripe not installed, using mock implementation')
}

// Initialize Stripe
const stripe = Stripe ? new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
}) : null

export type StripePaymentIntentData = {
  amount: number // in cents
  currency: string
  description?: string
  metadata?: Record<string, string>
  customer?: string
}

export type StripeCustomerData = {
  email: string
  name?: string
  phone?: string
  metadata?: Record<string, string>
}

// Create payment intent
export async function createPaymentIntent(data: StripePaymentIntentData) {
  try {
    if (!stripe) {
      // Mock response for development
      return {
        success: true,
        paymentIntent: {
          id: `pi_mock_${Date.now()}`,
          client_secret: `pi_mock_${Date.now()}_secret_mock`,
          amount: data.amount,
          currency: data.currency,
          status: 'requires_payment_method'
        }
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount),
      currency: data.currency,
      description: data.description,
      metadata: data.metadata || {},
      customer: data.customer,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return {
      success: true,
      paymentIntent
    }
  } catch (error: any) {
    console.error('Stripe payment intent creation error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Create customer
export async function createCustomer(data: StripeCustomerData) {
  try {
    if (!stripe) {
      // Mock response for development
      return {
        success: true,
        customer: {
          id: `cus_mock_${Date.now()}`,
          email: data.email,
          name: data.name
        }
      }
    }

    const customer = await stripe.customers.create({
      email: data.email,
      name: data.name,
      phone: data.phone,
      metadata: data.metadata || {}
    })

    return {
      success: true,
      customer
    }
  } catch (error: any) {
    console.error('Stripe customer creation error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Retrieve payment intent
export async function retrievePaymentIntent(paymentIntentId: string) {
  try {
    if (!stripe) {
      // Mock response for development
      return {
        success: true,
        paymentIntent: {
          id: paymentIntentId,
          status: 'succeeded',
          amount: 5000,
          currency: 'inr'
        }
      }
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    return {
      success: true,
      paymentIntent
    }
  } catch (error: any) {
    console.error('Stripe payment intent retrieval error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Create refund
export async function createRefund(paymentIntentId: string, amount?: number) {
  try {
    if (!stripe) {
      // Mock response for development
      return {
        success: true,
        refund: {
          id: `re_mock_${Date.now()}`,
          payment_intent: paymentIntentId,
          amount: amount || 5000,
          status: 'succeeded'
        }
      }
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount, // If not provided, full refund
    })

    return {
      success: true,
      refund
    }
  } catch (error: any) {
    console.error('Stripe refund creation error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Construct webhook event
export function constructWebhookEvent(payload: string, signature: string) {
  try {
    if (!stripe) {
      throw new Error('Stripe not available')
    }

    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!endpointSecret) {
      throw new Error('Stripe webhook secret not configured')
    }

    const event = stripe.webhooks.constructEvent(payload, signature, endpointSecret)
    return {
      success: true,
      event
    }
  } catch (error: any) {
    console.error('Stripe webhook construction error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export default stripe
