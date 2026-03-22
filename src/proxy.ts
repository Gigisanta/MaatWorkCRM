import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
  const start = Date.now()

  // Logging de request
  console.log(JSON.stringify({
    level: 'info',
    msg: 'request_start',
    method: request.method,
    path: request.nextUrl.pathname,
    requestId,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || 'unknown'
  }))

  // Headers de response con timing
  const response = NextResponse.next()
  response.headers.set('x-request-id', requestId)
  response.headers.set('x-response-time', String(Date.now() - start))

  return response
}

export const config = { matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'] }
