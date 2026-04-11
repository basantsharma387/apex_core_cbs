import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import { z } from 'zod'
import { createLogger } from '@apex/logger'
import { errorHandler, attachRequestId, verifyJWT, checkRole, asyncHandler, success } from '@apex/middleware'
import {
  computeLiquidityGap,
  computeIRRBB,
  computeFTPCurve,
  computeLCR,
  computeNSFR,
  DEFAULT_BUCKETS,
  DEFAULT_ASSETS,
  DEFAULT_LIABILITIES,
} from './services/almEngine.js'

const logger = createLogger('alm-service')
const PORT = process.env['ALM_SERVICE_PORT'] ?? 3008

const app = express()
app.use(helmet())
app.use(cors({ origin: (process.env['CORS_ORIGINS'] ?? '').split(','), credentials: true }))
app.use(express.json())
app.use(morgan('combined'))
app.use(attachRequestId)

app.get('/health', (_req, res) => res.json({ status: 'UP', service: 'alm-service' }))

const router = express.Router()

const READER_ROLES = ['RISK_ANALYST', 'ADMIN', 'SUPER_ADMIN', 'AUDITOR'] as const
const WRITER_ROLES = ['RISK_ANALYST', 'ADMIN', 'SUPER_ADMIN'] as const

// ── GET /api/v1/alm/summary ───────────────────────────────────────────────────
router.get('/summary', verifyJWT, checkRole(...READER_ROLES), asyncHandler(async (_req, res) => {
  const lcr = computeLCR()
  const nsfr = computeNSFR()
  const gap = computeLiquidityGap(DEFAULT_BUCKETS, DEFAULT_ASSETS, DEFAULT_LIABILITIES)
  const totalAssets = DEFAULT_ASSETS.reduce((s, a) => s + a.amount, 0)
  const totalLiabilities = DEFAULT_LIABILITIES.reduce((s, l) => s + l.amount, 0)

  success(res, {
    lcr: Number(lcr.ratio.toFixed(1)),
    nsfr: Number(nsfr.ratio.toFixed(1)),
    cumulativeGap: gap.reduce((s, b) => s + b.cumulativeGap, 0),
    totalAssets,
    totalLiabilities,
    netInterestIncome: Math.round(totalAssets * 0.032 - totalLiabilities * 0.018),
    asOf: new Date().toISOString(),
  }, 200, 'OK', (_req as any).requestId)
}))

// ── GET /api/v1/alm/liquidity-gap ─────────────────────────────────────────────
router.get('/liquidity-gap', verifyJWT, checkRole(...READER_ROLES), asyncHandler(async (_req, res) => {
  const rows = computeLiquidityGap(DEFAULT_BUCKETS, DEFAULT_ASSETS, DEFAULT_LIABILITIES)
  success(res, { items: rows }, 200, 'OK', (_req as any).requestId)
}))

// ── GET /api/v1/alm/irrbb ─────────────────────────────────────────────────────
router.get('/irrbb', verifyJWT, checkRole(...READER_ROLES), asyncHandler(async (_req, res) => {
  const shocks = [-200, -100, 0, 100, 200]
  const scenarios = shocks.map(bps => computeIRRBB(bps, DEFAULT_ASSETS, DEFAULT_LIABILITIES))
  success(res, { scenarios }, 200, 'OK', (_req as any).requestId)
}))

// ── GET /api/v1/alm/ftp-curve ─────────────────────────────────────────────────
router.get('/ftp-curve', verifyJWT, checkRole(...READER_ROLES), asyncHandler(async (_req, res) => {
  const curve = computeFTPCurve()
  success(res, { items: curve }, 200, 'OK', (_req as any).requestId)
}))

// ── GET /api/v1/alm/ratios ────────────────────────────────────────────────────
router.get('/ratios', verifyJWT, checkRole(...READER_ROLES), asyncHandler(async (_req, res) => {
  success(res, {
    lcr: computeLCR(),
    nsfr: computeNSFR(),
  }, 200, 'OK', (_req as any).requestId)
}))

// ── POST /api/v1/alm/simulate — run a custom IRRBB shock ──────────────────────
const SimulateSchema = z.object({
  shockBps: z.number().int().min(-500).max(500),
})

router.post('/simulate', verifyJWT, checkRole(...WRITER_ROLES), asyncHandler(async (req, res) => {
  const parsed = SimulateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      header: { status: 'ERROR', code: '400', message: 'Validation failed' },
      body: parsed.error.issues,
    })
    return
  }
  const scenario = computeIRRBB(parsed.data.shockBps, DEFAULT_ASSETS, DEFAULT_LIABILITIES)
  success(res, scenario, 200, 'Simulation complete', (req as any).requestId)
}))

app.use('/api/v1/alm', router)
app.use(errorHandler)

app.listen(PORT, () => logger.info(`ALM service running on :${PORT}`))

process.on('SIGTERM', () => process.exit(0))
