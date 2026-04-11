import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { PrismaClient } from '@prisma/client'
import type { Redis } from 'ioredis'
import type { AuthTokens, JWTPayload } from '@apex/shared'
import { createLogger } from '@apex/logger'

const logger = createLogger('auth-service')

const ACCESS_SECRET  = process.env['JWT_ACCESS_SECRET']  ?? 'dev-access-secret'
const REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'] ?? 'dev-refresh-secret'
const ACCESS_EXPIRES  = process.env['JWT_ACCESS_EXPIRES_IN']  ?? '15m'
const REFRESH_EXPIRES = process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d'
const BCRYPT_ROUNDS   = parseInt(process.env['BCRYPT_ROUNDS'] ?? '12', 10)
const MAX_ATTEMPTS    = 5
const LOCKOUT_MINUTES = 30

export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
  ) {}

  async login(email: string, password: string, tenantCode: string): Promise<AuthTokens> {
    const tenant = await this.prisma.tenant.findUnique({ where: { code: tenantCode } })
    if (!tenant?.isActive) throw new Error('TENANT_NOT_FOUND')

    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
    })

    if (!user || !user.isActive || user.deletedAt) throw new Error('INVALID_CREDENTIALS')

    // Check lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000)
      throw new Error(`ACCOUNT_LOCKED:${mins}`)
    }

    const valid = await bcrypt.compare(password, user.passwordHash)

    if (!valid) {
      const attempts = user.failedAttempts + 1
      const updates: Parameters<typeof this.prisma.user.update>[0]['data'] = { failedAttempts: attempts }
      if (attempts >= MAX_ATTEMPTS) {
        updates['lockedUntil'] = new Date(Date.now() + LOCKOUT_MINUTES * 60_000)
        logger.warn('Account locked', { userId: user.id, email })
      }
      await this.prisma.user.update({ where: { id: user.id }, data: updates })
      throw new Error('INVALID_CREDENTIALS')
    }

    // Reset failed attempts on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    })

    return this.issueTokens(user.id, {
      sub: user.id,
      tenantId: tenant.id,
      role: user.role,
      email: user.email,
      name: user.name,
    } as Omit<JWTPayload, 'iat' | 'exp'>)
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: { sub: string }
    try {
      payload = jwt.verify(refreshToken, REFRESH_SECRET) as { sub: string }
    } catch {
      throw new Error('INVALID_REFRESH_TOKEN')
    }

    // Check token in DB (rotation — single-use)
    const stored = await this.prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      // Possible token reuse — revoke all for this user
      if (stored?.userId) {
        await this.prisma.refreshToken.updateMany({
          where: { userId: stored.userId },
          data: { isRevoked: true },
        })
        logger.warn('Possible refresh token reuse — all tokens revoked', { userId: stored.userId })
      }
      throw new Error('INVALID_REFRESH_TOKEN')
    }

    // Revoke used token
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { isRevoked: true } })

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { tenant: true },
    })
    if (!user || !user.isActive) throw new Error('USER_NOT_FOUND')

    return this.issueTokens(user.id, {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
      name: user.name,
    } as Omit<JWTPayload, 'iat' | 'exp'>)
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    })
    // Blacklist cache entry (belt-and-suspenders)
    await this.redis.setex(`blacklist:user:${userId}`, 15 * 60, '1')
  }

  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      return jwt.verify(token, ACCESS_SECRET) as JWTPayload
    } catch (err) {
      throw new Error('INVALID_TOKEN')
    }
  }

  private async issueTokens(
    userId: string,
    payload: Omit<JWTPayload, 'iat' | 'exp'>,
  ): Promise<AuthTokens> {
    const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions)

    const refreshToken = uuidv4() + '-' + uuidv4()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await this.prisma.refreshToken.create({
      data: { userId, token: refreshToken, expiresAt },
    })

    return { accessToken, refreshToken, expiresIn: 15 * 60 }
  }
}
