import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRateLimiter } from '@/lib/security/rateLimiter';

/**
 * Get rate limiting key from request
 * Prefers session ID over IP address for more accurate tracking
 */
function getRateLimitKey(request: NextRequest): string {
  // Use session ID for rate limiting
  const sessionId = request.cookies.get('session_id')?.value;

  if (sessionId) {
    return `session:${sessionId}`;
  }

  // Fallback to IP for users without session
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return `ip:${ip}`;
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
    const rateLimiter = getRateLimiter();

    // Check rate limits
    const result = rateLimiter.checkLimit(rateLimitKey);

    if (!result.allowed) {
      // Determine which limit was violated
      const violated = result.violated || 'minute';
      const retryAfter = Math.ceil((result.resetTime[violated] - Date.now()) / 1000);

      // Construct user-friendly error message
      const limitMessages = {
        minute: 'For mange forespørsler. Vent litt før du prøver igjen.',
        hour: 'For mange forespørsler. Prøv igjen senere.',
        day: 'Daglig grense nådd. Prøv igjen i morgen.'
      };

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: limitMessages[violated],
          retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter)
          }
        }
      );
    }

    // Create response and set session cookie if not present
    const response = NextResponse.next();

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