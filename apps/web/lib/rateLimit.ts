import { NextRequest, NextResponse } from 'next/server'

// In-memory store for rate limiting
// In a production environment, consider using Redis or similar for distributed rate limiting
const rateLimits = new Map<string, { tokens: number; lastRefill: number }>()

// Configuration
const RATE_LIMIT = {
  WINDOW_MS: 60 * 1000, // 1 minute
  MAX_REQUESTS: 5, // Maximum requests per window
  TOKEN_REFILL_RATE: 1, // Tokens refilled per second
  BURST_TOKENS: 5, // Maximum burst capacity
}

/**
 * Rate limiting middleware using token bucket algorithm
 * @param request The incoming request
 * @param identifier A unique identifier for the client (e.g., IP, API key, user ID)
 * @param options Custom rate limiting options (optional)
 * @returns NextResponse with 429 status if rate limited, or void if allowed
 */
export async function rateLimit(
  request: NextRequest,
  identifier: string,
  options?: {
    windowMs?: number
    maxRequests?: number
    tokenRefillRate?: number
    burstTokens?: number
  }
): Promise<NextResponse | void> {
  const config = {
    windowMs: options?.windowMs ?? RATE_LIMIT.WINDOW_MS,
    maxRequests: options?.maxRequests ?? RATE_LIMIT.MAX_REQUESTS,
    tokenRefillRate: options?.tokenRefillRate ?? RATE_LIMIT.TOKEN_REFILL_RATE,
    burstTokens: options?.burstTokens ?? RATE_LIMIT.BURST_TOKENS,
  }

  // Get client's rate limit state or initialize
  const now = Date.now()
  let client = rateLimits.get(identifier)

  if (!client) {
    client = {
      tokens: config.burstTokens,
      lastRefill: now,
    }
    rateLimits.set(identifier, client)
  }

  // Calculate time since last refill
  const timeElapsed = now - client.lastRefill
  const tokensToAdd = Math.floor((timeElapsed / 1000) * config.tokenRefillRate)

  // Refill tokens, but don't exceed burst capacity
  if (tokensToAdd > 0) {
    client.tokens = Math.min(
      client.tokens + tokensToAdd,
      config.burstTokens
    )
    client.lastRefill = now
  }

  // Check if request is allowed
  if (client.tokens < 1) {
    // Calculate retry-after time
    const tokensNeeded = 1 - client.tokens
    const secondsToWait = Math.ceil(tokensNeeded / config.tokenRefillRate)
    
    return new NextResponse(
      JSON.stringify({
        message: `Too many requests, please try again in ${secondsToWait} seconds`,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': secondsToWait.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': Math.max(0, client.tokens - 1).toString(),
          'X-RateLimit-Reset': Math.ceil((now + (secondsToWait * 1000)) / 1000).toString(),
        },
      }
    )
  }

  // Consume a token
  client.tokens -= 1
  rateLimits.set(identifier, client)

  // For app route handlers, we can't modify the response directly
  // Instead, we'll just return undefined to indicate the request is allowed
  return
}

/**
 * Get client identifier from request (IP by default)
 */
export function getClientIdentifier(request: NextRequest): string {
  // In production, you might want to use a more sophisticated method
  // to identify clients, such as API keys or user IDs for authenticated users
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  return ip
}

/**
 * Middleware for rate limiting API routes
 */
export async function withRateLimit(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  options?: {
    windowMs?: number
    maxRequests?: number
    tokenRefillRate?: number
    burstTokens?: number
  }
): Promise<NextResponse> {
  const identifier = getClientIdentifier(request)
  const rateLimited = await rateLimit(request, identifier, options)
  
  if (rateLimited) {
    return rateLimited
  }
  
  return handler(request)
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  const windowMs = RATE_LIMIT.WINDOW_MS * 2 // Keep entries for 2x the window size
  
  for (const [key, value] of rateLimits.entries()) {
    if (now - value.lastRefill > windowMs) {
      rateLimits.delete(key)
    }
  }
}, RATE_LIMIT.WINDOW_MS * 1000)
