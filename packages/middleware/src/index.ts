import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { ZodSchema } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import type { JWTPayload, UserRole } from '@apex/shared'

const ACCESS_SECRET = process.env['JWT_ACCESS_SECRET'] ?? 'dev-access-secret-replace-in-production'

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
      requestId?: string
    }
  }
}

// ── JWT verification ──────────────────────────────────────────────────────────

export function verifyJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json(err401('Missing or invalid Authorization header'))
    return
  }
  try {
    req.user = jwt.verify(authHeader.slice(7), ACCESS_SECRET) as JWTPayload
    next()
  } catch (e) {
    const msg = e instanceof jwt.TokenExpiredError ? 'Token expired' : 'Invalid token'
    res.status(401).json(err401(msg))
  }
}

// ── RBAC ──────────────────────────────────────────────────────────────────────

export function checkRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) { res.status(401).json(err401('Unauthenticated')); return }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        header: { status: 'ERROR', code: '403', message: `Required roles: ${roles.join(', ')}` },
        body: null,
      })
      return
    }
    next()
  }
}

// ── Validation ────────────────────────────────────────────────────────────────

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({ header: { status: 'ERROR', code: '400', message: 'Validation failed' }, body: result.error.flatten() })
      return
    }
    req.body = result.data
    next()
  }
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      res.status(400).json({ header: { status: 'ERROR', code: '400', message: 'Invalid query params' }, body: result.error.flatten() })
      return
    }
    req.query = result.data as typeof req.query
    next()
  }
}

// ── Async wrapper ─────────────────────────────────────────────────────────────

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next)
}

// ── Request ID ────────────────────────────────────────────────────────────────

export function attachRequestId(req: Request, _res: Response, next: NextFunction): void {
  req.requestId = (req.headers['x-request-id'] as string | undefined) ?? uuidv4()
  req.headers['x-request-id'] = req.requestId
  next()
}

// ── Standard responses ────────────────────────────────────────────────────────

export function success<T>(res: Response, body: T, code = 200, message = 'OK', requestId?: string) {
  res.status(code).json({
    header: { status: 'SUCCESS', code: String(code), message, requestId: requestId ?? '', timestamp: new Date().toISOString() },
    body,
  })
}

export function paginated<T>(res: Response, items: T[], pagination: { page: number; limit: number; total: number }, requestId?: string) {
  res.json({
    header: { status: 'SUCCESS', code: '200', message: 'OK', requestId: requestId ?? '', timestamp: new Date().toISOString() },
    body: { items, pagination: { ...pagination, totalPages: Math.ceil(pagination.total / pagination.limit) } },
  })
}

// ── Central error handler ─────────────────────────────────────────────────────

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err.name === 'ZodError') {
    res.status(400).json({ header: { status: 'ERROR', code: '400', message: 'Validation failed' }, body: err })
    return
  }
  const statusMap: Record<string, number> = {
    NOT_FOUND: 404, UNAUTHORIZED: 401, FORBIDDEN: 403,
    CONFLICT: 409, UNPROCESSABLE: 422, SERVICE_UNAVAILABLE: 503,
  }
  const code = statusMap[err.message] ?? 500
  res.status(code).json({ header: { status: 'ERROR', code: String(code), message: err.message }, body: null })
}

// Helpers
function err401(message: string) {
  return { header: { status: 'ERROR', code: '401', message }, body: null }
}
