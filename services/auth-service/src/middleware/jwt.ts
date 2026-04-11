import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { JWTPayload, UserRole } from '@apex/shared'

const ACCESS_SECRET = process.env['JWT_ACCESS_SECRET'] ?? 'dev-access-secret-replace-in-production'

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

export function verifyJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      header: { status: 'ERROR', code: '401', message: 'Missing or invalid Authorization header' },
      body: null,
    })
    return
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, ACCESS_SECRET) as JWTPayload
    req.user = payload
    next()
  } catch (err) {
    const message = err instanceof jwt.TokenExpiredError ? 'Token expired' : 'Invalid token'
    res.status(401).json({
      header: { status: 'ERROR', code: '401', message },
      body: null,
    })
  }
}

export function checkRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ header: { status: 'ERROR', code: '401', message: 'Unauthenticated' }, body: null })
      return
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        header: { status: 'ERROR', code: '403', message: `Access denied. Required roles: ${roles.join(', ')}` },
        body: null,
      })
      return
    }
    next()
  }
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}
