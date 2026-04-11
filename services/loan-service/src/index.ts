import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import { PrismaClient } from '@prisma/client'
import { Kafka } from 'kafkajs'
import { createLogger } from '@apex/logger'
import { errorHandler, attachRequestId, verifyJWT, asyncHandler, success } from '@apex/middleware'
import { z } from 'zod'
import { loanRouter } from './routes/loans.js'
import { applicationRouter } from './routes/applications.js'
import { LoanService } from './services/loanService.js'

const logger = createLogger('loan-service')
const PORT = process.env['LOAN_SERVICE_PORT'] ?? 3002
const prisma = new PrismaClient()
const kafka = new Kafka({ clientId: 'loan-service', brokers: (process.env['KAFKA_BROKERS'] ?? 'localhost:9092').split(',') })
const producer = kafka.producer()
const loanService = new LoanService(prisma, producer)

const PortalApplySchema = z.object({
  productType:     z.string().min(1),
  purpose:         z.string().min(3),
  requestedAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  requestedTenure: z.coerce.number().int().min(3).max(360),
})

const app = express()
app.use(helmet())
app.use(cors({ origin: (process.env['CORS_ORIGINS'] ?? '').split(','), credentials: true }))
app.use(express.json())
app.use(morgan('combined'))
app.use(attachRequestId)

app.get('/health', (_req, res) => res.json({ status: 'UP', service: 'loan-service' }))
app.use('/api/v1/loans', loanRouter(loanService))
app.use('/api/v1/los', applicationRouter(loanService))

// Rating service endpoints (hosted by loan-service in this monolith-leaning setup)
app.post('/api/v1/rating/calculate', verifyJWT, asyncHandler(async (req, res) => {
  const { customerId } = z.object({ customerId: z.string().min(1) }).parse(req.body)
  const data = await loanService.calculateCreditScore(req.user!.tenantId, customerId)
  success(res, data, 200, 'OK', req.requestId)
}))

// Portal routes — customer-facing (scoped to logged-in customer)
app.get('/api/v1/portal/loans/my', verifyJWT, asyncHandler(async (req, res) => {
  const customerId = req.user!.customerId
  if (!customerId) { res.status(403).json({ header: { status: 'ERROR', code: '403', message: 'Portal access only' }, body: null }); return }
  const loans = await prisma.loan.findMany({
    where: { tenantId: req.user!.tenantId, customerId, deletedAt: null },
    include: {
      repayments: { where: { status: 'PENDING' }, orderBy: { dueDate: 'asc' }, take: 3 },
    },
    orderBy: { createdAt: 'desc' },
  })
  success(res, loans, 200, 'OK', req.requestId)
}))
app.use('/api/v1/portal/loans', loanRouter(loanService))

// Portal LOS — customer self-apply
const portalLosRouter = express.Router()
portalLosRouter.post('/apply', verifyJWT, asyncHandler(async (req, res) => {
  const user = req.user!
  if (!user.customerId) { res.status(403).json({ header: { status: 'ERROR', code: '403', message: 'Portal access only' }, body: null }); return }
  const body = PortalApplySchema.parse(req.body)
  const app = await loanService.createApplication(user.tenantId, user.sub, 'PORTAL', {
    customerId: user.customerId, productType: body.productType, purpose: body.purpose,
    requestedAmount: body.requestedAmount, requestedTenure: body.requestedTenure,
  })
  success(res, app, 201, 'Application submitted', req.requestId)
}))
app.use('/api/v1/portal/los', portalLosRouter)

// Portal statements — EMI payment history
app.get('/api/v1/portal/statements', verifyJWT, asyncHandler(async (req, res) => {
  const customerId = req.user!.customerId
  if (!customerId) { res.status(403).json({ header: { status: 'ERROR', code: '403', message: 'Portal access only' }, body: null }); return }
  const year  = Number(req.query['year']  ?? new Date().getFullYear())
  const month = Number(req.query['month'] ?? new Date().getMonth() + 1)
  const startDate = new Date(year, month - 1, 1)
  const endDate   = new Date(year, month, 0, 23, 59, 59)
  const repayments = await prisma.repaymentSchedule.findMany({
    where: { loan: { tenantId: req.user!.tenantId, customerId }, dueDate: { gte: startDate, lte: endDate } },
    include: { loan: { select: { loanId: true, productType: true } } },
    orderBy: { dueDate: 'desc' },
  })
  let running = 0
  const rows = repayments.map(r => {
    const amt = Number(r.totalDue)
    running += r.status !== 'PENDING' ? amt : 0
    return {
      id: r.id,
      date: r.paidAt ?? r.dueDate,
      balance: running,
      description: `EMI — ${r.loan.productType} ${r.loan.loanId}`,
      debit: r.status !== 'PENDING' ? amt : undefined,
      credit: undefined,
      type: r.status !== 'PENDING' ? 'EMI' : 'PENDING',
    }
  })
  success(res, rows, 200, 'OK', req.requestId)
}))

app.use(errorHandler)

async function start() {
  try { await producer.connect(); logger.info('Kafka producer connected') }
  catch (e) { logger.warn('Kafka unavailable', { error: (e as Error).message }) }
  app.listen(PORT, () => logger.info(`Loan service on :${PORT}`))
}
start()
process.on('SIGTERM', async () => { await producer.disconnect().catch(() => {}); await prisma.$disconnect(); process.exit(0) })
