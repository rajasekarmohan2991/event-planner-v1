// Optional Stripe integration without bundling the 'stripe' package unless present.
// We intentionally avoid a top-level import to prevent build failures when Stripe is not installed.
let stripeInstance: any | null = null
let StripeCtor: any | null = null

export function getStripe(): any | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  try {
    if (!StripeCtor) {
      // Avoid static analysis bundling when stripe is not installed
      // eslint-disable-next-line no-eval
      const req: any = eval('require')
      StripeCtor = req?.('stripe')
    }
    if (!stripeInstance && StripeCtor) {
      stripeInstance = new StripeCtor(key, { apiVersion: '2024-06-20' })
    }
  } catch {
    return null
  }
  return stripeInstance
}

export const PRICE_IDS = {
  pro: process.env.STRIPE_PRICE_PRO || '',
  business: process.env.STRIPE_PRICE_BUSINESS || '',
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}
