import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import { PrismaClient } from '@prisma/client'
import { Kafka } from 'kafkajs'
import { createLogger } from '@apex/logger'
import { errorHandler, attachRequestId, verifyJWT, checkRole, asyncHandler, success, paginated } from '@apex/middleware'
import { CaseAssignSchema, PaymentRecordSchema } from '@apex/shared'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

const logger = createLogger('cms-service')
const PORT = process.env['CMS_SERVICE_PORT'] ?? 3006
const prisma = new PrismaClient()
const kafka = new Kafka({ clientId: 'cms-service', brokers: (process.env['KAFKA_BROKERS'] ?? 'localhost:9092').split(',') })
const producer = kafka.producer()

const app = express()
app.use(helmet()); app.use(cors({ origin: (process.env['CORS_ORIGINS'] ?? '').split(','), credentials: true }))
app.use(express.json()); app.use(morgan('combined')); app.use(attachRequestId)
app.get('/health', (_req, res) => res.json({ status: 'UP', service: 'cms-service' }))

const router = express.Router()

router.get('/metrics', verifyJWT, checkRole('ADMIN','COLLECTION_MANAGER','BRANCH_MANAGER','SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const [totalOverdue, cases, npa] = await Promise.all([
    prisma.collectionCase.aggregate({ where: { tenantId: req.user!.tenantId, status: { in: ['OPEN','IN_PROGRESS'] } }, _sum: { outstandingAmount: true } }),
    prisma.collectionCase.count({ where: { tenantId: req.user!.tenantId, status: { in: ['OPEN','IN_PROGRESS'] } } }),
    prisma.loan.count({ where: { tenantId: req.user!.tenantId, status: 'NPA', deletedAt: null } }),
  ])
  success(res, { totalOverdue: totalOverdue._sum.outstandingAmount ?? 0, activeCases: cases, npaBorrowers: npa }, 200, 'OK', req.requestId)
}))

router.get('/cases', verifyJWT, checkRole('COLLECTION_AGENT','COLLECTION_MANAGER','ADMIN','SUPER_ADMIN','BRANCH_MANAGER'), asyncHandler(async (req, res) => {
  const page = Number(req.query['page'] ?? 1), limit = Number(req.query['limit'] ?? 20)
  const isAgent = req.user!.role === 'COLLECTION_AGENT'
  const [items, total] = await Promise.all([
    prisma.collectionCase.findMany({
      where: { tenantId: req.user!.tenantId, status: { in: ['OPEN','IN_PROGRESS'] }, ...(isAgent ? { assignedAgentId: req.user!.sub } : {}) },
      include: { customer: { select: { fullName: true, mobile: true } }, loan: { select: { loanId: true, productType: true } } },
      orderBy: { dpd: 'desc' }, skip: (page-1)*limit, take: limit,
    }),
    prisma.collectionCase.count({ where: { tenantId: req.user!.tenantId } }),
  ])
  paginated(res, items, { page, limit, total }, req.requestId)
}))

router.post('/case', verifyJWT, checkRole('COLLECTION_MANAGER','ADMIN','SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const body = CaseAssignSchema.parse(req.body)
  const loan = await prisma.loan.findFirst({ where: { id: body.loanId, tenantId: req.user!.tenantId } })
  if (!loan) { res.status(404).json({ header: { status: 'ERROR', code: '404', message: 'Loan not found' }, body: null }); return }
  const c = await prisma.collectionCase.create({ data: {
    tenantId: req.user!.tenantId, caseId: `CMS-${Date.now()}`, loanId: body.loanId,
    customerId: loan.customerId, dpd: loan.dpd, bucket: loan.bucket,
    outstandingAmount: loan.outstandingBalance, nba: body.nba,
    assignedAgentId: body.agentId, status: 'IN_PROGRESS', createdBy: req.user!.sub,
  }})
  try { await producer.send({ topic: 'collection.case.created', messages: [{ key: req.user!.tenantId, value: JSON.stringify({ eventId: uuidv4(), tenantId: req.user!.tenantId, payload: { caseId: c.id } }) }] }) } catch {}
  success(res, c, 201, 'Case assigned', req.requestId)
}))

const CaseActionSchema = z.object({
  action: z.enum(['FIELD_VISIT','PHONE_CALL','SMS','EMAIL','EMAIL_SMS','LEGAL_NOTICE','RESTRUCTURE']),
  notes:  z.string().max(1000).optional(),
})

router.post('/case/:id/action', verifyJWT, checkRole('COLLECTION_AGENT','COLLECTION_MANAGER','ADMIN','SUPER_ADMIN','BRANCH_MANAGER'), asyncHandler(async (req, res) => {
  const body = CaseActionSchema.parse(req.body)

  // Accept either the DB primary key (uuid) or the business caseId like "CMS-123..."
  const idParam = req.params['id']!
  const existing = await prisma.collectionCase.findFirst({
    where: {
      tenantId: req.user!.tenantId,
      OR: [{ id: idParam }, { caseId: idParam }],
    },
  })
  if (!existing) {
    res.status(404).json({ header: { status: 'ERROR', code: '404', message: 'Collection case not found' }, body: null })
    return
  }

  // Map EMAIL_SMS (frontend alias) → SMS for the NBA enum
  const mapped = body.action === 'EMAIL_SMS' ? 'SMS' : body.action

  const updated = await prisma.collectionCase.update({
    where: { id: existing.id },
    data: {
      nba: mapped as never,
      status: 'IN_PROGRESS',
      lastActivityAt: new Date(),
      updatedBy: req.user!.sub,
    },
  })

  try {
    await producer.send({
      topic: 'collection.case.action',
      messages: [{
        key: req.user!.tenantId,
        value: JSON.stringify({
          eventId: uuidv4(),
          tenantId: req.user!.tenantId,
          payload: {
            caseId: updated.id,
            businessCaseId: updated.caseId,
            action: mapped,
            triggeredBy: req.user!.sub,
            notes: body.notes,
          },
        }),
      }],
    })
  } catch {}

  success(res, updated, 200, `Action ${mapped} triggered`, req.requestId)
}))

router.post('/payment', verifyJWT, checkRole('COLLECTION_AGENT','COLLECTION_MANAGER','ADMIN','SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const body = PaymentRecordSchema.parse(req.body)
  const payment = await prisma.payment.create({ data: {
    tenantId: req.user!.tenantId, paymentId: `PAY-${Date.now()}`,
    caseId: body.caseId, loanId: body.loanId, customerId: '', amount: parseFloat(body.amount),
    paymentMode: body.paymentMode, receivedBy: req.user!.sub,
    ...(body.gpsLat ? { gpsLat: body.gpsLat } : {}), ...(body.gpsLng ? { gpsLng: body.gpsLng } : {}),
  }})
  await prisma.collectionCase.update({ where: { id: body.caseId }, data: { status: 'PAYMENT_RECEIVED', lastActivityAt: new Date() } })
  try { await producer.send({ topic: 'collection.payment.recorded', messages: [{ key: req.user!.tenantId, value: JSON.stringify({ eventId: uuidv4(), tenantId: req.user!.tenantId, payload: { paymentId: payment.id, amount: body.amount } }) }] }) } catch {}
  success(res, payment, 201, 'Payment recorded', req.requestId)
}))

app.use('/api/v1/collection', router)
app.use(errorHandler)

async function start() {
  try { await producer.connect() } catch (e) { logger.warn('Kafka unavailable') }
  app.listen(PORT, () => logger.info(`CMS service on :${PORT}`))
}
start()
