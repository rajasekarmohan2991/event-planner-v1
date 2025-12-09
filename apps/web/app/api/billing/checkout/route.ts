import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { plan } = await req.json()
  
  // Mock checkout URL for demo
  const checkoutUrl = `/settings/billing?upgraded=${plan}`
  
  return NextResponse.json({ 
    success: true, 
    checkoutUrl,
    message: `Upgrading to ${plan} plan` 
  })
}
