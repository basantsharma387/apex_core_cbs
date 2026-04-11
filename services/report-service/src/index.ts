import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import { PrismaClient } from '@prisma/client'
import { createLogger } from '@apex/logger'
import { errorHandler, attachRequestId, verifyJWT, checkRole, asyncHandler, success } from '@apex/middleware'

const logger = createLogger('report-service')
const PORT = process.env['REPORT_SERVICE_PORT'] ?? 3010
const prisma = new PrismaClient()
const app = express()
app.use(helmet()); app.use(cors({ origin: (process.env['CORS_ORIGINS'] ?? '').split(','), credentials: true }))
app.use(express.json()); app.use(morgan('combined')); app.use(attachRequestId)
app.get('/health', (_req, res) => res.json({ status: 'UP', service: 'report-service' }))

const router = express.Router()

router.get('/catalog', verifyJWT, asyncHandler(async (_req, res) => {
  const reports = [
    { id: 'loan-portfolio', name: 'Loan Portfolio MIS', category: 'Portfolio', frequency: 'Daily', format: ['PDF','XLSX'] },
    { id: 'npa-report', name: 'NPA & Credit Risk', category: 'Risk', frequency: 'Weekly', format: ['PDF','XLSX'] },
    { id: 'aml-str', name: 'AML CTR/STR Submission', category: 'Compliance', frequency: 'Monthly', format: ['PDF','JSON'] },
    { id: 'ifrs9-ecl', name: 'IFRS 9 Provisioning', category: 'Regulatory', frequency: 'Monthly', format: ['PDF','XLSX'] },
    { id: 'collection-efficiency', name: 'Collection Efficiency', category: 'Collections', frequency: 'Weekly', format: ['PDF','XLSX'] },
    { id: 'kyc-expiry', name: 'KYC Expiry Status', category: 'Compliance', frequency: 'Daily', format: ['XLSX'] },
  ]
  success(res, reports, 200, 'OK', _req.requestId)
}))

router.post('/generate', verifyJWT, checkRole('ADMIN','AUDITOR','COMPLIANCE_OFFICER','RISK_ANALYST','SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const { reportId, format = 'PDF' } = req.body as { reportId: string; format?: string }
  logger.info('Report generation requested', { reportId, format, tenantId: req.user!.tenantId })
  // In production: queue BullMQ job, return jobId
  success(res, { jobId: `JOB-${Date.now()}`, status: 'QUEUED', estimatedMs: 5000 }, 202, 'Report queued', req.requestId)
}))

// In-memory job list (demo). In production: query BullMQ or a job table.
router.get('/jobs', verifyJWT, asyncHandler(async (req, res) => {
  const now = new Date()
  const jobs = [
    { id: 'JOB-001', reportId: 'loan-portfolio',   status: 'COMPLETED', queuedAt: new Date(now.getTime() - 3600_000).toISOString(), completedAt: new Date(now.getTime() - 3540_000).toISOString(), lastRun: new Date(now.getTime() - 3540_000).toISOString() },
    { id: 'JOB-002', reportId: 'npa-report',       status: 'COMPLETED', queuedAt: new Date(now.getTime() - 7200_000).toISOString(), completedAt: new Date(now.getTime() - 7120_000).toISOString(), lastRun: new Date(now.getTime() - 7120_000).toISOString() },
    { id: 'JOB-003', reportId: 'ifrs9-ecl',        status: 'RUNNING',   queuedAt: new Date(now.getTime() - 120_000).toISOString(),  completedAt: null, lastRun: null },
    { id: 'JOB-004', reportId: 'aml-str',          status: 'PENDING',   queuedAt: new Date(now.getTime() - 30_000).toISOString(),   completedAt: null, lastRun: null },
  ]
  success(res, jobs, 200, 'OK', req.requestId)
}))

app.use('/api/v1/reports', router)
app.use(errorHandler)
app.listen(PORT, () => logger.info(`Report service on :${PORT}`))
