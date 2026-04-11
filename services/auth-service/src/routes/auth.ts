import { Router } from 'express'
import { z } from 'zod'
import { LoginSchema, RefreshTokenSchema } from '@apex/shared'
import type { AuthService } from '../services/authService.js'
import { verifyJWT, asyncHandler } from '../middleware/jwt.js'

export function authRouter(authService: AuthService): Router {
  const router = Router()

  // POST /api/v1/auth/login
  router.post('/login', asyncHandler(async (req, res) => {
    const body = LoginSchema.parse(req.body)
    const tokens = await authService.login(body.email, body.password, body.tenantCode)

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    })

    res.json({
      header: { status: 'SUCCESS', code: '200', message: 'Login successful', requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() },
      body: { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn },
    })
  }))

  // POST /api/v1/auth/refresh
  router.post('/refresh', asyncHandler(async (req, res) => {
    const cookieToken = req.cookies?.['refreshToken'] as string | undefined
    const bodyToken = req.body?.['refreshToken'] as string | undefined
    const refreshToken = cookieToken ?? bodyToken

    if (!refreshToken) {
      res.status(401).json({ header: { status: 'ERROR', code: '401', message: 'Refresh token required' }, body: null })
      return
    }

    const tokens = await authService.refresh(refreshToken)

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    })

    res.json({
      header: { status: 'SUCCESS', code: '200', message: 'Token refreshed', requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() },
      body: { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn },
    })
  }))

  // POST /api/v1/auth/logout
  router.post('/logout', verifyJWT, asyncHandler(async (req, res) => {
    await authService.logout(req.user!.sub)
    res.clearCookie('refreshToken', { path: '/api/v1/auth' })
    res.json({
      header: { status: 'SUCCESS', code: '200', message: 'Logged out successfully', requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() },
      body: null,
    })
  }))

  // GET /api/v1/auth/me
  router.get('/me', verifyJWT, asyncHandler(async (req, res) => {
    res.json({
      header: { status: 'SUCCESS', code: '200', message: 'OK', requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() },
      body: req.user,
    })
  }))

  // POST /api/v1/auth/verify — internal use by other services
  router.post('/verify', asyncHandler(async (req, res) => {
    const { token } = z.object({ token: z.string() }).parse(req.body)
    const payload = await authService.verifyToken(token)
    res.json({
      header: { status: 'SUCCESS', code: '200', message: 'Valid token', requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() },
      body: payload,
    })
  }))

  return router
}
