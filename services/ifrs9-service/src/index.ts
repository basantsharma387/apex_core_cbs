import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import { PrismaClient } from '@prisma/client'
import { createLogger } from '@apex/logger'
import { errorHandler, attachRequestId, verifyJWT, checkRole, asyncHandler, success, paginated } from '@apex/middleware'
import { v4 as uuidv4 } from 'uuid'

const logger = createLogger('ifrs9-service')
const PORT = process.env['IFRS9_SERVICE_PORT'] ?? 3007
const prisma = new PrismaClient()
const app = express()
app.use(helmet()); app.use(cors({ origin: (process.env['CORS_ORIGINS'] ?? '').split(','), credentials: true }))
app.use(express.json()); app.use(morgan('combined')); app.use(attachRequestId)
app.get('/health', (_req, res) => res.json({ status: 'UP', service: 'ifrs9-service' }))

const router = express.Router()

router.get('/staging', verifyJWT, checkRole('RISK_ANALYST','ADMIN','SUPER_ADMIN','AUDITOR'), asyncHandler(async (req, res) => {
  const page = Number(req.query['page'] ?? 1), limit = Number(req.query['limit'] ?? 20)
  const [items, total] = await Promise.all([
    prisma.iFRSStaging.findMany({ where: { tenantId: req.user!.tenantId }, orderBy: { calculatedAt: 'desc' }, skip: (page-1)*limit, take: limit }),
    prisma.iFRSStaging.count({ where: { tenantId: req.user!.tenantId } }),
  ])
  paginated(res, items, { page, limit, total }, req.requestId)
}))

router.get('/summary', verifyJWT, checkRole('RISK_ANALYST','ADMIN','SUPER_ADMIN','AUDITOR'), asyncHandler(async (req, res) => {
  const latest = await prisma.iFRSStaging.findFirst({ where: { tenantId: req.user!.tenantId }, orderBy: { calculatedAt: 'desc' }, select: { batchId: true } })
  if (!latest) { success(res, { stage1: 0, stage2: 0, stage3: 0, totalECL: '0' }, 200, 'OK', req.requestId); return }
  const [s1, s2, s3, ecl] = await Promise.all([
    prisma.iFRSStaging.count({ where: { tenantId: req.user!.tenantId, batchId: latest.batchId, stage: 1 } }),
    prisma.iFRSStaging.count({ where: { tenantId: req.user!.tenantId, batchId: latest.batchId, stage: 2 } }),
    prisma.iFRSStaging.count({ where: { tenantId: req.user!.tenantId, batchId: latest.batchId, stage: 3 } }),
    prisma.iFRSStaging.aggregate({ where: { tenantId: req.user!.tenantId, batchId: latest.batchId }, _sum: { ecl: true } }),
  ])
  success(res, { stage1: s1, stage2: s2, stage3: s3, totalECL: ecl._sum.ecl ?? 0, lastBatch: latest.batchId }, 200, 'OK', req.requestId)
}))

router.post('/calculate', verifyJWT, checkRole('RISK_ANALYST','ADMIN','SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const batchId = `BATCH-${Date.now()}`
  const loans = await prisma.loan.findMany({ where: { tenantId: req.user!.tenantId, deletedAt: null, status: { in: ['ACTIVE','DISBURSED','NPA'] } } })
  const records = loans.map(l => {
    const pd = l.dpd >= 90 ? 0.75 : l.dpd >= 60 ? 0.45 : l.dpd >= 30 ? 0.20 : 0.05
    const lgd = 0.45; const ead = Number(l.outstandingBalance); const stage = l.dpd >= 90 ? 3 : l.dpd >= 30 ? 2 : 1
    return { tenantId: req.user!.tenantId, loanId: l.id, customerId: l.customerId, stage, pdScore: pd, lgd, ead, ecl: pd * lgd * ead, batchId, calculatedAt: new Date() }
  })
  await prisma.iFRSStaging.createMany({ data: records })
  success(res, { batchId, processed: records.length }, 201, 'ECL batch complete', req.requestId)
}))

app.use('/api/v1/ifrs9', router)
app.use(errorHandler)
app.listen(PORT, () => logger.info(`IFRS9 service on :${PORT}`))
