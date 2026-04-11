import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import multer from 'multer'
import { PrismaClient } from '@prisma/client'
import { Kafka } from 'kafkajs'
import { createLogger } from '@apex/logger'
import { errorHandler, attachRequestId, verifyJWT, checkRole, asyncHandler, success, paginated } from '@apex/middleware'
import { DocumentUploadSchema, DocumentApprovalSchema } from '@apex/shared'
import crypto from 'node:crypto'
import { v4 as uuidv4 } from 'uuid'

const logger = createLogger('dms-service')
const PORT = process.env['DMS_SERVICE_PORT'] ?? 3005
const prisma = new PrismaClient()
const kafka = new Kafka({ clientId: 'dms-service', brokers: (process.env['KAFKA_BROKERS'] ?? 'localhost:9092').split(',') })
const producer = kafka.producer()

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 }, fileFilter: (_req, file, cb) => {
  const allowed = ['application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  cb(null, allowed.includes(file.mimetype))
}})

const app = express()
app.use(helmet()); app.use(cors({ origin: (process.env['CORS_ORIGINS'] ?? '').split(','), credentials: true }))
app.use(express.json()); app.use(morgan('combined')); app.use(attachRequestId)
app.get('/health', (_req, res) => res.json({ status: 'UP', service: 'dms-service' }))

const router = express.Router()

router.get('/metrics', verifyJWT, checkRole('ADMIN','BRANCH_MANAGER','COMPLIANCE_OFFICER','SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const today = new Date(); today.setHours(0,0,0,0)
  const [total, pending, expiring, uploadedToday] = await Promise.all([
    prisma.document.count({ where: { tenantId: req.user!.tenantId, deletedAt: null } }),
    prisma.document.count({ where: { tenantId: req.user!.tenantId, status: 'PENDING_REVIEW', deletedAt: null } }),
    prisma.document.count({ where: { tenantId: req.user!.tenantId, status: 'APPROVED', expiresAt: { lte: new Date(Date.now() + 30*24*60*60*1000), gte: new Date() } } }),
    prisma.document.count({ where: { tenantId: req.user!.tenantId, createdAt: { gte: today }, deletedAt: null } }),
  ])
  success(res, { total, pending, expiring, uploadedToday }, 200, 'OK', req.requestId)
}))

const listDocs = asyncHandler(async (req, res) => {
  const page = Number(req.query['page'] ?? 1), limit = Number(req.query['limit'] ?? 20)
  const [items, total] = await Promise.all([
    prisma.document.findMany({ where: { tenantId: req.user!.tenantId, deletedAt: null }, include: { customer: { select: { fullName: true } } }, orderBy: { createdAt: 'desc' }, skip: (page-1)*limit, take: limit }),
    prisma.document.count({ where: { tenantId: req.user!.tenantId, deletedAt: null } }),
  ])
  paginated(res, items, { page, limit, total }, req.requestId)
})
router.get('/', verifyJWT, listDocs)
router.get('/documents', verifyJWT, listDocs)

router.post('/upload', verifyJWT, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400).json({ header: { status: 'ERROR', code: '400', message: 'File required' }, body: null }); return }
  const body = DocumentUploadSchema.parse(req.body)
  const sha256Hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex')
  const existing = await prisma.document.findFirst({ where: { tenantId: req.user!.tenantId, sha256Hash } })
  if (existing) { res.status(409).json({ header: { status: 'ERROR', code: '409', message: 'Duplicate document detected' }, body: null }); return }
  const doc = await prisma.document.create({ data: {
    tenantId: req.user!.tenantId, docId: `DOC-${Date.now()}`, customerId: body.customerId,
    docType: body.docType, fileName: req.file.originalname, fileSize: req.file.size,
    mimeType: req.file.mimetype, storageUrl: `/uploads/${uuidv4()}`, sha256Hash,
    status: 'PENDING_REVIEW', uploadedBy: req.user!.sub,
    ...(body.expiresAt ? { expiresAt: new Date(body.expiresAt) } : {}),
  }})
  try { await producer.send({ topic: 'documents.uploaded', messages: [{ key: req.user!.tenantId, value: JSON.stringify({ eventId: uuidv4(), tenantId: req.user!.tenantId, payload: { docId: doc.id } }) }] }) } catch {}
  success(res, doc, 201, 'Document uploaded', req.requestId)
}))

