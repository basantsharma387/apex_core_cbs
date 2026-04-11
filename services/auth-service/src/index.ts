import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'
import { createLogger } from '@apex/logger'
import { AuthService } from './services/authService.js'
import { authRouter } from './routes/auth.js'
import { portalAuthRouter } from './routes/portalAuth.js'
import { verifyJWT, asyncHandler } from './middleware/jwt.js'

const logger = createLogger('auth-service')
const PORT = process.env['AUTH_SERVICE_PORT'] ?? 3001

const prisma = new PrismaClient()
const redis  = new Redis(process.env['REDIS_URL'] ?? 'redis://localhost:6379')
const authService = new AuthService(prisma, redis)

const app = express()

app.use(helmet())
app.use(cors({
  origin: (process.env['CORS_ORIGINS'] ?? 'http://localhost:5173,http://localhost:5174').split(','),
  credentials: true,
}))
app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())
app.use(morgan('combined'))

app.use(rateLimit({ windowMs: 60_000, max: 100 }))

// Health
app.get('/health', (_req, res) => {
  res.json({ status: 'UP', service: 'auth-service', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/v1/auth', authRouter(authService))
app.use('/api/v1/portal/auth', portalAuthRouter(prisma))

// ── Portal profile & password ─────────────────────────────────────────────────

app.patch('/api/v1/portal/profile', verifyJWT, asyncHandler(async (req, res) => {
  const body = z.object({ fullName: z.string().min(2).optional(), phone: z.string().optional(), address: z.string().optional() }).parse(req.body)
  const user = await prisma.portalUser.update({ where: { id: req.user!.sub }, data: body })
  res.json({ header: { status: 'SUCCESS', code: '200', message: 'Profile updated', requestId: '', timestamp: new Date().toISOString() }, body: user })
}))

app.post('/api/v1/portal/change-password', verifyJWT, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = z.object({ currentPassword: z.string(), newPassword: z.string().min(8) }).parse(req.body)
  const user = await prisma.portalUser.findUnique({ where: { id: req.user!.sub } })
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    res.status(401).json({ header: { status: 'ERROR', code: '401', message: 'Incorrect current password' }, body: null })
    return
  }
  const hash = await bcrypt.hash(newPassword, 12)
  await prisma.portalUser.update({ where: { id: user.id }, data: { passwordHash: hash } })
  res.json({ header: { status: 'SUCCESS', code: '200', message: 'Password changed', requestId: '', timestamp: new Date().toISOString() }, body: null })
}))

// ── Staff profile & password ─────────────────────────────────────────────────

app.get('/api/v1/auth/tenant', verifyJWT, asyncHandler(async (req, res) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: req.user!.tenantId } })
  if (!tenant) { res.status(404).json({ header: { status: 'ERROR', code: '404', message: 'Tenant not found' }, body: null }); return }
  res.json({
    header: { status: 'SUCCESS', code: '200', message: 'OK', requestId: '', timestamp: new Date().toISOString() },
    body: {
      id: tenant.id,
      name: tenant.name,
      code: tenant.code,
      region: tenant.country,
      dataResidency: tenant.country,
      plan: 'Enterprise',
      createdAt: tenant.createdAt,
    },
  })
}))

app.patch('/api/v1/auth/profile', verifyJWT, asyncHandler(async (req, res) => {
  const body = z.object({
    fullName: z.string().min(2).optional(),
    email:    z.string().email().optional(),
    phone:    z.string().optional(),
  }).parse(req.body)
  const user = await prisma.user.update({
    where: { id: req.user!.sub },
    data: {
      ...(body.fullName ? { name: body.fullName } : {}),
      ...(body.email    ? { email: body.email   } : {}),
    },
  })
  res.json({ header: { status: 'SUCCESS', code: '200', message: 'Profile updated', requestId: '', timestamp: new Date().toISOString() }, body: { id: user.id, email: user.email, name: user.name } })
}))

app.post('/api/v1/auth/change-password', verifyJWT, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = z.object({ currentPassword: z.string(), newPassword: z.string().min(8) }).parse(req.body)
  const user = await prisma.user.findUnique({ where: { id: req.user!.sub } })
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    res.status(401).json({ header: { status: 'ERROR', code: '401', message: 'Incorrect current password' }, body: null })
    return
  }
  const hash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } })
  res.json({ header: { status: 'SUCCESS', code: '200', message: 'Password changed', requestId: '', timestamp: new Date().toISOString() }, body: null })
}))

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err.message

  if (message === 'INVALID_CREDENTIALS') {
    res.status(401).json({ header: { status: 'ERROR', code: '401', message: 'Invalid email or password' }, body: null })
    return
  }
  if (message.startsWith('ACCOUNT_LOCKED')) {
    const mins = message.split(':')[1]
    res.status(401).json({ header: { status: 'ERROR', code: '401', message: `Account locked. Try again in ${mins} minutes` }, body: null })
    return
  }
  if (message === 'TENANT_NOT_FOUND') {
    res.status(401).json({ header: { status: 'ERROR', code: '401', message: 'Invalid credentials' }, body: null })
    return
  }
  if (message === 'INVALID_REFRESH_TOKEN') {
    res.status(401).json({ header: { status: 'ERROR', code: '401', message: 'Invalid or expired refresh token' }, body: null })
    return
  }

  // Zod validation error
  if (err.name === 'ZodError') {
    res.status(400).json({ header: { status: 'ERROR', code: '400', message: 'Validation failed' }, body: err })
    return
  }

  logger.error('Unhandled error', { error: message, stack: err.stack })
  res.status(500).json({ header: { status: 'ERROR', code: '500', message: 'Internal server error' }, body: null })
})

app.listen(PORT, () => logger.info(`Auth service running on :${PORT}`))

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  redis.disconnect()
  process.exit(0)
})
