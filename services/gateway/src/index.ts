import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '@apex/logger'

const logger = createLogger('gateway')

const app = express()
const PORT = process.env['GATEWAY_PORT'] ?? 3000

// ── Services registry ─────────────────────────────────────────────────────────
const SERVICES: Record<string, string> = {
  auth:         process.env['AUTH_SERVICE_URL']         ?? 'http://localhost:3001',
  loans:        process.env['LOAN_SERVICE_URL']         ?? 'http://localhost:3002',
  ews:          process.env['EWS_SERVICE_URL']          ?? 'http://localhost:3003',
  aml:          process.env['AML_SERVICE_URL']          ?? 'http://localhost:3004',
  dms:          process.env['DMS_SERVICE_URL']          ?? 'http://localhost:3005',
  collection:   process.env['CMS_SERVICE_URL']          ?? 'http://localhost:3006',
  ifrs9:        process.env['IFRS9_SERVICE_URL']        ?? 'http://localhost:3007',
  alm:          process.env['ALM_SERVICE_URL']          ?? 'http://localhost:3008',
  notifications:process.env['NOTIFICATION_SERVICE_URL']?? 'http://localhost:3009',
  reports:      process.env['REPORT_SERVICE_URL']       ?? 'http://localhost:3010',
  dwh:          process.env['DWH_SERVICE_URL']          ?? 'http://localhost:3011',
  rating:       process.env['RATING_SERVICE_URL']       ?? 'http://localhost:3002', // reuses loan-service
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
    },
  },
}))

app.use(cors({
  origin: (process.env['CORS_ORIGINS'] ?? 'http://localhost:5173,http://localhost:5174').split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Tenant-ID'],
}))

app.use(morgan('combined'))

// Attach request ID to every request
app.use((req, _res, next) => {
  req.headers['x-request-id'] ??= uuidv4()
  next()
})

// Global rate limiter
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { header: { status: 'ERROR', code: '429', message: 'Too many requests' }, body: null },
}))

// Auth rate limiter (tighter for auth endpoints, but relaxed in development
// so E2E test runs don't hit the ceiling).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env['NODE_ENV'] === 'production' ? 20 : 500,
  message: { header: { status: 'ERROR', code: '429', message: 'Too many auth attempts' }, body: null },
})

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'UP', service: 'gateway', timestamp: new Date().toISOString() })
})

app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'UP',
    service: 'gateway',
    services: Object.keys(SERVICES),
    timestamp: new Date().toISOString(),
  })
})

// ── Proxy routes ──────────────────────────────────────────────────────────────
// Express strips the mount path before the proxy sees `req.url`, so we
// restore it via `pathRewrite` so downstream services still see the full
// `/api/v1/...` path they're routed on.
const proxy = (target: string, prefix: string) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path) => `${prefix}${path}`,
    on: {
      error: (err, _req, res) => {
        logger.error('Proxy error', { error: err.message, target })
        if ('status' in res && typeof res.status === 'function') {
          res.status(503).json({
            header: { status: 'ERROR', code: '503', message: 'Service temporarily unavailable' },
            body: null,
          })
        }
      },
    },
  })

// Auth (public — no JWT check at gateway level, service handles it)
app.use('/api/v1/auth', authLimiter, proxy(SERVICES['auth']!, '/api/v1/auth'))

// Domain services — all protected (JWT verified at each service)
app.use('/api/v1/los',          proxy(SERVICES['loans']!,        '/api/v1/los'))
app.use('/api/v1/loans',        proxy(SERVICES['loans']!,        '/api/v1/loans'))
app.use('/api/v1/ews',          proxy(SERVICES['ews']!,          '/api/v1/ews'))
app.use('/api/v1/aml',          proxy(SERVICES['aml']!,          '/api/v1/aml'))
app.use('/api/v1/dms',          proxy(SERVICES['dms']!,          '/api/v1/dms'))
app.use('/api/v1/collection',   proxy(SERVICES['collection']!,   '/api/v1/collection'))
app.use('/api/v1/ifrs9',        proxy(SERVICES['ifrs9']!,        '/api/v1/ifrs9'))
app.use('/api/v1/alm',          proxy(SERVICES['alm']!,          '/api/v1/alm'))
app.use('/api/v1/notifications',proxy(SERVICES['notifications']!,'/api/v1/notifications'))
app.use('/api/v1/reports',      proxy(SERVICES['reports']!,      '/api/v1/reports'))
app.use('/api/v1/dwh',          proxy(SERVICES['dwh']!,          '/api/v1/dwh'))
app.use('/api/v1/rating',       proxy(SERVICES['rating']!,       '/api/v1/rating'))

// Portal (customer-facing endpoints) — specific sub-routes first, then catch-all
app.use('/api/v1/portal/auth',            authLimiter, proxy(SERVICES['auth']!,  '/api/v1/portal/auth'))
app.use('/api/v1/portal/profile',         proxy(SERVICES['auth']!,   '/api/v1/portal/profile'))
app.use('/api/v1/portal/change-password', proxy(SERVICES['auth']!,   '/api/v1/portal/change-password'))
app.use('/api/v1/portal/dms',             proxy(SERVICES['dms']!,    '/api/v1/portal/dms'))
app.use('/api/v1/portal/los',             proxy(SERVICES['loans']!,  '/api/v1/portal/los'))
app.use('/api/v1/portal',                 proxy(SERVICES['loans']!,  '/api/v1/portal'))

// 404
app.use('*', (_req, res) => {
  res.status(404).json({
    header: { status: 'ERROR', code: '404', message: 'Route not found' },
    body: null,
  })
})

app.listen(PORT, () => {
  logger.info(`API Gateway running on :${PORT}`)
  logger.info('Proxying to services:', SERVICES)
})

export default app
