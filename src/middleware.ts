import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute for DNB employees
const RATE_LIMIT_MAX_REQUESTS_PUBLIC = 10; // 10 requests per minute for public users

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

function getRateLimitKey(request: NextRequest): string {
  // Use session ID for rate limiting (not IP, since DNB employees share IPs)
  const sessionId = request.cookies.get('session_id')?.value;
  
  if (sessionId) {
    return `session:${sessionId}`;
  }
  
  // Fallback to IP for users without session
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return `ip:${ip}`;
}

function checkRateLimit(key: string, isDNBNetwork: boolean): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const limit = isDNBNetwork ? RATE_LIMIT_MAX_REQUESTS : RATE_LIMIT_MAX_REQUESTS_PUBLIC;
  
  const current = rateLimitStore.get(key);
  
  if (!current || current.resetTime < now) {
    // Start new window
    const resetTime = now + RATE_LIMIT_WINDOW_MS;
    rateLimitStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: limit - 1, resetTime };
  }
  
  if (current.count >= limit) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetTime: current.resetTime };
  }
  
  // Increment count
  current.count++;
  rateLimitStore.set(key, current);
  return { allowed: true, remaining: limit - current.count, resetTime: current.resetTime };
}

function isDNBNetwork(request: NextRequest): boolean {
  // Check if request is from DNB network
  // In production, this would check against actual DNB IP ranges
  const dnbCookie = request.cookies.get('dnb_employee');
  const referer = request.headers.get('referer');
  const userAgent = request.headers.get('user-agent');
  
  // Simple checks for DNB network (enhance in production)
  if (dnbCookie?.value === 'true') return true;
  if (referer?.includes('dnb.no')) return true;
  if (userAgent?.includes('DNB-Internal')) return true;
  
  return false;
}

export function middleware(request: NextRequest) {
  // No locale redirects needed anymore - all routes serve root page

  // Only apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Skip rate limiting for GET requests to status endpoints
    if (request.method === 'GET' && request.nextUrl.pathname.match(/\/(status|health|models)$/)) {
      return NextResponse.next();
    }
    
    const rateLimitKey = getRateLimitKey(request);
    const isDNB = isDNBNetwork(request);
    const { allowed, remaining, resetTime } = checkRateLimit(rateLimitKey, isDNB);
    
    if (!allowed) {
      // Rate limit exceeded
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: isDNB 
            ? 'For mange forespørsler. Vent et minutt før du prøver igjen.' 
            : 'Too many requests. Please wait a minute before trying again.',
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(isDNB ? RATE_LIMIT_MAX_REQUESTS : RATE_LIMIT_MAX_REQUESTS_PUBLIC),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': new Date(resetTime).toISOString(),
            'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000))
          }
        }
      );
    }
    
    // Add rate limit headers to response
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(isDNB ? RATE_LIMIT_MAX_REQUESTS : RATE_LIMIT_MAX_REQUESTS_PUBLIC));
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());
    
    // Set session cookie if not present
    if (!request.cookies.get('session_id')) {
      const sessionId = crypto.randomUUID();
      response.cookies.set('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 // 24 hours
      });
    }
    
    return response;
  }
  
  // Apply CSP headers for security
  const response = NextResponse.next();
  
  // Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https:;
    font-src 'self' data:;
    worker-src 'self' blob:;
    connect-src 'self' https://openrouter.ai https://api.dnb.no https://cdn.jsdelivr.net https://tessdata.projectnaptha.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s{2,}/g, ' ').trim();
  
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Add DNB security headers
  response.headers.set('X-DNB-Security', 'enabled');
  response.headers.set('X-Fraud-Detection', 'active');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};