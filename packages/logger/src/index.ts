import winston from 'winston'

const { combine, timestamp, json, colorize, simple, errors } = winston.format

const isDev = process.env['NODE_ENV'] !== 'production'

export const createLogger = (service: string) =>
  winston.createLogger({
    level: process.env['LOG_LEVEL'] ?? 'info',
    defaultMeta: { service },
    format: combine(
      errors({ stack: true }),
      timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
      isDev
        ? combine(colorize(), simple())
        : json()
    ),
    transports: [
      new winston.transports.Console(),
    ],
  })

export type Logger = ReturnType<typeof createLogger>

// Redact sensitive fields before logging
export function redact(obj: Record<string, unknown>): Record<string, unknown> {
  const SENSITIVE = new Set(['password', 'token', 'secret', 'pan', 'aadhaar', 'nationalId', 'cvv'])
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) =>
      SENSITIVE.has(k.toLowerCase()) ? [k, '[REDACTED]'] : [k, v]
    )
  )
}
