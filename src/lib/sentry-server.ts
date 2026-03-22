// Sentry is not installed - these are no-op stubs
// To enable Sentry: npm install @sentry/nextjs

export function captureServerError(error: unknown, context: Record<string, unknown>) {
  console.error('Server error:', error, context)
}

export function addServerTag(key: string, value: string) {
  // No-op when Sentry is not installed
}

export function addServerUser(userId: string, email?: string) {
  // No-op when Sentry is not installed
}
