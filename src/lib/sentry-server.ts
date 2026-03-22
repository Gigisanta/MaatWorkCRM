import * as Sentry from '@sentry/nextjs'

export function captureServerError(error: unknown, context: Record<string, unknown>) {
  Sentry.captureException(error, { extra: context })
}

export function addServerTag(key: string, value: string) {
  Sentry.setTag(key, value)
}

export function addServerUser(userId: string, email?: string) {
  Sentry.setUser({ id: userId, email })
}
