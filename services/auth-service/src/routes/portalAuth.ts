import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../middleware/jwt.js'

const ACCESS_SECRET = process.env['JWT_ACCESS_SECRET'] ?? 'dev-access-secret'
const ACCESS_EXPIRES = process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m'
const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 30

const PortalLoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

export function portalAuthRouter(prisma: PrismaClient): Router {
  const router = Router()

  // POST /api/v1/portal/auth/login
  router.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = PortalLoginSchema.parse(req.body)

    const portalUser = await prisma.portalUser.findFirst({
      where: { email, isActive: true },
      include: { customer: { select: { fullName: true, customerId: true, kycStatus: true } } },
    })

    if (!portalUser) {
      res.status(401).json({ header: { status: 'ERROR', code: '401', message: 'Invalid email or password' }, body: null })
      return
    }

    // Check lockout
    if (portalUser.lockedUntil && portalUser.lockedUntil > new Date()) {
      const mins = Math.ceil((portalUser.lockedUntil.getTime() - Date.now()) / 60_000)
      res.status(401).json({ header: { status: 'ERROR', code: '401', message: `Account locked. Try again in ${mins} minutes` }, body: null })
      return
    }

    const valid = await bcrypt.compare(password, portalUser.passwordHash)

    if (!valid) {
      const attempts = (portalUser.failedAttempts ?? 0) + 1
      const updates: Record<string, unknown> = { failedAttempts: attempts }
      if (attempts >= MAX_ATTEMPTS) {
        updates['lockedUntil'] = new Date(Date.now() + LOCKOUT_MINUTES * 60_000)
      }
      await prisma.portalUser.update({ where: { id: portalUser.id }, data: updates })
      res.status(401).json({ header: { status: 'ERROR', code: '401', message: 'Invalid email or password' }, body: null })
      return
    }

    await prisma.portalUser.update({
      where: { id: portalUser.id },
      data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    })

    const payload = {
      sub:        portalUser.id,
      tenantId:   portalUser.tenantId,
      role:       'CUSTOMER' as const,
      email:      portalUser.email,
      name:       portalUser.customer?.fullName ?? portalUser.email,
      customerId: portalUser.customerId,
      kycStatus:  portalUser.customer?.kycStatus ?? 'PENDING',
    }

    const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES } as Parameters<typeof jwt.sign>[2])

    res.json({
      header: { status: 'SUCCESS', code: '200', message: 'Login successful', requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() },
      body: {
        accessToken,
        user: {
          id:         portalUser.id,
          name:       payload.name,
          email:      portalUser.email,
          customerId: portalUser.customerId,
          kycStatus:  payload.kycStatus,
        },
      },
    })
  }))

  // POST /api/v1/portal/auth/logout
  router.post('/logout', (_req, res) => {
    res.json({ header: { status: 'SUCCESS', code: '200', message: 'Logged out', requestId: '', timestamp: new Date().toISOString() }, body: null })
  })

  return router
}
