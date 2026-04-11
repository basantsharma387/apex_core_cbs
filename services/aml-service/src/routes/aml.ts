import { Router } from 'express'
import { z } from 'zod'
import { AMLMonitorSchema, STRCreateSchema, PaginationSchema } from '@apex/shared'
import type { AMLService } from '../services/amlService.js'
import { verifyJWT, checkRole, asyncHandler } from '@apex/middleware'

export function amlRouter(amlService: AMLService): Router {
  const router = Router()

  router.get('/metrics', verifyJWT, checkRole('COMPLIANCE_OFFICER', 'ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER'),
    asyncHandler(async (req, res) => {
      const metrics = await amlService.getDashboardMetrics(req.user!.tenantId)
      res.json({ header: { status: 'SUCCESS', code: '200', message: 'OK', requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() }, body: metrics })
    })
  )

  router.get('/alerts', verifyJWT, checkRole('COMPLIANCE_OFFICER', 'ADMIN', 'SUPER_ADMIN'),
    asyncHandler(async (req, res) => {
      const filters = PaginationSchema.merge(
        z.object({ status: z.string().optional(), riskLevel: z.string().optional() })
      ).parse(req.query)
      const data = await amlService.getAlerts(req.user!.tenantId, filters)
      res.json({ header: { status: 'SUCCESS', code: '200', message: 'OK', requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() }, body: data })
    })
  )

  router.post('/monitor', verifyJWT, checkRole('COMPLIANCE_OFFICER', 'ADMIN', 'SUPER_ADMIN'),
    asyncHandler(async (req, res) => {
      const input = AMLMonitorSchema.parse(req.body)
      const result = await amlService.monitorTransaction(req.user!.tenantId, req.user!.sub, input)
      res.status(201).json({ header: { status: 'SUCCESS', code: '201', message: 'Transaction monitored', requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() }, body: result })
    })
  )

  router.post('/str', verifyJWT, checkRole('COMPLIANCE_OFFICER', 'ADMIN', 'SUPER_ADMIN'),
    asyncHandler(async (req, res) => {
      const input = STRCreateSchema.parse(req.body)
      const str = await amlService.createSTR(req.user!.tenantId, req.user!.sub, input)
      res.status(201).json({ header: { status: 'SUCCESS', code: '201', message: 'STR created', requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() }, body: str })
    })
  )

  router.patch('/alerts/:id/status', verifyJWT, checkRole('COMPLIANCE_OFFICER', 'ADMIN', 'SUPER_ADMIN'),
    asyncHandler(async (req, res) => {
      const { status } = z.object({ status: z.enum(['UNDER_REVIEW', 'CLEARED']) }).parse(req.body)
      const updated = await amlService.updateAlertStatus(req.user!.tenantId, req.params['id']!, req.user!.sub, status)
      res.json({ header: { status: 'SUCCESS', code: '200', message: 'Alert updated', requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() }, body: updated })
    })
  )

  return router
}