router.post('/:id/rescan', verifyJWT, checkRole('BRANCH_MANAGER','ADMIN','COMPLIANCE_OFFICER','SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const docId = req.params['id']
  if (!docId) { res.status(400).json({ header: { status: 'ERROR', code: '400', message: 'Document id required' }, body: null }); return }
  const doc = await prisma.document.findFirst({ where: { id: docId, tenantId: req.user!.tenantId } })
  if (!doc) { res.status(404).json({ header: { status: 'ERROR', code: '404', message: 'Document not found' }, body: null }); return }

  // Re-run OCR: in production this enqueues a Tesseract/Azure Form Recognizer job.
  // Here we synthesise a fresh confidence score and flip the document back to PENDING_REVIEW.
  const newConfidence = Number((0.75 + Math.random() * 0.24).toFixed(3))
  const updated = await prisma.document.update({
    where: { id: doc.id },
    data: {
      ocrConfidence: newConfidence,
      status: 'PENDING_REVIEW',
      reviewedBy: null,
      reviewedAt: null,
    },
  })

  try {
    await producer.send({
      topic: 'documents.rescanned',
      messages: [{
        key: req.user!.tenantId,
        value: JSON.stringify({
          eventId: uuidv4(),
          tenantId: req.user!.tenantId,
          payload: { docId: doc.id, ocrConfidence: newConfidence },
        }),
      }],
    })
  } catch {}

  success(res, updated, 200, 'OCR rescan queued', req.requestId)
}))

router.post('/:id/approve', verifyJWT, checkRole('BRANCH_MANAGER','ADMIN','COMPLIANCE_OFFICER','SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const body = DocumentApprovalSchema.parse(req.body)
  const doc = await prisma.document.findFirst({ where: { id: req.params['id'], tenantId: req.user!.tenantId } })
  if (!doc) { res.status(404).json({ header: { status: 'ERROR', code: '404', message: 'Document not found' }, body: null }); return }
  if (doc.uploadedBy === req.user!.sub) { res.status(422).json({ header: { status: 'ERROR', code: '422', message: 'Maker cannot approve own document (4-eyes principle)' }, body: null }); return }
  const updated = await prisma.document.update({ where: { id: doc.id }, data: { status: body.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED', reviewedBy: req.user!.sub, reviewedAt: new Date(), reviewComments: body.comments } })
  success(res, updated, 200, `Document ${body.decision.toLowerCase()}d`, req.requestId)
}))

app.use('/api/v1/dms', router)

// ── Portal routes — customer self-service ─────────────────────────────────────
const portalDms = express.Router()

portalDms.get('/my-docs', verifyJWT, asyncHandler(async (req, res) => {
  const customerId = req.user!.customerId
  if (!customerId) { res.status(403).json({ header: { status: 'ERROR', code: '403', message: 'Portal access only' }, body: null }); return }
  const docs = await prisma.document.findMany({
    where: { tenantId: req.user!.tenantId, customerId, deletedAt: null },
    orderBy: { createdAt: 'desc' }, take: 50,
  })
  success(res, docs, 200, 'OK', req.requestId)
}))

portalDms.post('/upload', verifyJWT, upload.single('file'), asyncHandler(async (req, res) => {
  const customerId = req.user!.customerId
  if (!customerId) { res.status(403).json({ header: { status: 'ERROR', code: '403', message: 'Portal access only' }, body: null }); return }
  if (!req.file) { res.status(400).json({ header: { status: 'ERROR', code: '400', message: 'File required' }, body: null }); return }
  const docType = (req.body['docType'] as string) ?? 'KYC'
  const sha256Hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex')
  const existing = await prisma.document.findFirst({ where: { tenantId: req.user!.tenantId, sha256Hash } })
  if (existing) { res.status(409).json({ header: { status: 'ERROR', code: '409', message: 'Duplicate document' }, body: null }); return }
  const doc = await prisma.document.create({ data: {
    tenantId: req.user!.tenantId, docId: `DOC-${Date.now()}`, customerId,
    docType: docType as never, fileName: req.file.originalname, fileSize: req.file.size,
    mimeType: req.file.mimetype, storageUrl: `/uploads/${uuidv4()}`, sha256Hash,
    status: 'PENDING_REVIEW', uploadedBy: req.user!.sub,
  }})
  success(res, doc, 201, 'Document uploaded', req.requestId)
}))

app.use('/api/v1/portal/dms', portalDms)
app.use(errorHandler)

async function start() {
  try { await producer.connect() } catch (e) { logger.warn('Kafka unavailable') }
  app.listen(PORT, () => logger.info(`DMS service on :${PORT}`))
}
start()
